import { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { C, R, Sp } from '../../theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline';
type Size = 'sm' | 'md' | 'lg';

type Props = {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: ReactNode;
  style?: ViewStyle;
  fullWidth?: boolean;
  textColor?: string;
};

export default function PillButton({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leftIcon,
  style,
  fullWidth = false,
  textColor: textColorOverride,
}: Props) {
  const isDisabled = disabled || loading;

  const paddingVertical = size === 'sm' ? 10 : size === 'lg' ? 16 : 13;
  const paddingHorizontal = size === 'sm' ? 16 : size === 'lg' ? 28 : 22;
  const fontSize = size === 'sm' ? 13 : size === 'lg' ? 16 : 14;

  let bg: string = C.espresso;
  let textColor: string = '#FFFFFF';
  let borderColor: string | undefined;

  if (variant === 'secondary') {
    bg = C.copper;
    textColor = '#FFFFFF';
  } else if (variant === 'ghost') {
    bg = 'transparent';
    textColor = C.espresso;
  } else if (variant === 'outline') {
    bg = 'transparent';
    textColor = C.espresso;
    borderColor = C.espresso;
  }

  const finalTextColor = textColorOverride ?? textColor;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        s.btn,
        {
          backgroundColor: bg,
          paddingVertical,
          paddingHorizontal,
          borderWidth: borderColor ? 1.5 : 0,
          borderColor,
          opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={finalTextColor} size="small" />
      ) : (
        <View style={s.row}>
          {leftIcon && <View style={s.icon}>{leftIcon}</View>}
          <Text style={[s.label, { color: finalTextColor, fontSize }]}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

const s = StyleSheet.create({
  btn: {
    borderRadius: R.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: Sp.xs,
  },
  label: {
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});