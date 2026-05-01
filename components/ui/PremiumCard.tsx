import { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { C, R, Sh, Sp } from '../../theme';

type Props = {
  children: ReactNode;
  variant?: 'cream' | 'white' | 'espresso';
  style?: ViewStyle;
  padded?: boolean;
};

export default function PremiumCard({
  children,
  variant = 'white',
  style,
  padded = true,
}: Props) {
  const bg =
    variant === 'espresso' ? C.espresso : variant === 'cream' ? C.cream : C.white;

  return (
    <View
      style={[
        s.card,
        { backgroundColor: bg },
        padded && s.padded,
        Sh.soft,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    borderRadius: R.lg,
    overflow: 'hidden',
  },
  padded: {
    padding: Sp.xl,
  },
});