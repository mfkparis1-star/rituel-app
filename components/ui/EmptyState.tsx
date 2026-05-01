import { ReactNode } from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { C, Sp } from '../../theme';

type Props = {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  action?: ReactNode;
  style?: ViewStyle;
};

export default function EmptyState({ icon, title, subtitle, action, style }: Props) {
  return (
    <View style={[s.box, style]}>
      {icon && <View style={s.iconBox}>{icon}</View>}
      <Text style={s.title}>{title}</Text>
      {subtitle && <Text style={s.subtitle}>{subtitle}</Text>}
      {action && <View style={s.actionBox}>{action}</View>}
    </View>
  );
}

const s = StyleSheet.create({
  box: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Sp.huge,
    paddingHorizontal: Sp.lg,
  },
  iconBox: {
    marginBottom: Sp.lg,
  },
  title: {
    fontSize: 17,
    fontWeight: '500',
    color: C.text,
    textAlign: 'center',
    marginBottom: Sp.xs,
  },
  subtitle: {
    fontSize: 13,
    color: C.textMid,
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 280,
  },
  actionBox: {
    marginTop: Sp.xl,
  },
});
