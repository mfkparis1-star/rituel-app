import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import EmptyState from '../../components/ui/EmptyState';
import PillButton from '../../components/ui/PillButton';
import { C, R, Sh, Sp, Type } from '../../theme';

type JournalEntry = {
  id: string;
  date: string;
  note: string;
  photoUri?: string;
};

function BackArrow({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M19 12H5" />
      <Path d="M12 19l-7-7 7-7" />
    </Svg>
  );
}

export default function JournalScreen() {
  const [entries] = useState<JournalEntry[]>([]);

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.topBar}>
          <Pressable onPress={() => router.back()} style={s.backBtn} hitSlop={8}>
            <BackArrow color={C.espresso} />
          </Pressable>
        </View>

        <View style={s.header}>
          <Text style={s.title}>Journal de peau</Text>
          <Text style={s.subtitle}>
            Suivez l'évolution de votre peau au fil du temps.
          </Text>
        </View>

        {entries.length === 0 ? (
          <View style={s.emptyCard}>
            <EmptyState
              title="Aucune entrée pour le moment"
              subtitle="Ajoutez une photo ou une note pour suivre vos progrès."
              action={
                <PillButton
                  label="Ajouter une entrée"
                  variant="primary"
                />
              }
            />
          </View>
        ) : (
          <View style={s.timeline}>
            {entries.map((e) => (
              <View key={e.id} style={[s.entryCard, Sh.soft]}>
                <Text style={s.entryDate}>{e.date}</Text>
                {e.photoUri && (
                  <View style={s.photoPlaceholder} />
                )}
                <Text style={s.entryNote}>{e.note}</Text>
              </View>
            ))}
            <PillButton
              label="+ Nouvelle entrée"
              variant="outline"
              fullWidth
              style={{ marginTop: Sp.md }}
            />
          </View>
        )}

        <View style={{ height: Sp.huge }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.appBg },
  scroll: { paddingHorizontal: Sp.lg, paddingTop: Sp.sm, paddingBottom: Sp.xl },
  topBar: { flexDirection: 'row', alignItems: 'center', marginBottom: Sp.md },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: C.white, alignItems: 'center', justifyContent: 'center',
    ...Sh.soft,
  },
  header: { marginBottom: Sp.lg, marginTop: Sp.sm },
  title: { ...Type.h1, marginBottom: 4 },
  subtitle: { ...Type.body, color: C.textMid },
  emptyCard: {
    backgroundColor: C.white,
    borderRadius: R.lg,
    ...Sh.soft,
  },
  timeline: {},
  entryCard: {
    backgroundColor: C.white,
    borderRadius: R.md,
    padding: Sp.md,
    marginBottom: Sp.sm,
  },
  entryDate: {
    fontSize: 11,
    fontWeight: '700',
    color: C.copper,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: Sp.xs,
  },
  photoPlaceholder: {
    width: '100%',
    height: 160,
    borderRadius: R.sm,
    backgroundColor: C.cream,
    marginBottom: Sp.sm,
  },
  entryNote: {
    fontSize: 14,
    color: C.text,
    lineHeight: 20,
  },
});
