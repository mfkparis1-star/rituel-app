/**
 * Phase 3b — Skin Profile AI Analysis Result Screen.
 *
 * Reads memory.skin_profile (quiz answers), calls analyzeSkinFromQuiz,
 * writes result to memory.skin_profile_analysis. Premium-only screen
 * (gating enforced by paywall before navigation; defensive redirect
 * here too).
 *
 * Caches the AI result in memory; reuses it for 7 days before
 * regenerating. User can manually refresh.
 */
import { router } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import PillButton from '../../components/ui/PillButton';
import { useLanguage } from '../../hooks/useLanguage';
import { useMemory } from '../../hooks/useMemory';
import { usePremium } from '../../hooks/usePremium';
import { safeBack } from '../../utils/safeBack';
import { trackEvent } from '../../utils/analytics';
import { analyzeSkinFromQuiz } from '../../utils/skinProfileAnalysis';
import { SkinProfileAnalysis } from '../../utils/memory';
import { C, R, Sh, Sp } from '../../theme';

type Step = 'idle' | 'loading' | 'result' | 'error' | 'empty';

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function BackArrow({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M19 12H5" />
      <Path d="M12 19l-7-7 7-7" />
    </Svg>
  );
}

export default function SkinAnalysisResultScreen() {
  const { t, lang } = useLanguage();
  const { memory, patch, loading: memLoading } = useMemory();
  const { isPremium, loading: premiumLoading } = usePremium();
  const [step, setStep] = useState<Step>('idle');
  const [analysis, setAnalysis] = useState<SkinProfileAnalysis | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const sp = memory?.skin_profile;
  const cached = memory?.skin_profile_analysis;

  const isCacheFresh = (a: SkinProfileAnalysis | undefined): boolean => {
    if (!a?.createdAt) return false;
    const age = Date.now() - new Date(a.createdAt).getTime();
    return age < CACHE_TTL_MS;
  };

  const runAnalysis = useCallback(async () => {
    if (!sp) {
      setStep('empty');
      return;
    }
    setStep('loading');
    setErrorMsg('');
    try {
      const result = await analyzeSkinFromQuiz(sp, lang);
      await patch({ skin_profile_analysis: result });
      trackEvent('skin_profile_analysis_completed');
      setAnalysis(result);
      setStep('result');
    } catch (e: any) {
      setErrorMsg(e?.message || t('skinProfileAnalysis.error.body'));
      setStep('error');
    }
  }, [sp, lang, patch, t]);

  useEffect(() => {
    if (memLoading || premiumLoading) return;

    // Defensive premium gate — normal flow lands here only post-paywall
    // or as premium user. If somehow not premium, kick to paywall.
    if (!isPremium) {
      router.replace('/paywall?source=skin_quiz_ai' as any);
      return;
    }

    if (!sp) {
      setStep('empty');
      return;
    }

    if (cached && isCacheFresh(cached)) {
      setAnalysis(cached);
      setStep('result');
      return;
    }

    runAnalysis();
  }, [memLoading, premiumLoading, isPremium, sp, cached, runAnalysis]);

  const handleBack = () => safeBack('/(tabs)/auth');
  const handleQuizCta = () => router.push('/profile/skin-quiz' as any);
  const handleRefresh = () => runAnalysis();

  const formattedDate = (iso: string): string => {
    try {
      const d = new Date(iso);
      if (lang === 'fr') {
        return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
      }
      if (lang === 'tr') {
        return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
      }
      return d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return iso;
    }
  };

  // ----- Header (shared) -----
  const Header = (
    <View style={s.header}>
      <Pressable onPress={handleBack} hitSlop={10} style={s.backBtn}>
        <BackArrow color={C.espresso} />
      </Pressable>
    </View>
  );

  // ----- Loading -----
  if (step === 'loading' || memLoading || premiumLoading) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        {Header}
        <View style={s.centerBox}>
          <ActivityIndicator size="large" color={C.copper} />
          <Text style={s.loadingTitle}>{t('skinProfileAnalysis.loading')}</Text>
          <Text style={s.loadingSub}>{t('skinProfileAnalysis.loadingSub')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ----- Empty (no quiz answers) -----
  if (step === 'empty') {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        {Header}
        <View style={s.centerBox}>
          <Text style={s.emptyTitle}>{t('skinProfileAnalysis.empty.title')}</Text>
          <Text style={s.emptyBody}>{t('skinProfileAnalysis.empty.body')}</Text>
          <PillButton
            label={t('skinProfileAnalysis.empty.cta')}
            variant="primary"
            onPress={handleQuizCta}
            style={{ marginTop: Sp.lg }}
          />
        </View>
      </SafeAreaView>
    );
  }

  // ----- Error -----
  if (step === 'error') {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        {Header}
        <View style={s.centerBox}>
          <Text style={s.errorTitle}>{t('skinProfileAnalysis.error.title')}</Text>
          <Text style={s.errorBody}>{errorMsg || t('skinProfileAnalysis.error.body')}</Text>
          <PillButton
            label={t('skinProfileAnalysis.error.retry')}
            variant="primary"
            onPress={handleRefresh}
            style={{ marginTop: Sp.lg }}
          />
        </View>
      </SafeAreaView>
    );
  }

  // ----- Result -----
  if (!analysis) {
    return null;
  }

  const paramOrder: Array<keyof typeof analysis.parameters> = [
    'hydration',
    'luminosity',
    'sensitivity',
    'poreVisibility',
    'pigmentation',
  ];

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {Header}
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.kicker}>{t('skinProfileAnalysis.kicker')}</Text>
        <Text style={s.title}>{t('skinProfileAnalysis.title')}</Text>
        <Text style={s.updatedAt}>
          {t('skinProfileAnalysis.updatedAt').replace('{date}', formattedDate(analysis.createdAt))}
        </Text>

        <Text style={s.sectionHeader}>{t('skinProfileAnalysis.parametersHeader')}</Text>
        <View style={s.paramsWrap}>
          {paramOrder.map((key) => {
            const p = analysis.parameters[key];
            if (!p) return null;
            return (
              <View key={key} style={s.paramCard}>
                <View style={s.paramRow}>
                  <Text style={s.paramLabel}>{t(`skinProfileAnalysis.parameters.${key}`)}</Text>
                  <Text style={s.paramLevel}>{t(`skinProfileAnalysis.levels.${p.level}`)}</Text>
                </View>
                <Text style={s.paramNote}>{p.note}</Text>
              </View>
            );
          })}
        </View>

        <Text style={s.sectionHeader}>{t('skinProfileAnalysis.narrativeHeader')}</Text>
        <Text style={s.narrative}>{analysis.narrative}</Text>

        <Text style={s.sectionHeader}>{t('skinProfileAnalysis.recommendationsHeader')}</Text>
        <View style={s.recoWrap}>
          {analysis.recommendations.map((r, i) => (
            <View key={i} style={s.recoRow}>
              <Text style={s.recoBullet}>·</Text>
              <Text style={s.recoTxt}>{r}</Text>
            </View>
          ))}
        </View>

        <Text style={s.disclaimer}>{t('skinProfileAnalysis.disclaimer')}</Text>

        <Pressable onPress={handleRefresh} hitSlop={8} style={s.refreshBtn}>
          <Text style={s.refreshTxt}>{t('skinProfileAnalysis.refresh')}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F6F1EC',
  },
  header: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 60,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  kicker: {
    fontSize: 11,
    letterSpacing: 2,
    color: C.copper,
    marginTop: 8,
    marginBottom: 6,
    fontWeight: '500',
  },
  title: {
    fontSize: 26,
    color: '#3A2E25',
    lineHeight: 32,
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  updatedAt: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#9C8678',
    marginBottom: 22,
  },
  sectionHeader: {
    fontSize: 13,
    letterSpacing: 1.5,
    color: C.copper,
    fontWeight: '500',
    marginTop: 22,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  paramsWrap: {
    gap: 10,
  },
  paramCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EFE6D7',
  },
  paramRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  paramLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3A2E25',
    letterSpacing: 0.3,
  },
  paramLevel: {
    fontSize: 12,
    color: C.copper,
    fontStyle: 'italic',
    letterSpacing: 0.5,
  },
  paramNote: {
    fontSize: 13,
    color: '#5A4A3D',
    lineHeight: 18,
    letterSpacing: 0.2,
  },
  narrative: {
    fontSize: 15,
    color: '#3A2E25',
    lineHeight: 23,
    letterSpacing: 0.2,
  },
  recoWrap: {
    gap: 8,
  },
  recoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  recoBullet: {
    fontSize: 18,
    color: C.copper,
    width: 16,
    lineHeight: 22,
  },
  recoTxt: {
    fontSize: 14,
    color: '#3A2E25',
    lineHeight: 22,
    letterSpacing: 0.2,
    flex: 1,
  },
  disclaimer: {
    fontSize: 11,
    fontStyle: 'italic',
    color: '#9C8678',
    marginTop: 26,
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  refreshBtn: {
    alignSelf: 'center',
    marginTop: 14,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  refreshTxt: {
    fontSize: 12,
    color: C.copper,
    fontStyle: 'italic',
    letterSpacing: 0.5,
  },
  loadingTitle: {
    fontSize: 16,
    color: '#3A2E25',
    marginTop: 18,
    letterSpacing: 0.3,
  },
  loadingSub: {
    fontSize: 13,
    color: '#7A6555',
    marginTop: 6,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    color: '#3A2E25',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  emptyBody: {
    fontSize: 14,
    color: '#7A6555',
    textAlign: 'center',
    lineHeight: 21,
    letterSpacing: 0.2,
  },
  errorTitle: {
    fontSize: 18,
    color: '#3A2E25',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  errorBody: {
    fontSize: 14,
    color: '#7A6555',
    textAlign: 'center',
    lineHeight: 21,
    letterSpacing: 0.2,
  },
});
