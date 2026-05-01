import { StyleSheet, Text, View } from 'react-native';
import { C, Type } from '../../theme';

export default function CompatibilityScreen() {
  return (
    <View style={s.root}>
      <Text style={s.title}>compatibility</Text>
      <Text style={s.sub}>Phase 2 placeholder</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.appBg, alignItems: 'center', justifyContent: 'center' },
  title: { ...Type.h2, marginBottom: 8 },
  sub: { ...Type.bodySmall },
});
