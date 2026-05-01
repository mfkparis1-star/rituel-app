import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import HeroCard from '../../components/ui/HeroCard';
import PremiumCard from '../../components/ui/PremiumCard';
import PillButton from '../../components/ui/PillButton';
import { C, R, Sh, Sp, Type } from '../../theme';

function MakeupIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 2v6" />
      <Rect x={8} y={8} width={8} height={14} rx={2} />
    </Svg>
  );
}

function JournalIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M4 4h12a4 4 0 014 4v12a0 0 0 010 0H8a4 4 0 01-4-4V4z" />
      <Path d="M8 8h8M8 12h8M8 16h5" />
    </Svg>
  );
}

function RoutineIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx={12} cy={12} r={9} />
      <Path d="M12 7v5l3 2" />
    </Svg>
  );
}

function CompatibilityIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M9 3v6l-5 9a4 4 0 003.5 6h9a4 4 0 003.5-6l-5-9V3" />
      <Path d="M7 3h10" />
    </Svg>
  );
}

type ToolCard = {
  id: string;
  label: string;
  title: string;
  description: string;
  route: string;
  Icon: (props: { color: string }) => any;
};

const TOOLS: ToolCard[] = [
  {
    id: 'makeup',
    label: 'MAQUILLAGE',
    title: 'Studio Maquillage',
    description: 'Looks personnalisés selon ton événement.',
    route: '/(tabs)/makeup',
    Icon: MakeupIcon,
  },
  {
    id: 'journal',
    label: 'JOURNAL',
    title: 'Journal de peau',
    description: 'Suis l\'évolution de ta peau au fil du temps.',
    route: '/(tabs)/journal',
    Icon: JournalIcon,
  },
  {
    id: 'routine',
    label: 'ROUTINE',
    title: 'Mon rituel',
    description: 'Compose et optimise ta routine matin et soir.',
    route: '/(tabs)/routine',
    Icon: RoutineIcon,
  },
  {
    id: 'compatibility',
    label: 'INGRÉDIENTS',
    title: 'Compatibilité ingrédients',
    description: 'Vérifie si tes produits font bon ménage.',
    route: '/(tabs)/compatibility',
    Icon: CompatibilityIcon,
  },
];

export default function AIStudioScreen() {
  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <Text style={s.label}>STUDIO IA</Text>
          <Text style={s.title}>Tes outils beauté</Text>
          <Text style={s.subtitle}>Cinq expériences IA pour révéler ta peau</Text>
        </View>

        <HeroCard
          label="ANALYSE IA"
          title="Analyse de peau IA"
          subtitle="Détecte ton type de peau, tes besoins et les produits manquants."
          ctaLabel="Commencer"
          variant="espresso"
          onPress={() => router.push('/(tabs)/skin-analysis' as any)}
          style={{ marginBottom: Sp.xl }}
        />

        <View style={s.grid}>
          {TOOLS.map((tool) => {
            const Icon = tool.Icon;
            return (
              <Pressable
                key={tool.id}
                onPress={() => router.push(tool.route as any)}
                style={({ pressed }) => [
                  s.toolCard,
                  Sh.soft,
                  pressed && { opacity: 0.85 },
                ]}
              >
                <View style={s.toolIconBox}>
                  <Icon color={C.espresso} />
                </View>
                <Text style={s.toolLabel}>{tool.label}</Text>
                <Text style={s.toolTitle}>{tool.title}</Text>
                <Text style={s.toolDesc} numberOfLines={2}>
                  {tool.description}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <PremiumCard variant="espresso" style={s.premium}>
          <Text style={s.premiumLabel}>PREMIUM</Text>
          <Text style={s.premiumTitle}>Débloque tout</Text>
          <Text style={s.premiumSub}>
            Analyses illimitées, routines IA et recommandations personnalisées.
          </Text>
          <PillButton
            label="Passer Premium"
            variant="primary"
            size="md"
            onPress={() => router.push('/paywall' as any)}
            style={{ marginTop: Sp.md, backgroundColor: C.white }}
          />
        </PremiumCard>

        <View style={{ height: Sp.huge }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.appBg },
  scroll: { paddingHorizontal: Sp.lg, paddingTop: Sp.sm, paddingBottom: Sp.xl },
  header: { marginBottom: Sp.xl, marginTop: Sp.sm },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: C.copper,
    letterSpacing: 2.4,
    marginBottom: Sp.xs,
  },
  title: { ...Type.h1, marginBottom: 4 },
  subtitle: { ...Type.body, color: C.textMid },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: Sp.xl,
  },
  toolCard: {
    width: '48.5%',
    backgroundColor: C.white,
    borderRadius: R.lg,
    padding: Sp.md,
    marginBottom: Sp.sm,
    minHeight: 160,
  },
  toolIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.cream,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Sp.sm,
  },
  toolLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: C.copper,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  toolTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: C.text,
    marginBottom: Sp.xxs,
  },
  toolDesc: {
    fontSize: 12,
    color: C.textMid,
    lineHeight: 17,
  },
  premium: { marginTop: Sp.sm },
  premiumLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: C.copper,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    marginBottom: Sp.xs,
  },
  premiumTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: C.white,
    marginBottom: Sp.xs,
  },
  premiumSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.78)',
    lineHeight: 19,
  },
});
