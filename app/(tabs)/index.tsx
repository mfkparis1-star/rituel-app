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
import { router, useFocusEffect } from 'expo-router';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState, useCallback, useRef } from 'react';
import PremiumCard from '../../components/ui/PremiumCard';
import PillButton from '../../components/ui/PillButton';
import AffiliateProductCard from '../../components/ui/AffiliateProductCard';
import { getAffiliateRecommendations } from '../../utils/affiliateRecommendations';
import type { AffiliateProduct } from '../../utils/affiliateRecommendations';
import { useRoutineCount } from '../../hooks/useRoutineCount';
import { useMemory } from '../../hooks/useMemory';
import { useCheckins } from '../../hooks/useCheckins';
import { generateReflection, getCachedReflection, getQuotaRemaining, reflectionFallback } from '../../utils/reflection';
import { useLanguage } from '../../hooks/useLanguage';
import { usePremium } from '../../hooks/usePremium';
import WeekStrip from '../../components/home/WeekStrip';
import { weekLune, luneCount, weekStreak } from '../../utils/lune';
import { captureAndShare } from '../../utils/shareCard';
import { trackEvent } from '../../utils/analytics';
import GlowShareCard from '../../components/share/GlowShareCard';
import { getRitualTime, setRitualTime as persistRitualTime, DEFAULT_RITUAL_TIME } from '../../utils/ritualTime';
import { scheduleEveningReminder } from '../../utils/notify';
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


function weekSummary(emojis: CheckinEmoji[], t: (k: string) => string): string {
  if (emojis.length === 0) return '';
  const counts: Record<string, number> = {};
  emojis.forEach((e) => { counts[e] = (counts[e] ?? 0) + 1; });
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  const dominant = top[0] as CheckinEmoji;
  const sym = emojiSymbol(dominant);
  const key = emojis.length > 1 ? 'home.weekSummary.many' : 'home.weekSummary.one';
  return t(key).replace('{n}', String(emojis.length)).replace('{sym}', sym);
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
  const [weekCompleted, setWeekCompleted] = useState<boolean[]>([false, false, false, false, false, false, false]);
  const [ritualTime, setRitualTime] = useState(DEFAULT_RITUAL_TIME);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [streak, setStreak] = useState(0);
  const glowCardRef = useRef<any>(null);
  const [tempTime, setTempTime] = useState<Date | null>(null);

  // Phase 17D — soft AI reflection
  const { isPremium } = usePremium();

  useFocusEffect(
    useCallback(() => {
      let active = true;
      weekLune().then((w) => { if (active) setWeekCompleted(w); });
      weekStreak().then((s) => { if (active) setStreak(s); });
      getRitualTime().then((tm) => { if (active) setRitualTime(tm); });
      return () => { active = false; };
    }, [])
  );
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
      if (cached && (!cached.lang || cached.lang === lang)) {
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
      }, lang);
      setReflectionText(result.text);
      setReflectionAt(new Date().toISOString());
      const remaining = await getQuotaRemaining(reflectionUserId, isPremium);
      setReflectionRemaining(remaining);
    } catch {
      setReflectionText(reflectionFallback(lang));
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
        {(() => {
          const count = luneCount(weekCompleted);
          if (count === 0 && streak === 0) return null;
          return (
            <Pressable
              style={s.glowStreak}
              onPress={() => { trackEvent('glow_streak_shared', { count, streak }); captureAndShare(glowCardRef, 'rituel-glow'); }}
              hitSlop={10}
            >
              <Text style={s.glowStreakTxt}>
                {t('home.glow.thisWeek').replace('{n}', String(count))}
                {streak >= 2 ? '  ·  ' + t('home.glow.streak').replace('{n}', String(streak)) : ''}
              </Text>
              <Text style={s.glowShareHint}>{t('home.glow.shareHint')}</Text>
              <View style={{ position: 'absolute', left: -9999, top: -9999 }} pointerEvents="none">
                <GlowShareCard
                  ref={glowCardRef}
                  kind={t('home.glow.cardKind')}
                  ritualCount={count}
                  streakWeeks={streak}
                  countLabel={t('home.glow.cardCount')}
                  streakLabel={t('home.glow.streak').replace('{n}', String(streak))}
                  tagline={t('home.glow.cardTagline')}
                />
              </View>
            </Pressable>
          );
        })()}
        <TonightRitualCard
          steps={tonightSteps}
          checkinEmoji={tonightEmoji}
          completedIds={completedIds}
          onToggleStep={toggleTonightStep}
          onStart={() => router.push('/routine-session' as any)}
          onCreate={() => router.push('/(tabs)/routine' as any)}
          onCheckin={() => router.push('/check-in' as any)}
          ritualTime={ritualTime}
          onEditTime={() => setShowTimePicker(true)}
        />
        {showTimePicker && (() => {
          let DateTimePicker: any = null;
          try { DateTimePicker = require('@react-native-community/datetimepicker').default; } catch { DateTimePicker = null; }
          if (!DateTimePicker) { return null; }

          const initial = tempTime ?? (() => {
            const [h, m] = ritualTime.split(':').map(Number);
            const d = new Date(); d.setHours(h, m, 0, 0); return d;
          })();

          const commit = (date: Date) => {
            const hh = String(date.getHours()).padStart(2, '0');
            const mm = String(date.getMinutes()).padStart(2, '0');
            const next = `${hh}:${mm}`;
            setRitualTime(next);
            persistRitualTime(next);
            scheduleEveningReminder(next, t('home.notify.title'), t('home.notify.body'));
          };

          const closePicker = () => { setShowTimePicker(false); setTempTime(null); };

          // Android: native dialog handles confirm/cancel via onChange.
          if (Platform.OS === 'android') {
            return (
              <DateTimePicker
                value={initial}
                mode="time"
                is24Hour
                display="spinner"
                onChange={(event: any, date?: Date) => {
                  closePicker();
                  if (event.type === 'set' && date) commit(date);
                }}
              />
            );
          }

          // iOS: keep the spinner open inside a modal; only Confirmer saves.
          return (
            <Modal transparent animationType="fade" visible onRequestClose={closePicker}>
              <Pressable style={s.pickerBackdrop} onPress={closePicker}>
                <Pressable style={s.pickerSheet} onPress={(e) => e.stopPropagation()}>
                  <Text style={s.pickerTitle}>{t('home.notify.pickerTitle')}</Text>
                  <DateTimePicker
                    value={initial}
                    mode="time"
                    is24Hour
                    display="spinner"
                    onChange={(_event: any, date?: Date) => { if (date) setTempTime(date); }}
                  />
                  <View style={s.pickerActions}>
                    <Pressable onPress={closePicker} hitSlop={10} style={s.pickerCancel}>
                      <Text style={s.pickerCancelTxt}>{t('common.cancel')}</Text>
                    </Pressable>
                    <PillButton
                      label={t('common.confirm')}
                      variant="primary"
                      onPress={() => { commit(initial); closePicker(); }}
                    />
                  </View>
                </Pressable>
              </Pressable>
            </Modal>
          );
        })()}
        <AphorismCard text={aphorism} />

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
              <Text style={s.weekTxt}>{weekSummary(weekEmojis, t)}</Text>
              <View style={s.weekRow}>
                {weekEmojis.slice(0, 7).map((e, i) => (
                  <Text key={i} style={s.weekEmoji}>{emojiSymbol(e)}</Text>
                ))}
              </View>
            </>
          )}
        </PremiumCard>

        {/* Phase 17D — Soft AI Reflection (Home top) */}
        {reflectionUserId ? (
          <View style={[s.reflectionCard, Sh.soft]}>
            <Text style={s.reflectionLabel}>{t('home.reflection.eveningLabel')}</Text>
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

        {/* Pour toi — affiliate recommendations */}
        {recommendations.length > 0 && (
          <View style={s.selectedWrap}>
            <Text style={s.sectionTitle}>{t('home.sections.selectedForYou')}</Text>
            <Text style={s.selectedSubtitle}>
              {t('home.recommend.subtitle')}
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
  bigEmoji: { fontSize: 30, color: C.copper },
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
  weekEmoji: { fontSize: 18, color: C.copper },

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
  },
  pickerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(42,20,16,0.35)',
    justifyContent: 'flex-end',
  },
  pickerSheet: {
    backgroundColor: '#F6F1EC',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 34,
    alignItems: 'center',
  },
  pickerTitle: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: '#C08A6A',
    marginBottom: 6,
  },
  pickerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
    gap: 16,
  },
  pickerCancel: {
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  pickerCancelTxt: {
    fontSize: 15,
    color: '#9C8576',
  },
  glowStreak: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  glowStreakTxt: {
    fontSize: 12,
    color: '#C08A6A',
    letterSpacing: 0.3,
    fontStyle: 'italic',
  },
  glowShareHint: {
    fontSize: 10,
    color: '#C9A98E',
    letterSpacing: 0.5,
    marginTop: 2,
  },});
