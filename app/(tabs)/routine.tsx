import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import EmptyState from '../../components/ui/EmptyState';
import PillButton from '../../components/ui/PillButton';
import { C, R, Sh, Sp, Type } from '../../theme';
import { safeBack } from '../../utils/safeBack';

type Slot = 'morning' | 'evening';

type RoutineStep = {
  id: string;
  category: string;
  product: string;
  time: string;
  notes?: string;
};

function BackArrow({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M19 12H5" />
      <Path d="M12 19l-7-7 7-7" />
    </Svg>
  );
}

export default function RoutineScreen() {
  const [slot, setSlot] = useState<Slot>('morning');
  const [steps] = useState<RoutineStep[]>([]);

  const filtered = steps;

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.topBar}>
          <Pressable onPress={() => safeBack('/(tabs)/ai-studio')} style={s.backBtn} hitSlop={8}>
            <BackArrow color={C.espresso} />
          </Pressable>
        </View>

        <View style={s.header}>
          <Text style={s.title}>Ma Routine</Text>
          <Text style={s.subtitle}>
            Construisez une routine simple et cohérente.
          </Text>
        </View>

        <View style={s.segmented}>
          <Pressable
            onPress={() => setSlot('morning')}
            style={[s.segBtn, slot === 'morning' && s.segBtnActive]}
          >
            <Text style={[s.segTxt, slot === 'morning' && s.segTxtActive]}>
              Matin
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setSlot('evening')}
            style={[s.segBtn, slot === 'evening' && s.segBtnActive]}
          >
            <Text style={[s.segTxt, slot === 'evening' && s.segTxtActive]}>
              Soir
            </Text>
          </Pressable>
        </View>

        {filtered.length === 0 ? (
          <View style={s.emptyCard}>
            <EmptyState
              title="Votre routine est prête à être construite"
              subtitle="Ajoutez vos étapes pour mieux suivre vos soins."
              action={
                <PillButton
                  label="+ Ajouter une étape"
                  variant="primary"
                />
              }
            />
          </View>
        ) : (
          <View style={s.list}>
            {filtered.map((step) => (
              <View key={step.id} style={[s.stepCard, Sh.soft]}>
                <Text style={s.stepCategory}>{step.category.toUpperCase()}</Text>
                <Text style={s.stepProduct}>{step.product}</Text>
                <Text style={s.stepTime}>{step.time}</Text>
                {step.notes && <Text style={s.stepNotes}>{step.notes}</Text>}
              </View>
            ))}
            <PillButton
              label="+ Ajouter une étape"
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
  segmented: {
    flexDirection: 'row',
    backgroundColor: C.white,
    borderRadius: R.full,
    padding: 4,
    marginBottom: Sp.lg,
    borderWidth: 1,
    borderColor: C.border,
  },
  segBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: R.full,
    alignItems: 'center',
  },
  segBtnActive: { backgroundColor: C.espresso },
  segTxt: { fontSize: 13, fontWeight: '500', color: C.textMid },
  segTxtActive: { color: C.white },
  emptyCard: {
    backgroundColor: C.white,
    borderRadius: R.lg,
    ...Sh.soft,
  },
  list: {},
  stepCard: {
    backgroundColor: C.white,
    borderRadius: R.md,
    padding: Sp.md,
    marginBottom: Sp.xs,
  },
  stepCategory: {
    fontSize: 9,
    fontWeight: '700',
    color: C.copper,
    letterSpacing: 1.4,
    marginBottom: 2,
  },
  stepProduct: {
    fontSize: 14,
    fontWeight: '600',
    color: C.text,
    marginBottom: 2,
  },
  stepTime: { fontSize: 12, color: C.textMid },
  stepNotes: { fontSize: 12, color: C.textSoft, marginTop: 4 },
});
