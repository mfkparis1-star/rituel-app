/**
 * AphorismCard — one rotating brand line per day.
 *
 * Pure presentational: receives the already-selected text.
 * Serif italic on blush surface with a thin crescent accent.
 * No network, no state — works offline by design.
 */
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { C, R, Sp } from '../../theme';

type Props = {
  text: string;
};

export default function AphorismCard({ text }: Props) {
  return (
    <View style={s.card}>
      <Text style={s.text}>{text}</Text>
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
        <Path
          d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"
          stroke={C.copper}
          strokeWidth={1.4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Sp.sm,
    backgroundColor: C.bg2,
    borderRadius: R.md,
    paddingVertical: Sp.md,
    paddingHorizontal: Sp.md,
    marginBottom: Sp.sm,
  },
  text: {
    flex: 1,
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 21,
    color: C.textMid,
  },
});
