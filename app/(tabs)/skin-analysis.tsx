import { StyleSheet, Text, View } from 'react-native';
import { C, Type } from '../../theme';

export default function SkinAnalysisScreen() {
  return (
    <View style={s.root}>
      <Text style={s.title}>skin-analysis</Text>
      <Text style={s.sub}>Phase 2 placeholder</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.appBg, alignItems: 'center', justifyContent: 'center' },
  title: { ...Type.h2, marginBottom: 8 },
  sub: { ...Type.bodySmall },
});
