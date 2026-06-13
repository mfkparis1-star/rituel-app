/**
 * TonightRitualCard — the home hero (Phase 1.1c).
 *
 * Four states, derived from props:
 *   1. empty    — no evening steps yet -> invite to create
 *   2. active   — steps listed; subtitle adapts to today's check-in
 *                 (or invites a check-in); CTA shows total minutes
 *                 or remaining step count
 *   3. done     — all steps completed tonight -> compact thanks card
 *
 * Pure UI + callbacks. No supabase, no purchases, no storage —
 * persistence is owned by the screen (Phase 1.1d).
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useLanguage } from '../../hooks/useLanguage';
import { C, R, Sp, Type } from '../../theme';
import type { TonightStep } from '../../hooks/useRoutineSteps';
import type { CheckinEmoji } from '../../utils/checkins';

type Props = {
  steps: TonightStep[];
  checkinEmoji: CheckinEmoji | null;
  completedIds: string[];
  onToggleStep: (id: string) => void;
  onStart: () => void;
  onCreate: () => void;
  onCheckin: () => void;
  ritualTime?: string;
};

function Crescent({ size = 13 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"
        stroke={C.copper}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function Check({ size = 11 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 6L9 17l-5-5"
        stroke={C.espresso}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function durationSeconds(d: string): number {
  const n = parseInt(d.replace(/\D/g, ''), 10);
  if (!Number.isFinite(n) || n <= 0) return 60;
  return /min|dk|m\b/i.test(d) ? n * 60 : n;
}

export default function TonightRitualCard({
  steps,
  checkinEmoji,
  completedIds,
  onToggleStep,
  onStart,
  onCreate,
  onCheckin,
  ritualTime,
}: Props) {
  const { t } = useLanguage();

  // ----- State 1: empty -----
  if (steps.length === 0) {
    return (
      <View style={[s.card, s.empty]}>
        <Crescent size={26} />
        <Text style={s.emptyTitle}>{t('home.tonight.emptyTitle')}</Text>
        <Text style={s.emptyBody}>{t('home.tonight.emptyBody')}</Text>
        <Pressable style={s.ctaSmall} onPress={onCreate}>
          <Text style={s.ctaText}>{t('home.tonight.emptyCta')}</Text>
        </Pressable>
      </View>
    );
  }

  const doneSet = new Set(completedIds);
  const remaining = steps.filter((st) => !doneSet.has(st.id));

  // ----- State 3: done -----
  if (remaining.length === 0) {
    return (
      <View style={[s.card, s.doneRow]}>
        <Crescent size={24} />
        <View style={s.doneText}>
          <Text style={s.doneTitle}>{t('home.tonight.doneTitle')}</Text>
          <Text style={s.doneBody}>{t('home.tonight.doneBody')}</Text>
        </View>
      </View>
    );
  }

  // ----- State 2: active -----
  const adaptedMap: Record<CheckinEmoji, string> = {
    glowing: t('home.tonight.adapted.glowing'),
    good: t('home.tonight.adapted.good'),
    neutral: t('home.tonight.adapted.neutral'),
    tired: t('home.tonight.adapted.tired'),
    rough: t('home.tonight.adapted.rough'),
  };

  const totalMin = Math.max(
    1,
    Math.round(steps.reduce((a, st) => a + durationSeconds(st.duration), 0) / 60)
  );
  const started = doneSet.size > 0;
  const cta = !started
    ? t('home.tonight.start').replace('{n}', String(totalMin))
    : remaining.length === 1
      ? t('home.tonight.continueOne')
      : t('home.tonight.continueMany').replace('{n}', String(remaining.length));

  return (
    <View style={s.card}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><Text style={s.label}>{t('home.tonight.label')}</Text>{ritualTime ? <Text style={s.label}>{ritualTime}</Text> : null}</View>
      {checkinEmoji ? (
        <View style={s.subRow}>
          <Crescent />
          <Text style={s.subtitle}>{adaptedMap[checkinEmoji]}</Text>
        </View>
      ) : (
        <Pressable style={s.subRow} onPress={onCheckin} hitSlop={6}>
          <Crescent />
          <Text style={[s.subtitle, s.subtitleLink]}>
            {t('home.tonight.noCheckin')} →
          </Text>
        </Pressable>
      )}

      {steps.map((st, idx) => {
        const done = doneSet.has(st.id);
        const last = idx === steps.length - 1;
        return (
          <Pressable
            key={st.id}
            style={[s.stepRow, !last && s.stepBorder]}
            onPress={() => onToggleStep(st.id)}
            hitSlop={4}
          >
            <View style={[s.circle, done && s.circleDone]}>
              {done && <Check />}
            </View>
            <Text style={[s.stepName, done && s.stepNameDone]} numberOfLines={1}>
              {st.product_name}
            </Text>
            <Text style={[s.stepDuration, done && s.stepDurationDone]}>
              {st.duration}
            </Text>
          </Pressable>
        );
      })}

      <Pressable style={s.cta} onPress={onStart}>
        <Text style={s.ctaText}>{cta}</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: C.espresso,
    borderRadius: R.lg,
    padding: Sp.md,
    marginBottom: Sp.sm,
  },
  label: {
    ...Type.label,
    marginBottom: Sp.xxs,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Sp.xs - 2,
    marginBottom: Sp.sm,
  },
  subtitle: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    color: C.border,
  },
  subtitleLink: {
    color: C.copper,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Sp.xs + 2,
    paddingVertical: Sp.xs + 1,
  },
  stepBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(192,138,106,0.28)',
  },
  circle: {
    width: 19,
    height: 19,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.copper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleDone: {
    backgroundColor: C.copper,
    borderColor: C.copper,
  },
  stepName: {
    flex: 1,
    fontSize: 13,
    color: C.cream,
  },
  stepNameDone: {
    color: C.textSoft,
    textDecorationLine: 'line-through',
  },
  stepDuration: {
    fontSize: 11,
    color: C.copper,
  },
  stepDurationDone: {
    color: C.textSoft,
  },
  cta: {
    backgroundColor: C.cream,
    borderRadius: R.full,
    paddingVertical: Sp.xs + 2,
    alignItems: 'center',
    marginTop: Sp.sm,
  },
  ctaSmall: {
    backgroundColor: C.cream,
    borderRadius: R.full,
    paddingVertical: Sp.xs + 1,
    paddingHorizontal: Sp.xl,
    marginTop: Sp.sm,
  },
  ctaText: {
    fontSize: 14,
    fontWeight: '500',
    color: C.espresso,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: Sp.lg,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '300',
    color: C.cream,
    marginTop: Sp.xs,
    marginBottom: Sp.xxs,
  },
  emptyBody: {
    fontSize: 12,
    color: C.border,
    textAlign: 'center',
  },
  doneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Sp.sm,
  },
  doneText: {
    flex: 1,
  },
  doneTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: C.cream,
  },
  doneBody: {
    fontSize: 12,
    color: C.border,
  },
});
