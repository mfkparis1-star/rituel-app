/**
 * Phase 16F.1 — OnboardingSlide
 *
 * Single slide of the welcome onboarding. Cream gradient background,
 * large italic editorial headline, brief subtitle, optional decorative
 * mark (emoji or small icon char). No screenshots, no productivity-app
 * vibes — soft, intimate, premium.
 */
import { ReactNode } from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C, R, Sp, Type } from '../../theme';

type Props = {
  kind: string;        // small uppercase label e.g. "BIENVENUE"
  headline: string;    // large italic editorial headline
  subtitle: string;    // brief intro line
  mark?: ReactNode;    // optional decorative element (top of card)
  style?: ViewStyle;
};

export default function OnboardingSlide({ kind, headline, subtitle, mark, style }: Props) {
  return (
    <LinearGradient
      colors={['#FBF6F1', '#F5EDE6', '#EFE6D7']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={[s.root, style]}
    >
      {mark ? <View style={s.mark}>{mark}</View> : null}

      <Text style={s.kind}>{kind}</Text>

      <View style={s.divider} />

      <Text style={s.headline}>{headline}</Text>

      <Text style={s.subtitle}>{subtitle}</Text>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Sp.xl,
    paddingTop: Sp.massive,
    paddingBottom: Sp.massive,
  },
  mark: {
    marginBottom: Sp.xl,
    alignItems: 'center',
  },
  kind: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 4,
    color: C.copper,
    marginBottom: 12,
  },
  divider: {
    width: 48,
    height: 2,
    backgroundColor: C.copper,
    marginBottom: Sp.lg,
    opacity: 0.7,
  },
  headline: {
    fontSize: 38,
    lineHeight: 46,
    fontWeight: '400',
    fontStyle: 'italic',
    color: C.espresso,
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: Sp.lg,
    maxWidth: 340,
  },
  subtitle: {
    fontSize: 17,
    lineHeight: 26,
    color: '#7A6555',
    textAlign: 'center',
    maxWidth: 320,
    fontWeight: '400',
  },
});
