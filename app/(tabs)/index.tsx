/**
 * Adaptive Home — Phase 16C M4.
 *
 * Replaces the static home with three signal-driven blocks:
 *   - Aujourd'hui: today's check-in + a soft suggestion based on it
 *   - Cette semaine: 7-day check-in series + weekly tip
 *   - À propos de toi: skin type, concerns, last AI summary, archive count
 *
 * Signals consumed:
 *   - useCheckins (recent + hasToday)
 *   - useMemory (last_analysis_summary, archive_signals)
 *   - useRoutineCount
 *   - getAffiliateRecommendations (Pour toi block, kept from previous home)
 *
 * If the user is signed out or has no signals, the home gracefully
 * degrades to a clean welcome state with the Skin Analysis CTA.
 */
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import HeroCard from '../../components/ui/HeroCard';
import PremiumCard from '../../components/ui/PremiumCard';
import PillButton from '../../components/ui/PillButton';
import AffiliateProductCard from '../../components/ui/AffiliateProductCard';
import { getAffiliateRecommendations } from '../../utils/affiliateRecommendations';
import type { AffiliateProduct } from '../../utils/affiliateRecommendations';
import { useRoutineCount } from '../../hooks/useRoutineCount';
import { useMemory } from '../../hooks/useMemory';
import { useCheckins } from '../../hooks/useCheckins';
import { generateReflection, getCachedReflection, getQuotaRemaining, REFLECTION_FALLBACK } from '../../utils/reflection';
import { useLanguage } from '../../hooks/useLanguage';
import { usePremium } from '../../hooks/usePremium';
import WeekStrip from '../../components/home/WeekStrip';
import AphorismCard from '../../components/home/AphorismCard';
import TonightRitualCard from '../../components/home/TonightRitualCard';
import { useRoutineSteps } from '../../hooks/useRoutineSteps';
import { useTonightProgress } from '../../hooks/useTonightProgress';
import { fr as frDict } from '../../utils/i18n/locales/fr';
import { en as enDict } from '../../utils/i18n/locales/en';
import { tr as trDict } from '../../utils/i18n/locales/tr';
import { supabase } from '../../lib/supabase';
import { CHECKIN_EMOJIS, CheckinEmoji } from '../../utils/checkins';
import { C, R, Sh, Sp, Type } from '../../theme';

function getGreeting(greetingLabels: { morning: string; afternoon: string; evening: string }): string {
  const h = new Date().getHours();
  if (h < 12) return greetingLabels.morning;
  if (h < 18) return greetingLabels.afternoon;
  return greetingLabels.evening;
}

function emojiSymbol(id: CheckinEmoji): string {
  return CHECKIN_EMOJIS.find((e) => e.id === id)?.symbol ?? '·';
}

function todaySuggestion(latest: CheckinEmoji | null, adviceLabels: { glowing: string; good: string; neutral: string; tired: string; rough: string; none: string }): string {
  switch (latest) {
    case 'glowing': return adviceLabels.glowing;
    case 'good':    return adviceLabels.good;
    case 'neutral': return adviceLabels.neutral;
    case 'tired':   return adviceLabels.tired;
    case 'rough':   return adviceLabels.rough;
    default:        return adviceLabels.none;
  }
}

function weekSummary(emojis: CheckinEmoji[]): string {
  if (emojis.length === 0) return '';
  const counts: Record<string, number> = {};
  emojis.forEach((e) => { counts[e] = (counts[e] ?? 0) + 1; });
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  const dominant = top[0] as CheckinEmoji;
  const sym = emojiSymbol(dominant);
  return `${emojis.length} check-in${emojis.length > 1 ? 's' : ''} cette semaine. Tendance : ${sym}`;
}

export default function IndexScreen() {
  const { lang, t } = useLanguage();
  const greeting = getGreeting({ morning: t('home.greeting.morning'), afternoon: t('home.greeting.afternoon'), evening: t('home.greeting.evening') });
  const { count: routineCount } = useRoutineCount();
  const { memory } = useMemory();
  const { recent, hasToday } = useCheckins(7);
  const { steps: tonightSteps } = useRoutineSteps('soir');
  const { completedIds, toggle: toggleTonightStep } = useTonightProgress();

  const [recommendations, setRecommendations] = useState<AffiliateProduct[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const items = await getAffiliateRecommendations({}, 4);
        if (mounted) setRecommendations(items);
      } catch {
        // silent
      }
    })();
    return () => { mounted = false; };
  }, []);

  const latestCheckin = recent[0]?.emoji ?? null;
  const weekEmojis = recent.map((c) => c.emoji);

  // Phase 1.1d — tonight ritual derived values
  const tonightEmoji = hasToday ? latestCheckin : null;
  const homeDict = lang === 'en' ? enDict : lang === 'tr' ? trDict : frDict;
  const dayLabels = homeDict.home.weekStrip.days;
  const aphorisms = homeDict.home.aphorisms;
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  const aphorism = aphorisms[dayOfYear % aphorisms.length];
  const weekCompleted = (() => {
    const arr = [false, false, false, false, false, false, false];
    const now = new Date();
    const todayIdx = (now.getDay() + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - todayIdx);
    monday.setHours(0, 0, 0, 0);
    for (const c of recent) {
      const d = new Date(c.created_at);
      const idx = Math.floor((d.getTime() - monday.getTime()) / 86400000);
      if (idx >= 0 && idx < 7) arr[idx] = true;
    }
    return arr;
  })();
  const lastSummary = memory?.last_analysis_summary ?? null;

  // Phase 17D — soft AI reflection
  const { isPremium } = usePremium();
  const [reflectionText, setReflectionText] = useState<string | null>(null);
  const [reflectionAt, setReflectionAt] = useState<string | null>(null);
  const [reflectionLoading, setReflectionLoading] = useState(false);
  const [reflectionRemaining, setReflectionRemaining] = useState<number | null>(null);
  const [reflectionUserId, setReflectionUserId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      const uid = data.session?.user?.id ?? null;
      if (!mounted) return;
      setReflectionUserId(uid);
      if (!uid) return;
      const cached = await getCachedReflection(uid);
      if (!mounted) return;
      if (cached) {
        setReflectionText(cached.text);
        setReflectionAt(cached.at);
      }
      const remaining = await getQuotaRemaining(uid, isPremium);
      if (mounted) setReflectionRemaining(remaining);
    })();
    return () => { mounted = false; };
  }, [isPremium]);

  const handleReceiveReflection = async () => {
    if (!reflectionUserId || reflectionLoading) return;
    setReflectionLoading(true);
    try {
      const result = await generateReflection(reflectionUserId, isPremium, {
        checkinEmojis: weekEmojis,
        skinType: memory?.last_analysis_summary?.skinType ?? null,
        concerns: memory?.last_analysis_summary?.issues ?? memory?.concerns_extracted ?? [],
        lastEmotion: null,
      });
      setReflectionText(result.text);
      setReflectionAt(new Date().toISOString());
      const remaining = await getQuotaRemaining(reflectionUserId, isPremium);
      setReflectionRemaining(remaining);
    } catch {
      setReflectionText(REFLECTION_FALLBACK);
    } finally {
      setReflectionLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.brand}>{t('auth.brand')}</Text>
          <Text style={s.greeting}>{greeting}</Text>
          <Text style={s.subtitle}>{t('home.subtitle')}</Text>
        </View>

        {/* Phase 1.1d — week strip + tonight ritual + aphorism */}
        <WeekStrip dayLabels={dayLabels} completed={weekCompleted} />
        <TonightRitualCard
          steps={tonightSteps}
          checkinEmoji={tonightEmoji}
          completedIds={completedIds}
          onToggleStep={toggleTonightStep}
          onStart={() => router.push('/routine-session' as any)}
          onCreate={() => router.push('/(tabs)/routine' as any)}
          onCheckin={() => router.push('/check-in' as any)}
        />
        <AphorismCard text={aphorism} />

        {/* Phase 17D — Soft AI Reflection (Home top) */}
        {reflectionUserId ? (
          <View style={[s.reflectionCard, Sh.soft]}>
            <Text style={s.reflectionLabel}>{t('home.reflection.label')}</Text>
            {reflectionText ? (
              <Text style={s.reflectionText}>{reflectionText}</Text>
            ) : (
              <Text style={s.reflectionPrompt}>{t('home.reflection.prompt')}</Text>
            )}
            {!reflectionText ? (
              <Pressable
                onPress={handleReceiveReflection}
                disabled={reflectionLoading || (reflectionRemaining !== null && reflectionRemaining <= 0)}
                style={[
                  s.reflectionBtn,
                  (reflectionLoading || (reflectionRemaining !== null && reflectionRemaining <= 0)) && s.reflectionBtnDisabled,
                ]}
                hitSlop={6}
              >
                <Text style={s.reflectionBtnTxt}>
                  {reflectionLoading ? t('home.reflection.loading') : t('home.reflection.receive')}
                </Text>
              </Pressable>
            ) : reflectionRemaining !== null && reflectionRemaining > 0 ? (
              <Pressable
                onPress={handleReceiveReflection}
                disabled={reflectionLoading}
                style={s.reflectionRefresh}
                hitSlop={6}
              >
                <Text style={s.reflectionRefreshTxt}>
                  {reflectionLoading ? t('home.reflection.loading') : t('home.reflection.another')}
                </Text>
              </Pressable>
            ) : (
              <Text style={s.reflectionHint}>{t('home.reflection.tomorrow')}</Text>
            )}
          </View>
        ) : null}

        {/* Check-in CTA (only when not done today) */}
        {!hasToday && (
          <Pressable
            onPress={() => router.push('/check-in' as any)}
            style={s.checkinCard}
          >
            <Text style={s.checkinLabel}>{t('home.checkin.label')}</Text>
            <Text style={s.checkinTitle}>{t('home.checkin.title')}</Text>
            <Text style={s.checkinSub}>{t('home.checkin.subtitle')}</Text>
          </Pressable>
        )}

        {/* Aujourd'hui block */}
        <Text style={s.sectionTitle}>{t('home.sections.today')}</Text>
        <PremiumCard variant="cream" style={s.block}>
          <View style={s.blockRow}>
            <Text style={s.bigEmoji}>{latestCheckin ? emojiSymbol(latestCheckin) : '·'}</Text>
            <View style={s.blockText}>
              <Text style={s.blockTitle}>
                {latestCheckin
                  ? t(`checkin.emojis.${latestCheckin}`)
                  : t('home.today.waiting')}
              </Text>
              <Text style={s.blockSub}>{todaySuggestion(latestCheckin, { glowing: t('home.today.advice.glowing'), good: t('home.today.advice.good'), neutral: t('home.today.advice.neutral'), tired: t('home.today.advice.tired'), rough: t('home.today.advice.rough'), none: t('home.today.advice.none') })}</Text>
            </View>
          </View>
        </PremiumCard>

        {/* Cette semaine block */}
        <View style={s.sectionTitleRow}>
          <Text style={s.sectionTitle}>{t('home.sections.thisWeek')}</Text>
          <Pressable onPress={() => router.push('/glow-timeline' as any)} hitSlop={6}>
            <Text style={s.sectionLink}>{t('home.sections.seeAll')}</Text>
          </Pressable>
        </View>
        <PremiumCard variant="espresso" style={s.blockWeek}>
          {weekEmojis.length === 0 ? (
            <>
              <Text style={s.weekTitle}>{t('home.week.emptyTitle')}</Text>
              <Text style={s.weekSub}>{t('home.week.emptySub')}</Text>
            </>
          ) : (
            <>
              <Text style={s.weekTxt}>{weekSummary(weekEmojis)}</Text>
              <View style={s.weekRow}>
                {weekEmojis.slice(0, 7).map((e, i) => (
                  <Text key={i} style={s.weekEmoji}>{emojiSymbol(e)}</Text>
                ))}
              </View>
            </>
          )}
        </PremiumCard>

        {/* À propos de toi block */}
        <Text style={s.sectionTitle}>{t('home.sections.aboutYou')}</Text>
        <PremiumCard variant="cream" style={s.block}>
          {lastSummary?.skinType ? (
            <>
              <Text style={s.aboutLabel}>{t('home.about.skinTypeLabel')}</Text>
              <Text style={s.aboutValue}>{lastSummary.skinType}</Text>
              {lastSummary.issues && lastSummary.issues.length > 0 && (
                <>
                  <Text style={[s.aboutLabel, { marginTop: Sp.md }]}>{t('home.about.observationsLabel')}</Text>
                  <Text style={s.aboutValue}>{lastSummary.issues.join(' · ')}</Text>
                </>
              )}
              <Text style={[s.aboutLabel, { marginTop: Sp.md }]}>{t('home.about.routineLabel')}</Text>
              <Text style={s.aboutValue}>
                {routineCount > 0 ? (routineCount > 1 ? t('home.about.routineStepsMany') : t('home.about.routineStepsOne')).replace('{n}', String(routineCount)) : t('home.about.routineEmpty')}
              </Text>
            </>
          ) : (
            <>
              <Text style={s.blockTitle}>{t('home.about.emptyTitle')}</Text>
              <Text style={s.blockSub}>{t('home.about.emptySub')}</Text>
              <PillButton
                label={t('home.about.analyzeCta')}
                variant="primary"
                onPress={() => router.push('/(tabs)/skin-analysis' as any)}
                style={{ marginTop: Sp.md }}
              />
            </>
          )}
        </PremiumCard>

        {/* Skin Analysis CTA — always visible, complementary */}
        {lastSummary?.skinType && (
          <HeroCard
            label={t('home.analysisHero.label')}
            title={t('home.analysisHero.title')}
            subtitle={t('home.analysisHero.subtitle')}
            ctaLabel={t('home.analysisHero.cta')}
            variant="espresso"
            onPress={() => router.push('/(tabs)/skin-analysis' as any)}
            style={{ marginBottom: Sp.lg }}
          />
        )}

        {/* Pour toi — affiliate recommendations */}
        {recommendations.length > 0 && (
          <View style={s.selectedWrap}>
            <Text style={s.sectionTitle}>{t('home.sections.selectedForYou')}</Text>
            <Text style={s.selectedSubtitle}>
              Des soins choisis pour accompagner ton rituel.
            </Text>
            {recommendations.slice(0, 3).map((p) => (
              <AffiliateProductCard key={p.id} product={p} />
            ))}
          </View>
        )}

        <View style={{ height: Sp.huge }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.appBg },
  scroll: { paddingHorizontal: Sp.lg, paddingTop: Sp.sm, paddingBottom: Sp.xl },
  header: { marginBottom: Sp.lg, marginTop: Sp.sm },
  brand: {
    fontSize: 11,
    letterSpacing: 3,
    color: C.copper,
    fontWeight: '600',
    marginBottom: 6,
  },
  greeting: { ...Type.h1, marginBottom: 4 },
  subtitle: { ...Type.body, color: C.textMid, marginBottom: Sp.md },

  checkinCard: {
    backgroundColor: C.cream,
    padding: Sp.lg,
    borderRadius: R.lg,
    marginBottom: Sp.lg,
    borderWidth: 1,
    borderColor: C.copper,
  },
  checkinLabel: {
    fontSize: 10,
    letterSpacing: 1.5,
    color: C.copper,
    fontWeight: '600',
    marginBottom: 6,
  },
  checkinTitle: {
    fontSize: 18,
    color: C.espresso,
    fontWeight: '500',
    marginBottom: 4,
  },
  checkinSub: {
    fontSize: 13,
    color: C.textMid,
  },

  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: C.text,
    marginBottom: Sp.sm,
    marginTop: Sp.md,
    letterSpacing: 0.3,
  },
  selectedWrap: {
    paddingHorizontal: Sp.md,
    marginTop: Sp.lg,
    marginBottom: Sp.md,
  },
  selectedSubtitle: {
    fontSize: 13,
    fontStyle: 'italic',
    color: '#7A6555',
    marginTop: 4,
    marginBottom: 16,
    letterSpacing: 0.2,
    lineHeight: 19,
  },

  block: { marginBottom: Sp.md, padding: Sp.lg },
  blockRow: { flexDirection: 'row', alignItems: 'center', gap: Sp.md },
  bigEmoji: { fontSize: 36 },
  blockText: { flex: 1 },
  blockTitle: {
    fontSize: 16,
    color: C.espresso,
    fontWeight: '500',
    marginBottom: 4,
  },
  blockSub: {
    fontSize: 13,
    color: C.textMid,
    lineHeight: 19,
  },

  weekTxt: {
    fontSize: 14,
    color: C.cream,
    marginBottom: Sp.md,
  },
  weekRow: { flexDirection: 'row', gap: Sp.xs },
  weekEmoji: { fontSize: 22 },

  aboutLabel: {
    fontSize: 10,
    letterSpacing: 1.2,
    color: C.copper,
    fontWeight: '600',
    marginBottom: 4,
  },
  aboutValue: {
    fontSize: 15,
    color: C.espresso,
    textTransform: 'capitalize',
  },
  blockWeek: { marginBottom: Sp.md, paddingHorizontal: Sp.lg, paddingVertical: Sp.md },
  weekTitle: {
    fontSize: 16,
    color: C.cream,
    fontWeight: '500',
    marginBottom: 6,
  },
  weekSub: {
    fontSize: 13,
    color: C.cream,
    opacity: 0.75,
    lineHeight: 18,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: Sp.sm,
    marginTop: Sp.md,
  },
  sectionLink: {
    fontSize: 12,
    color: C.copper,
    fontWeight: '500',
  },

  reflectionCard: {
    backgroundColor: '#FBF6F1',
    borderRadius: R.lg,
    paddingHorizontal: Sp.md,
    paddingVertical: Sp.lg,
    marginHorizontal: Sp.md,
    marginBottom: Sp.lg,
    borderWidth: 1,
    borderColor: '#EFE6D7',
  },
  reflectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    color: C.copper,
    marginBottom: 12,
  },
  reflectionText: {
    fontSize: 15,
    lineHeight: 23,
    fontStyle: 'italic',
    color: '#3A2E25',
    letterSpacing: 0.2,
    marginBottom: 8,
  },
  reflectionPrompt: {
    fontSize: 13,
    lineHeight: 20,
    color: '#7A6555',
    fontStyle: 'italic',
    marginBottom: 14,
  },
  reflectionBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 100,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: C.copper,
  },
  reflectionBtnDisabled: {
    opacity: 0.4,
  },
  reflectionBtnTxt: {
    fontSize: 12,
    fontWeight: '500',
    color: C.copper,
    letterSpacing: 0.3,
  },
  reflectionRefresh: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    marginTop: 4,
  },
  reflectionRefreshTxt: {
    fontSize: 11,
    fontStyle: 'italic',
    color: '#A99583',
    letterSpacing: 0.3,
  },
  reflectionHint: {
    fontSize: 11,
    fontStyle: 'italic',
    color: '#A99583',
    marginTop: 4,
    letterSpacing: 0.3,
  },});
