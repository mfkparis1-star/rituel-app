import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useEffect, useState, useRef } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import HeroCard from '../../components/ui/HeroCard';
import LockedAICard from '../../components/credits/LockedAICard';
import { useAIUnlock } from '../../hooks/useAIUnlock';
import PillButton from '../../components/ui/PillButton';
import MakeupShareCard from '../../components/share/MakeupShareCard';
import { captureAndShare } from '../../utils/shareCard';
import { trackEvent } from '../../utils/analytics';
import PremiumCard from '../../components/ui/PremiumCard';
import { C, R, Sh, Sp, Type } from '../../theme';
import { useLanguage } from '../../hooks/useLanguage';
import {
  generateMakeupLooks,
  MAKEUP_OCCASIONS,
  MakeupResult,
  MakeupStyle,
  OccasionId,
} from '../../utils/makeupAI';
import { saveAICache, loadAICache, clearAICache } from '../../utils/aiCache';
import { AI_DISCLAIMER, COSMETIC_DISCLAIMER } from '../../utils/legal';

type Step = 'pick_occasion' | 'selfie' | 'generating' | 'result' | 'error';

type FeatureRow = {
  label: string;
  title: string;
  description: string;
};

const FEATURES: FeatureRow[] = [
  {
    label: 'ARCHIVE',
    title: 'Utilise ton archive',
    description: 'L\'IA suggère des looks à partir de tes produits.',
  },
  {
    label: 'COMPLET',
    title: 'Produits manquants',
    description: 'Découvre ce qu\'il te faut pour réaliser le look.',
  },
  {
    label: 'PERSONNALISÉ',
    title: 'Adapté à l\'événement',
    description: 'Chaque suggestion correspond à ton occasion.',
  },
];

function BackArrow({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M19 12H5" />
      <Path d="M12 19l-7-7 7-7" />
    </Svg>
  );
}

export default function MakeupScreen() {
  const { t, lang } = useLanguage();
  const [step, setStep] = useState<Step>('pick_occasion');
  const [occasion, setOccasion] = useState<OccasionId | null>(null);
  const [selfieBase64, setSelfieBase64] = useState<string | null>(null);
  const [result, setResult] = useState<MakeupResult | null>(null);
  const [resultId, setResultId] = useState<string | null>(null);
  const [shareLook, setShareLook] = useState<MakeupStyle | null>(null);
  const makeupCardRef = useRef<any>(null);
  const [unlocked, setUnlocked] = useState(false);
  const { isUnlocked: isAIUnlocked, isPremium } = useAIUnlock('makeup_full');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const cached = await loadAICache<{ result: MakeupResult; resultId: string; occasion: OccasionId }>('makeup');
      if (!cancelled && cached?.result && cached?.resultId) {
        setResult(cached.result);
        setResultId(cached.resultId);
        if (cached.occasion) setOccasion(cached.occasion);
        setStep('result');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const openCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        t('makeup.alerts.permissionTitle'),
        t('makeup.alerts.cameraPermission')
      );
      return;
    }
    const r = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });
    if (!r.canceled && r.assets?.[0]?.base64) {
      setSelfieBase64(r.assets[0].base64);
    }
  };

  const openGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        t('makeup.alerts.permissionTitle'),
        t('makeup.alerts.galleryPermission')
      );
      return;
    }
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });
    if (!r.canceled && r.assets?.[0]?.base64) {
      setSelfieBase64(r.assets[0].base64);
    }
  };

  const pickSelfie = () => {
    Alert.alert(
      t('makeup.alerts.addSelfieTitle'),
      t('makeup.alerts.addSelfieBody'),
      [
        { text: t('makeup.alerts.takeSelfie'), onPress: openCamera },
        { text: t('makeup.alerts.chooseGallery'), onPress: openGallery },
        { text: t('makeup.alerts.cancel'), style: 'cancel' },
      ]
    );
  };

  const runGeneration = async (skipSelfie: boolean) => {
    if (!occasion) return;
    setStep('generating');
    setErrorMsg('');
    try {
      const r = await generateMakeupLooks(
        occasion,
        skipSelfie ? null : selfieBase64,
        [],
        'fr'
      );
      setResult(r);
      const newResultId = `makeup_${Date.now()}`;
      setResultId(newResultId);
      saveAICache('makeup', { result: r, resultId: newResultId, occasion });
      setUnlocked(isPremium || isAIUnlocked(newResultId));
      setStep('result');
    } catch (e: any) {
      const msg = e?.message || t('common.genericError');
      setErrorMsg(msg);
      setStep('error');
    }
  };

  const reset = () => {
    setStep('pick_occasion');
    setOccasion(null);
    setSelfieBase64(null);
    setResult(null);
    setErrorMsg('');
    setUnlocked(false);
    setResultId(null);
    clearAICache('makeup');
  };

  const handleHeroCta = () => {
    if (!occasion) {
      Alert.alert(
        t('makeup.alerts.chooseOccasionTitle'),
        t('makeup.alerts.chooseOccasionBody')
      );
      return;
    }
    setStep('selfie');
  };

  // ---------- SELFIE STEP ----------
  if (step === 'selfie') {
    const occLabel =
      MAKEUP_OCCASIONS.find((o) => o.id === occasion)?.labels[lang] ?? '';
    return (
      <SafeAreaView style={s.root} edges={['top']}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          <View style={s.topBar}>
            <Pressable
              onPress={() => setStep('pick_occasion')}
              style={s.backBtn}
              hitSlop={8}
            >
              <BackArrow color={C.espresso} />
            </Pressable>
          </View>

          <Text style={s.label}>{occLabel.toUpperCase()}</Text>
          <Text style={s.title}>{t('makeup.selfie.title')}</Text>
          <Text style={s.subtitle}>
            Optionnel. Améliore la précision en analysant ton visage.
          </Text>

          <View style={s.selfieBox}>
            {selfieBase64 ? (
              <View style={s.selfieWrap}>
                <Image
                  source={{ uri: `data:image/jpeg;base64,${selfieBase64}` }}
                  style={s.selfieImg}
                />
                <Pressable
                  onPress={() => setSelfieBase64(null)}
                  style={s.selfieRemove}
                  hitSlop={8}
                >
                  <Text style={s.selfieRemoveTxt}>{t('makeup.selfie.remove')}</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable onPress={pickSelfie} style={s.selfieAdd}>
                <Text style={s.selfieAddTxt}>+ Ajouter un selfie</Text>
              </Pressable>
            )}
          </View>

          <PillButton
            label={t('makeup.selfie.generate')}
            variant="primary"
            fullWidth
            onPress={() => runGeneration(false)}
            style={{ marginTop: Sp.lg }}
          />

          <Pressable
            onPress={() => runGeneration(true)}
            style={s.skipBtn}
          >
            <Text style={s.skipTxt}>{t('makeup.selfie.skip')}</Text>
          </Pressable>

          <View style={{ height: Sp.huge }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ---------- GENERATING STEP ----------
  if (step === 'generating') {
    return (
      <SafeAreaView style={s.root} edges={['top']}>
        <View style={s.centerWrap}>
          <ActivityIndicator color={C.copper} size="large" />
          <Text style={s.generatingTxt}>{t('makeup.generating')}</Text>
          <Text style={s.generatingSub}>
            L\'IA analyse ton occasion et compose 3 propositions.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ---------- RESULT STEP ----------
  if (step === 'result' && result) {
    const occLabel =
      MAKEUP_OCCASIONS.find((o) => o.id === occasion)?.labels[lang] ?? '';
    return (
      <SafeAreaView style={s.root} edges={['top']}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          <View style={s.topBar}>
            <Pressable onPress={reset} style={s.backBtn} hitSlop={8}>
              <BackArrow color={C.espresso} />
            </Pressable>
          </View>

          <Text style={s.label}>{occLabel.toUpperCase()}</Text>
          <Text style={s.title}>{t('makeup.result.title')}</Text>

          {result.styles.map((look, i) => {
            if (i > 0 && !unlocked && !isPremium) {
              return null;
            }
            return (
            <View key={i} style={[s.lookCard, Sh.soft]}>
              <Text style={s.lookNumber}>{t('makeup.result.lookPrefix')} {i + 1}</Text>
              <Text style={s.lookName}>{look.name}</Text>
              <Text style={s.lookDescription}>{look.description}</Text>
              {look.personalNote ? (
                <Text style={s.lookPersonalNote}>{look.personalNote}</Text>
              ) : null}
              {look.colors && look.colors.length > 0 && (
                <View style={s.lookColorsRow}>
                  {look.colors.slice(0, 4).map((c, ci) => (
                    <Text key={ci} style={s.lookColorChip}>{c}</Text>
                  ))}
                </View>
              )}

              <Text style={s.lookSectionLabel}>{t('makeup.result.steps')}</Text>
              {look.steps.map((stepTxt, j) => (
                <View key={j} style={s.lookStepRow}>
                  <Text style={s.lookStepNum}>{j + 1}</Text>
                  <Text style={s.lookStepTxt}>{stepTxt}</Text>
                </View>
              ))}

              {look.productsNeeded.length > 0 && (
                <>
                  <Text style={s.lookSectionLabel}>{t('makeup.result.products')}</Text>
                  <View style={s.chipRow}>
                    {look.productsNeeded.map((p, k) => (
                      <View key={k} style={s.lookChip}>
                        <Text style={s.lookChipTxt}>{p}</Text>
                      </View>
                    ))}
                  </View>
                </>
              )}

              {look.missingCategories.length > 0 && (
                <>
                  <Text style={s.lookMissingLabel}>{t('makeup.result.toComplete')}</Text>
                  <View style={s.chipRow}>
                    {look.missingCategories.map((p, k) => (
                      <View key={k} style={s.lookMissingChip}>
                        <Text style={s.lookMissingTxt}>{p}</Text>
                      </View>
                    ))}
                  </View>
                </>
              )}

              <PillButton
                label={t('makeup.result.share')}
                variant="ghost"
                size="sm"
                onPress={() => {
                  setShareLook(look);
                  trackEvent('makeup_look_shared', { occasion: occasion ?? 'unknown', look: look.name });
                  setTimeout(() => captureAndShare(makeupCardRef, 'rituel-makeup'), 60);
                }}
                style={{ marginTop: 12 }}
              />
            </View>
            );
          })}

          <View style={{ position: 'absolute', left: -9999, top: -9999 }} pointerEvents="none">
            <MakeupShareCard
              ref={makeupCardRef}
              kind={t('makeup.result.cardKind')}
              lookName={shareLook?.name ?? ''}
              occasion={occLabel}
              colors={shareLook?.colors}
              personalNote={shareLook?.personalNote}
              products={shareLook?.productsNeeded}
              tagline={t('makeup.result.cardTagline')}
            />
          </View>
          {!unlocked && !isPremium && resultId && result.styles.length > 1 && (
            <LockedAICard
              scope="makeup_full"
              resultId={resultId}
              onUnlocked={() => setUnlocked(true)}
            />
          )}

          <PillButton
            label={t('makeup.result.restart')}
            variant="outline"
            fullWidth
            onPress={reset}
            style={{ marginTop: Sp.md }}
          />

          <Text style={s.disclaimer}>{AI_DISCLAIMER[lang]}</Text>
          <View style={{ height: Sp.xs }} />
          <Text style={s.disclaimer}>{COSMETIC_DISCLAIMER[lang]}</Text>

          <View style={{ height: Sp.huge }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ---------- ERROR STEP ----------
  if (step === 'error') {
    return (
      <SafeAreaView style={s.root} edges={['top']}>
        <ScrollView contentContainerStyle={s.scroll}>
          <View style={s.topBar}>
            <Pressable onPress={reset} style={s.backBtn} hitSlop={8}>
              <BackArrow color={C.espresso} />
            </Pressable>
          </View>
          <View style={s.errorWrap}>
            <Text style={s.errorTitle}>{t('makeup.errorTitle')}</Text>
            <Text style={s.errorTxt}>{errorMsg}</Text>
            <PillButton
              label={t('makeup.retry')}
              variant="primary"
              onPress={reset}
              style={{ marginTop: Sp.lg }}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ---------- PICK OCCASION (default) ----------
  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.topBar}>
          <Pressable onPress={() => router.replace('/(tabs)/ai-studio' as any)} style={s.backBtn} hitSlop={8}>
            <BackArrow color={C.espresso} />
          </Pressable>
        </View>

        <HeroCard
          label={t('makeup.hero.kicker')}
          title={t('makeup.hero.title')}
          subtitle="Une routine adaptée à ton événement, ton style et ta peau."
          ctaLabel={occasion ? t('makeup.hero.ctaContinue') : t('makeup.hero.ctaChoose')}
          variant="espresso"
          onPress={handleHeroCta}
          style={{ marginBottom: Sp.xl }}
        />

        <Text style={s.sectionTitle}>{t('makeup.occasionSection')}</Text>

        <View style={s.occasionGrid}>
          {MAKEUP_OCCASIONS.map((o) => {
            const active = occasion === o.id;
            return (
              <Pressable
                key={o.id}
                onPress={() => setOccasion(o.id)}
                style={({ pressed }) => [
                  s.occasionCard,
                  Sh.soft,
                  active && s.occasionCardActive,
                  pressed && { opacity: 0.85 },
                ]}
              >
                <Text style={[s.occasionLabel, active && s.occasionLabelActive]}>
                  {o.labels[lang]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {occasion && (
          <PillButton
            label={t('makeup.continueBtn')}
            variant="primary"
            fullWidth
            onPress={() => setStep('selfie')}
            style={{ marginBottom: Sp.xl }}
          />
        )}

        <Text style={s.sectionTitle}>{t('makeup.howItWorks')}</Text>

        {FEATURES.map((f, i) => (
          <View key={i} style={[s.featureRow, Sh.soft]}>
            <View style={s.featureNumber}>
              <Text style={s.featureNumberTxt}>{i + 1}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.featureLabel}>{t(`makeup.features.${i}.label`)}</Text>
              <Text style={s.featureTitle}>{t(`makeup.features.${i}.title`)}</Text>
              <Text style={s.featureDesc}>{t(`makeup.features.${i}.description`)}</Text>
            </View>
          </View>
        ))}

        <Text style={s.disclaimer}>{AI_DISCLAIMER[lang]}</Text>
        <View style={{ height: Sp.xs }} />
        <Text style={s.disclaimer}>{COSMETIC_DISCLAIMER[lang]}</Text>

        <View style={{ height: Sp.huge }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.appBg },
  scroll: { paddingHorizontal: Sp.lg, paddingTop: Sp.sm, paddingBottom: Sp.xl },
  topBar: { flexDirection: 'row', alignItems: 'center', marginBottom: Sp.md },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Sh.soft,
  },
  sectionTitle: {
    ...Type.h2,
    marginBottom: Sp.md,
    marginTop: Sp.xs,
  },
  occasionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Sp.xl,
  },
  occasionCard: {
    backgroundColor: C.white,
    borderRadius: R.full,
    paddingHorizontal: Sp.md,
    paddingVertical: 10,
    marginRight: Sp.xs,
    marginBottom: Sp.xs,
    borderWidth: 1,
    borderColor: C.border,
  },
  occasionCardActive: {
    backgroundColor: C.espresso,
    borderColor: C.espresso,
  },
  occasionLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: C.text,
  },
  occasionLabelActive: {
    color: C.white,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: C.white,
    borderRadius: R.md,
    padding: Sp.md,
    marginBottom: Sp.xs,
  },
  featureNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: C.cream,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Sp.sm,
  },
  featureNumberTxt: {
    fontSize: 12,
    fontWeight: '700',
    color: C.espresso,
  },
  featureLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: C.copper,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: C.text,
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 12,
    color: C.textMid,
    lineHeight: 17,
  },
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Sp.xl,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: C.copper,
    letterSpacing: 2.4,
    marginBottom: Sp.xs,
  },
  title: { ...Type.h1, marginBottom: 4 },
  subtitle: { ...Type.body, color: C.textMid, marginBottom: Sp.lg },

  selfieBox: {
    backgroundColor: C.white,
    borderRadius: R.lg,
    padding: Sp.md,
    marginTop: Sp.sm,
    ...Sh.soft,
  },
  selfieWrap: { alignItems: 'center' },
  selfieImg: {
    width: 200,
    height: 200,
    borderRadius: R.md,
    marginBottom: Sp.sm,
  },
  selfieRemove: {
    paddingHorizontal: Sp.md,
    paddingVertical: 8,
  },
  selfieRemoveTxt: {
    fontSize: 13,
    color: C.copper,
    fontWeight: '600',
  },
  selfieAdd: {
    paddingVertical: Sp.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
    borderStyle: 'dashed',
    borderRadius: R.md,
  },
  selfieAddTxt: {
    fontSize: 14,
    color: C.copper,
    fontWeight: '600',
  },
  skipBtn: {
    alignSelf: 'center',
    marginTop: Sp.md,
    padding: Sp.sm,
  },
  skipTxt: {
    fontSize: 13,
    color: C.copper,
    fontWeight: '500',
  },

  generatingTxt: {
    ...Type.h2,
    color: C.text,
    marginTop: Sp.md,
    textAlign: 'center',
  },
  generatingSub: {
    fontSize: 13,
    color: C.textMid,
    marginTop: Sp.xs,
    textAlign: 'center',
    lineHeight: 19,
  },

  lookCard: {
    backgroundColor: C.white,
    borderRadius: R.lg,
    padding: Sp.lg,
    marginBottom: Sp.md,
  },
  lookNumber: {
    fontSize: 10,
    fontWeight: '700',
    color: C.copper,
    letterSpacing: 1.6,
    marginBottom: 4,
  },
  lookName: {
    fontSize: 18,
    fontWeight: '600',
    color: C.text,
    marginBottom: 4,
  },
  lookDescription: {
    fontSize: 13,
    color: C.textMid,
    lineHeight: 19,
    marginBottom: Sp.md,
  },
  lookPersonalNote: {
    fontSize: 13,
    color: '#A66E4F',
    fontStyle: 'italic',
    lineHeight: 19,
    marginBottom: Sp.sm,
  },
  lookColorsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: Sp.md,
  },
  lookColorChip: {
    fontSize: 11,
    color: C.espresso,
    backgroundColor: C.cream,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
  },
  lookSectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: C.copper,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginTop: Sp.sm,
    marginBottom: Sp.xs,
  },
  lookStepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Sp.xs,
  },
  lookStepNum: {
    width: 22,
    fontSize: 12,
    fontWeight: '700',
    color: C.espresso,
  },
  lookStepTxt: {
    flex: 1,
    fontSize: 13,
    color: C.text,
    lineHeight: 19,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  lookChip: {
    backgroundColor: C.cream,
    borderRadius: R.full,
    paddingHorizontal: Sp.sm,
    paddingVertical: 6,
    marginRight: 6,
    marginBottom: 6,
  },
  lookChipTxt: {
    fontSize: 12,
    color: C.text,
    fontWeight: '500',
  },
  lookMissingLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: C.red,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginTop: Sp.sm,
    marginBottom: Sp.xs,
  },
  lookMissingChip: {
    backgroundColor: '#FCE8E6',
    borderRadius: R.full,
    paddingHorizontal: Sp.sm,
    paddingVertical: 6,
    marginRight: 6,
    marginBottom: 6,
  },
  lookMissingTxt: {
    fontSize: 12,
    color: C.red,
    fontWeight: '600',
  },

  disclaimer: {
    fontSize: 11,
    color: C.textSoft,
    textAlign: 'center',
    lineHeight: 17,
    marginTop: Sp.md,
    paddingHorizontal: Sp.md,
  },
  errorWrap: {
    paddingHorizontal: Sp.lg,
    paddingTop: Sp.huge,
    alignItems: 'center',
  },
  errorTitle: {
    ...Type.h1,
    marginBottom: Sp.xs,
  },
  errorTxt: {
    fontSize: 14,
    color: C.textMid,
    textAlign: 'center',
    lineHeight: 21,
  },
});
