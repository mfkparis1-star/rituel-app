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
  glowScore?: number | null;  // hero number when present
  scoreLabel?: string;        // e.g. "de glow"
  ritualCount: number;   // rituals this period
  streakWeeks: number;   // consecutive-week streak
  countLabel: string;    // e.g. "soirs de rituel ce mois-ci"
  streakLabel: string;   // e.g. "série de 3 semaines"
  tagline: string;       // e.g. "Ma peau, jour après jour"
  kind: string;          // top label, e.g. "MON GLOW"
};

const GlowShareCard = forwardRef<View, Props>(function GlowShareCard(
  { glowScore, scoreLabel, ritualCount, streakWeeks, countLabel, streakLabel, tagline, kind },
  ref
) {
  return (
    <ShareCardFrame ref={ref} kind={kind}>
      <View style={s.center}>
        {glowScore != null ? (
          <>
            <View style={s.scoreRing}>
              <Svg width={300} height={300} viewBox="0 0 300 300">
                <Circle cx={150} cy={150} r={132} fill="none" stroke="#ECE0D6" strokeWidth={14} />
                <Circle cx={150} cy={150} r={132} fill="none" stroke={C.copper} strokeWidth={14} strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 132}
                  strokeDashoffset={(2 * Math.PI * 132) * (1 - (glowScore / 100))}
                  transform="rotate(-90 150 150)" />
              </Svg>
              <View style={s.scoreNumWrap}>
                <Text style={s.scoreNum}>{glowScore}</Text>
                <Text style={s.scoreStar}>✦</Text>
              </View>
            </View>
            {scoreLabel ? <Text style={s.countLabel}>{scoreLabel}</Text> : null}
          </>
        ) : (
          <>
            <Text style={s.bigNumber}>{ritualCount}</Text>
            <Text style={s.countLabel}>{countLabel}</Text>
            <View style={s.curveWrap}>
              <Svg width={520} height={220} viewBox="0 0 520 220">
                <Polyline points="20,190 110,170 200,140 290,95 380,55 500,28" fill="none" stroke={C.copper} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
                <Circle cx={500} cy={28} r={12} fill={C.copper} />
              </Svg>
            </View>
          </>
        )}

        {glowScore != null && (
          <Text style={s.subInfo}>
            {countLabel ? ritualCount + ' ' + countLabel : ''}
            {streakWeeks >= 2 ? '   ·   ' + streakLabel : ''}
          </Text>
        )}
        {glowScore == null && streakWeeks >= 2 && (
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
  scoreRing: { width: 300, height: 300, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  scoreNumWrap: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  scoreNum: { fontSize: 120, fontWeight: '300', color: C.espresso, fontFamily: 'Didot', lineHeight: 128 },
  scoreStar: { fontSize: 34, color: C.copper, marginTop: -4 },
  subInfo: { fontSize: 32, color: C.espresso, letterSpacing: 1, marginBottom: 50, marginTop: 8, textAlign: 'center' },
});
