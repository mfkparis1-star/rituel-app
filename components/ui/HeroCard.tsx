import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { C, G, R, Sh, Sp } from '../../theme';

type Props = {
  label?: string;
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  onPress?: () => void;
  variant?: 'espresso' | 'copper' | 'cream';
  style?: ViewStyle;
};

export default function HeroCard({
  label,
  title,
  subtitle,
  ctaLabel,
  onPress,
  variant = 'espresso',
  style,
}: Props) {
  const colors = G[variant];
  const isDark = variant === 'espresso' || variant === 'copper';
  const labelColor = isDark ? C.copper : C.copper;
  const titleColor = isDark ? '#FFFFFF' : C.text;
  const subtitleColor = isDark ? 'rgba(255,255,255,0.78)' : C.textMid;
  const ctaBg = isDark ? '#FFFFFF' : C.espresso;
  const ctaText = isDark ? C.espresso : '#FFFFFF';

  const Inner = (
    <LinearGradient colors={colors} style={[s.card, Sh.medium, style]}>
      {label && <Text style={[s.label, { color: labelColor }]}>{label}</Text>}
      <Text style={[s.title, { color: titleColor }]}>{title}</Text>
      {subtitle && (
        <Text style={[s.subtitle, { color: subtitleColor }]}>{subtitle}</Text>
      )}
      {ctaLabel && (
        <View style={[s.cta, { backgroundColor: ctaBg }]}>
          <Text style={[s.ctaText, { color: ctaText }]}>{ctaLabel}</Text>
        </View>
      )}
    </LinearGradient>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => pressed && s.pressed}>
        {Inner}
      </Pressable>
    );
  }
  return Inner;
}

const s = StyleSheet.create({
  card: {
    borderRadius: R.xl,
    padding: Sp.xl,
    overflow: 'hidden',
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    marginBottom: Sp.sm,
  },
  title: {
    fontSize: 28,
    fontWeight: '300',
    letterSpacing: -0.3,
    lineHeight: 34,
    marginBottom: Sp.xs,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Sp.lg,
  },
  cta: {
    alignSelf: 'flex-start',
    paddingHorizontal: Sp.lg,
    paddingVertical: Sp.sm,
    borderRadius: R.full,
    marginTop: Sp.xs,
  },
  ctaText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  pressed: {
    opacity: 0.92,
  },
});