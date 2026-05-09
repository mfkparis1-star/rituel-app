/**
 * EmojiScale — 5-emoji selector for daily skin check-in.
 *
 * Renders the CHECKIN_EMOJIS list as a horizontal row of large
 * tap targets. Selected emoji is visually highlighted; tapping
 * the same one again is a no-op (selection is monotonic until
 * user picks a different one).
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CheckinEmoji, CHECKIN_EMOJIS } from '../../utils/checkins';
import { C, R, Sp } from '../../theme';

type Props = {
  value: CheckinEmoji | null;
  onChange: (emoji: CheckinEmoji) => void;
  disabled?: boolean;
};

export default function EmojiScale({ value, onChange, disabled }: Props) {
  return (
    <View style={s.row}>
      {CHECKIN_EMOJIS.map((e) => {
        const selected = value === e.id;
        return (
          <Pressable
            key={e.id}
            onPress={() => !disabled && onChange(e.id)}
            disabled={disabled}
            style={[s.cell, selected && s.cellSelected]}
            hitSlop={4}
          >
            <Text style={s.symbol}>{e.symbol}</Text>
            <Text style={[s.label, selected && s.labelSelected]} numberOfLines={1}>
              {e.label_fr}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Sp.xs,
  },
  cell: {
    flex: 1,
    paddingVertical: Sp.md,
    paddingHorizontal: Sp.xs,
    backgroundColor: C.bg2,
    borderRadius: R.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  cellSelected: {
    backgroundColor: C.cream,
    borderColor: C.copper,
  },
  symbol: {
    fontSize: 28,
    marginBottom: 4,
  },
  label: {
    fontSize: 10,
    color: C.textMid,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  labelSelected: {
    color: C.espresso,
    fontWeight: '600',
  },
});
