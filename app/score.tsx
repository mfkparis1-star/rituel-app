/**
 * Score detail screen (Phase 16D D4).
 *
 * Big soft number + label + 5-signal breakdown. Reflective tone, no
 * gamification noise. Each signal shows current points and a soft
 * descriptor — never "you failed" or "you missed".
 */
import { Stack } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pressable } from 'react-native';
import { useScore } from '../hooks/useScore';
import { safeBack } from '../utils/safeBack';
import { C, R, Sp, Type } from '../theme';

const SIGNAL_DESC: Record<string, string> = {
  checkins:  'Tes check-ins de la semaine',
  routine:   'Ton rituel matin et soir',
  analysis:  'Tes analyses récentes',
  archive:   'Tes produits actifs',
  community: 'Ta présence dans la communauté',
};

export default function ScoreScreen() {
  const { score, loading } = useScore();

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => safeBack('/(tabs)')} style={s.back}>
          <Text style={s.backTxt}>{'←  Retour'}</Text>
        </Pressable>

        <Text style={s.label}>MON ÉNERGIE</Text>

        {loading || !score ? (
          <View style={s.centered}><ActivityIndicator color={C.copper} /></View>
        ) : (
          <>
            <Text style={s.bigNumber}>{score.total}</Text>
            <Text style={s.bigLabel}>{score.label}</Text>
            <Text style={s.subtitle}>
              Ce reflet évolue doucement avec ton rituel. Il n’y a pas de mauvaise note, seulement un instant.
            </Text>

            <View style={s.breakdown}>
              {([
                ['checkins', score.checkins],
                ['routine', score.routine],
                ['analysis', score.analysis],
                ['archive', score.archive],
                ['community', score.community],
              ] as Array<[string, number]>).map(([key, val]) => (
                <View key={key} style={s.signalRow}>
                  <View style={s.signalText}>
                    <Text style={s.signalDesc}>{SIGNAL_DESC[key]}</Text>
                  </View>
                  <Text style={s.signalVal}>{val} / 20</Text>
                </View>
              ))}
            </View>
          </>
        )}

        <View style={{ height: Sp.huge }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.appBg },
  scroll: { paddingHorizontal: Sp.lg, paddingTop: Sp.sm, paddingBottom: Sp.huge },
  centered: { padding: Sp.xl, alignItems: 'center' },
  back: { paddingVertical: Sp.sm, marginBottom: Sp.md },
  backTxt: { fontSize: 14, color: C.textMid },
  label: { fontSize: 11, letterSpacing: 1.5, color: C.copper, fontWeight: '600', marginBottom: Sp.xl },
  bigNumber: {
    fontSize: 88,
    fontWeight: '200',
    color: C.espresso,
    textAlign: 'center',
    letterSpacing: -2,
  },
  bigLabel: {
    fontSize: 22,
    color: C.copper,
    textAlign: 'center',
    fontWeight: '500',
    marginTop: Sp.xs,
    marginBottom: Sp.md,
    letterSpacing: 0.5,
  },
  subtitle: {
    ...Type.body,
    color: C.textMid,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Sp.xl,
    paddingHorizontal: Sp.md,
  },
  breakdown: {
    backgroundColor: C.bg2,
    borderRadius: R.md,
    padding: Sp.lg,
  },
  signalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Sp.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: C.border,
  },
  signalText: { flex: 1 },
  signalDesc: { fontSize: 14, color: C.text },
  signalVal: { fontSize: 14, color: C.copper, fontWeight: '600' },
});
