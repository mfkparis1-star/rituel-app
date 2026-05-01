import { Pressable, StyleSheet, Text } from 'react-native';
import { C, R, Sp } from '../../theme';

type Props = {
  label: string;
  active?: boolean;
  onPress?: () => void;
  size?: 'sm' | 'md';
};

export default function Chip({ label, active = false, onPress, size = 'md' }: Props) {
  const paddingVertical = size === 'sm' ? 6 : 8;
  const paddingHorizontal = size === 'sm' ? 12 : 16;
  const fontSize = size === 'sm' ? 12 : 13;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        s.chip,
        {
          paddingVertical,
          paddingHorizontal,
          backgroundColor: active ? C.espresso : C.white,
          borderColor: active ? C.espresso : C.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <Text
        style={[
          s.label,
          { fontSize, color: active ? '#FFFFFF' : C.textMid },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  chip: {
    borderRadius: R.full,
    borderWidth: 1,
    marginRight: Sp.xs,
  },
  label: {
    fontWeight: '500',
  },
});
