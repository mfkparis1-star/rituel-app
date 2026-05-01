import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import HeroCard from '../../components/ui/HeroCard';
import StatCard from '../../components/ui/StatCard';
import PremiumCard from '../../components/ui/PremiumCard';
import PillButton from '../../components/ui/PillButton';
import AffiliateProductCard, { AffiliateProductCardData } from '../../components/ui/AffiliateProductCard';
import { C, R, Sh, Sp, Type } from '../../theme';

const PLACEHOLDER_PRODUCTS: AffiliateProductCardData[] = [
  {
    id: 'placeholder-1',
    brand: 'Caudalie',
    name: 'Vinoperfect Sérum éclat anti-taches',
    price: '49 €',
    affiliateUrl: '',
    reason: 'Pour une peau lumineuse',
  },
  {
    id: 'placeholder-2',
    brand: 'La Roche-Posay',
    name: 'Toleriane Double Repair',
    price: '18 €',
    affiliateUrl: '',
    reason: 'Hydratation quotidienne',
  },
  {
    id: 'placeholder-3',
    brand: 'Avène',
    name: 'Cleanance crème nettoyante',
    price: '14 €',
    affiliateUrl: '',
    reason: 'Pour peau mixte',
  },
];

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Bonjour';
  if (h < 18) return 'Bel après-midi';
  return 'Bonsoir';
}

export default function IndexScreen() {
  const greeting = getGreeting();

  const stats = {
    active: 0,
    finished: 0,
    stocked: 0,
    total: 0,
  };

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <Text style={s.brand}>RITUEL</Text>
          <Text style={s.greeting}>{greeting}</Text>
          <Text style={s.subtitle}>Prête pour votre rituel beauté ?</Text>
        </View>

        <HeroCard
          label="ANALYSE IA"
          title="Analyse ta peau"
          subtitle="Reçois des conseils soin et maquillage personnalisés."
          ctaLabel="Lancer l'analyse"
          variant="espresso"
          onPress={() => router.push('/(tabs)/skin-analysis' as any)}
          style={{ marginBottom: Sp.lg }}
        />

        <View style={s.statsRow}>
          <StatCard label="Actifs" value={stats.active} />
          <View style={s.gap} />
          <StatCard label="Terminés" value={stats.finished} />
          <View style={s.gap} />
          <StatCard label="En stock" value={stats.stocked} />
        </View>

        <Text style={s.sectionTitle}>Pour toi aujourd'hui</Text>

        <PremiumCard variant="cream" style={s.recoCard}>
          <Text style={s.recoLabel}>ROUTINE</Text>
          <Text style={s.recoTitle}>Routine du soir prête</Text>
          <Text style={s.recoSub}>
            Trois étapes adaptées à ta peau pour un rituel apaisant.
          </Text>
          <PillButton
            label="Voir la routine"
            variant="ghost"
            size="sm"
            onPress={() => router.push('/(tabs)/routine' as any)}
            style={{ marginTop: Sp.sm }}
          />
        </PremiumCard>

        <PremiumCard variant="cream" style={s.recoCard}>
          <Text style={s.recoLabel}>MAQUILLAGE</Text>
          <Text style={s.recoTitle}>Look maquillage pour ta soirée</Text>
          <Text style={s.recoSub}>
            Une suggestion personnalisée selon ton événement.
          </Text>
          <PillButton
            label="Découvrir le look"
            variant="ghost"
            size="sm"
            onPress={() => router.push('/(tabs)/makeup' as any)}
            style={{ marginTop: Sp.sm }}
          />
        </PremiumCard>

        <PremiumCard variant="white" style={s.recoCard}>
          <Text style={s.recoLabel}>ARCHIVE</Text>
          <Text style={s.recoTitle}>Ton archive est vide</Text>
          <Text style={s.recoSub}>
            Ajoute tes soins pour suivre leur utilisation.
          </Text>
          <PillButton
            label="Ajouter un produit"
            variant="primary"
            size="sm"
            onPress={() => router.push('/(tabs)/archive' as any)}
            style={{ marginTop: Sp.sm }}
          />
        </PremiumCard>

        <View style={s.affiliateHeader}>
          <Text style={s.sectionLabel}>SÉLECTIONNÉ POUR TOI</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.affiliateScroll}
        >
          {PLACEHOLDER_PRODUCTS.map((p) => (
            <AffiliateProductCard key={p.id} product={p} variant="vertical" />
          ))}
        </ScrollView>

        <View style={{ height: Sp.huge }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.appBg },
  scroll: { paddingHorizontal: Sp.lg, paddingTop: Sp.sm, paddingBottom: Sp.xl },
  header: {
    marginBottom: Sp.xl,
    marginTop: Sp.sm,
  },
  brand: {
    fontSize: 11,
    fontWeight: '700',
    color: C.copper,
    letterSpacing: 2.4,
    marginBottom: Sp.xs,
  },
  greeting: {
    ...Type.h1,
    marginBottom: 4,
  },
  subtitle: {
    ...Type.body,
    color: C.textMid,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: Sp.xl,
  },
  gap: { width: Sp.xs },
  sectionTitle: {
    ...Type.h2,
    marginBottom: Sp.md,
    marginTop: Sp.xs,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: C.copper,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  recoCard: {
    marginBottom: Sp.sm,
  },
  recoLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: C.copper,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: Sp.xs,
  },
  recoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: C.text,
    marginBottom: Sp.xxs,
  },
  recoSub: {
    fontSize: 13,
    color: C.textMid,
    lineHeight: 19,
  },
  affiliateHeader: {
    marginTop: Sp.xl,
    marginBottom: Sp.md,
  },
  affiliateScroll: {
    paddingRight: Sp.lg,
  },
});
