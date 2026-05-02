import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import HeroCard from '../../components/ui/HeroCard';
import PillButton from '../../components/ui/PillButton';
import PremiumCard from '../../components/ui/PremiumCard';
import { C, R, Sh, Sp, Type } from '../../theme';
import { safeBack } from '../../utils/safeBack';

type Occasion = {
  id: string;
  label: string;
};

const OCCASIONS: Occasion[] = [
  { id: 'birthday', label: 'Anniversaire' },
  { id: 'girls_night', label: 'Soirée entre filles' },
  { id: 'dinner', label: 'Dîner' },
  { id: 'masquerade', label: 'Bal masqué' },
  { id: 'work_meeting', label: 'Réunion pro' },
  { id: 'wedding', label: 'Mariage' },
  { id: 'daily', label: 'Quotidien' },
];

type FeatureRow = {
  label: string;
  title: string;
  description: string;
};

const FEATURES: FeatureRow[] = [
  {
    label: 'ARCHIVE',
    title: 'Utilise ton archive',
    description: 'L\'IA suggère des looks à partir de tes produits.',
  },
  {
    label: 'COMPLET',
    title: 'Produits manquants',
    description: 'Découvre ce qu\'il te faut pour réaliser le look.',
  },
  {
    label: 'PERSONNALISÉ',
    title: 'Adapté à l\'événement',
    description: 'Chaque suggestion correspond à ton occasion.',
  },
];

function BackArrow({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M19 12H5" />
      <Path d="M12 19l-7-7 7-7" />
    </Svg>
  );
}

export default function MakeupScreen() {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.topBar}>
          <Pressable onPress={() => safeBack('/(tabs)/ai-studio')} style={s.backBtn} hitSlop={8}>
            <BackArrow color={C.espresso} />
          </Pressable>
        </View>

        <HeroCard
          label="STUDIO MAQUILLAGE"
          title="Découvre ton maquillage parfait"
          subtitle="Une routine adaptée à ton événement, ton style et ta peau."
          ctaLabel="Prendre une photo"
          variant="espresso"
          onPress={() => {
            // Phase 14: real makeup AI flow will be wired here
          }}
          style={{ marginBottom: Sp.xl }}
        />

        <Text style={s.sectionTitle}>Choisis l'événement</Text>

        <View style={s.occasionGrid}>
          {OCCASIONS.map((o) => {
            const active = selected === o.id;
            return (
              <Pressable
                key={o.id}
                onPress={() => setSelected(o.id)}
                style={({ pressed }) => [
                  s.occasionCard,
                  Sh.soft,
                  active && s.occasionCardActive,
                  pressed && { opacity: 0.85 },
                ]}
              >
                <Text style={[s.occasionLabel, active && s.occasionLabelActive]}>
                  {o.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <PremiumCard variant="cream" style={s.suggestionCard}>
          <Text style={s.suggestionLabel}>SUGGESTION DU JOUR</Text>
          <Text style={s.suggestionTitle}>Soft glow pour la soirée</Text>
          <Text style={s.suggestionSub}>
            Un look lumineux et naturel pensé pour mettre ton teint en valeur,
            avec ce que tu as déjà dans ta routine.
          </Text>
          <PillButton
            label="Voir le look"
            variant="ghost"
            size="sm"
            style={{ marginTop: Sp.sm }}
          />
        </PremiumCard>

        <Text style={s.sectionTitle}>Comment ça marche</Text>

        {FEATURES.map((f, i) => (
          <View key={i} style={[s.featureRow, Sh.soft]}>
            <View style={s.featureNumber}>
              <Text style={s.featureNumberTxt}>{i + 1}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.featureLabel}>{f.label}</Text>
              <Text style={s.featureTitle}>{f.title}</Text>
              <Text style={s.featureDesc}>{f.description}</Text>
            </View>
          </View>
        ))}

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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Sh.soft,
  },
  sectionTitle: {
    ...Type.h2,
    marginBottom: Sp.md,
    marginTop: Sp.xs,
  },
  occasionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Sp.xl,
  },
  occasionCard: {
    backgroundColor: C.white,
    borderRadius: R.full,
    paddingHorizontal: Sp.md,
    paddingVertical: 10,
    marginRight: Sp.xs,
    marginBottom: Sp.xs,
    borderWidth: 1,
    borderColor: C.border,
  },
  occasionCardActive: {
    backgroundColor: C.espresso,
    borderColor: C.espresso,
  },
  occasionLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: C.text,
  },
  occasionLabelActive: {
    color: C.white,
  },
  suggestionCard: {
    marginBottom: Sp.xl,
  },
  suggestionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: C.copper,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: Sp.xs,
  },
  suggestionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: C.text,
    marginBottom: 4,
  },
  suggestionSub: {
    fontSize: 13,
    color: C.textMid,
    lineHeight: 19,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: C.white,
    borderRadius: R.md,
    padding: Sp.md,
    marginBottom: Sp.xs,
  },
  featureNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: C.cream,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Sp.sm,
  },
  featureNumberTxt: {
    fontSize: 12,
    fontWeight: '700',
    color: C.espresso,
  },
  featureLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: C.copper,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: C.text,
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 12,
    color: C.textMid,
    lineHeight: 17,
  },
});
