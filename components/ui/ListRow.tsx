import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { C, R, Sh, Sp } from '../../theme';

type Props = {
  title: string;
  subtitle?: string;
  leftIcon?: ReactNode;
  rightContent?: ReactNode;
  onPress?: () => void;
  variant?: 'card' | 'plain';
};

export default function ListRow({
  title,
  subtitle,
  leftIcon,
  rightContent,
  onPress,
  variant = 'card',
}: Props) {
  const Wrapper: any = onPress ? Pressable : View;

  return (
    <Wrapper
      onPress={onPress}
      style={({ pressed }: any) => [
        s.row,
        variant === 'card' && [s.card, Sh.soft],
        onPress && pressed && { opacity: 0.85 },
      ]}
    >
      {leftIcon && <View style={s.iconBox}>{leftIcon}</View>}
      <View style={s.textBox}>
        <Text style={s.title}>{title}</Text>
        {subtitle && <Text style={s.subtitle}>{subtitle}</Text>}
      </View>
      {rightContent ? (
        <View style={s.right}>{rightContent}</View>
      ) : onPress ? (
        <Text style={s.arrow}>›</Text>
      ) : null}
    </Wrapper>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  card: { backgroundColor: C.white, borderRadius: R.md, padding: Sp.md, marginBottom: Sp.xs },
  iconBox: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.cream, alignItems: 'center', justifyContent: 'center', marginRight: Sp.md },
  textBox: { flex: 1 },
  title: { fontSize: 14, fontWeight: '600', color: C.text },
  subtitle: { fontSize: 12, color: C.textMid, marginTop: 2 },
  right: { marginLeft: Sp.sm },
  arrow: { fontSize: 22, color: C.textSoft, marginLeft: Sp.sm },
});
