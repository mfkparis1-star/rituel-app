import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import HeroCard from '../../components/ui/HeroCard';
import StatCard from '../../components/ui/StatCard';
import PremiumCard from '../../components/ui/PremiumCard';
import PillButton from '../../components/ui/PillButton';
import { useEffect, useState } from 'react';
import AffiliateProductCard from '../../components/ui/AffiliateProductCard';
import { getAffiliateRecommendations } from '../../utils/affiliateRecommendations';
import { useRoutineCount } from '../../hooks/useRoutineCount';
import type { AffiliateProduct } from '../../utils/affiliateRecommendations';
import { C, R, Sh, Sp, Type } from '../../theme';

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Bonjour';
  if (h < 18) return 'Bel après-midi';
  return 'Bonsoir';
}

export default function IndexScreen() {
  const greeting = getGreeting();
  const { count: routineCount } = useRoutineCount();

  const [recommendations, setRecommendations] = useState<AffiliateProduct[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const items = await getAffiliateRecommendations({}, 4);
        if (mounted) setRecommendations(items);
      } catch {
        // silent fail — section hides
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

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
          <Text style={s.recoTitle}>
            {routineCount > 0 ? 'Ta routine est prête' : 'Aucune routine encore'}
          </Text>
          <Text style={s.recoSub}>
            {routineCount > 0
              ? `${routineCount} étape${routineCount > 1 ? 's' : ''} dans ton rituel quotidien.`
              : 'Ajoute tes premiers soins pour construire ton rituel.'}
          </Text>
          <PillButton
            label={routineCount > 0 ? 'Voir la routine' : 'Créer ma routine'}
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
          <Text style={s.recoTitle}>Ton archive beauté</Text>
          <Text style={s.recoSub}>
            Ajoute ou retrouve tes soins favoris.
          </Text>
          <PillButton
            label="Ajouter un produit"
            variant="primary"
            size="sm"
            onPress={() => router.push('/(tabs)/archive' as any)}
            style={{ marginTop: Sp.sm }}
          />
        </PremiumCard>

        {recommendations.length > 0 && (
          <>
            <View style={s.affiliateHeader}>
              <Text style={s.sectionLabel}>SÉLECTIONNÉ POUR TOI</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.affiliateScroll}
            >
              {recommendations.map((p) => (
                <AffiliateProductCard key={p.id} product={p} variant="vertical" />
              ))}
            </ScrollView>
          </>
        )}

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
