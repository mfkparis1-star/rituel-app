/**
 * Glow share card — the viral close of the Ton Glow loop.
 *
 * Renders inside ShareCardFrame at 1080×1920 (Instagram Stories).
 * Shows the user's ritual count, a gentle rising glow curve, and the
 * week streak. No before/after photos, no comparison to others — just
 * a personal journey, in the brand's calm voice. The frame already
 * carries the RITUEL header and the rituel.beauty footer, so every
 * share is quiet word-of-mouth.
 */
import { forwardRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Polyline, Circle } from 'react-native-svg';
import { C } from '../../theme';
import ShareCardFrame from './ShareCardFrame';

type Props = {
  ritualCount: number;   // rituals this period
  streakWeeks: number;   // consecutive-week streak
  countLabel: string;    // e.g. "soirs de rituel ce mois-ci"
  streakLabel: string;   // e.g. "série de 3 semaines"
  tagline: string;       // e.g. "Ma peau, jour après jour"
  kind: string;          // top label, e.g. "MON GLOW"
};

const GlowShareCard = forwardRef<View, Props>(function GlowShareCard(
  { ritualCount, streakWeeks, countLabel, streakLabel, tagline, kind },
  ref
) {
  return (
    <ShareCardFrame ref={ref} kind={kind}>
      <View style={s.center}>
        <Text style={s.bigNumber}>{ritualCount}</Text>
        <Text style={s.countLabel}>{countLabel}</Text>

        <View style={s.curveWrap}>
          <Svg width={520} height={220} viewBox="0 0 520 220">
            <Polyline
              points="20,190 110,170 200,140 290,95 380,55 500,28"
              fill="none"
              stroke={C.copper}
              strokeWidth={6}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Circle cx={500} cy={28} r={12} fill={C.copper} />
          </Svg>
        </View>

        {streakWeeks >= 2 && (
          <Text style={s.streak}>{streakLabel}</Text>
        )}

        <Text style={s.tagline}>{tagline}</Text>
      </View>
    </ShareCardFrame>
  );
});

export default GlowShareCard;

const s = StyleSheet.create({
  center: { alignItems: 'center' },
  bigNumber: {
    fontSize: 160,
    fontWeight: '300',
    color: C.espresso,
    fontFamily: 'Didot',
    lineHeight: 170,
    marginBottom: 8,
  },
  countLabel: {
    fontSize: 40,
    color: C.copper,
    letterSpacing: 1,
    marginBottom: 70,
    textAlign: 'center',
  },
  curveWrap: {
    marginBottom: 70,
  },
  streak: {
    fontSize: 38,
    fontWeight: '600',
    color: C.espresso,
    letterSpacing: 2,
    marginBottom: 40,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 36,
    fontStyle: 'italic',
    color: '#9C8576',
    textAlign: 'center',
  },
});
