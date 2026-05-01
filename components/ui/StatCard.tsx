import { StyleSheet, Text, View } from 'react-native';
import { C, R, Sh, Sp } from '../../theme';

type Props = {
  label: string;
  value: string | number;
  hint?: string;
};

export default function StatCard({ label, value, hint }: Props) {
  return (
    <View style={[s.card, Sh.soft]}>
      <Text style={s.value}>{value}</Text>
      <Text style={s.label}>{label}</Text>
      {hint && <Text style={s.hint}>{hint}</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: C.white,
    borderRadius: R.md,
    padding: Sp.md,
    alignItems: 'center',
    minHeight: 80,
    justifyContent: 'center',
  },
  value: {
    fontSize: 22,
    fontWeight: '600',
    color: C.text,
    marginBottom: 4,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    color: C.textSoft,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  hint: {
    fontSize: 10,
    color: C.copper,
    marginTop: 2,
  },
});
