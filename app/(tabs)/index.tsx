/**
 * Adaptive Home — Phase 16C M4.
 *
 * Replaces the static home with three signal-driven blocks:
 *   - Aujourd'hui: today's check-in + a soft suggestion based on it
 *   - Cette semaine: 7-day check-in series + weekly tip
 *   - À propos de toi: skin type, concerns, last AI summary, archive count
 *
 * Signals consumed:
 *   - useCheckins (recent + hasToday)
 *   - useMemory (last_analysis_summary, archive_signals)
 *   - useRoutineCount
 *   - getAffiliateRecommendations (Pour toi block, kept from previous home)
 *
 * If the user is signed out or has no signals, the home gracefully
 * degrades to a clean welcome state with the Skin Analysis CTA.
 */
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import HeroCard from '../../components/ui/HeroCard';
import PremiumCard from '../../components/ui/PremiumCard';
import PillButton from '../../components/ui/PillButton';
import AffiliateProductCard from '../../components/ui/AffiliateProductCard';
import { getAffiliateRecommendations } from '../../utils/affiliateRecommendations';
import type { AffiliateProduct } from '../../utils/affiliateRecommendations';
import { useRoutineCount } from '../../hooks/useRoutineCount';
import { useMemory } from '../../hooks/useMemory';
import { useCheckins } from '../../hooks/useCheckins';
import { CHECKIN_EMOJIS, CheckinEmoji } from '../../utils/checkins';
import { C, R, Sh, Sp, Type } from '../../theme';

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Bonjour';
  if (h < 18) return 'Bel après-midi';
  return 'Bonsoir';
}

function emojiSymbol(id: CheckinEmoji): string {
  return CHECKIN_EMOJIS.find((e) => e.id === id)?.symbol ?? '·';
}

function todaySuggestion(latest: CheckinEmoji | null): string {
  switch (latest) {
    case 'glowing': return 'Profite. Garde ta routine telle quelle aujourd’hui.';
    case 'good':    return 'Routine de base. Hydratation + SPF.';
    case 'neutral': return 'Ajoute un sérum apaisant ce soir.';
    case 'tired':   return 'Allège : nettoyant doux + crème riche, pas d’actifs ce soir.';
    case 'rough':   return 'Pause des actifs. Crème barrière + masque hydratant.';
    default:        return 'Un check-in de 10 secondes suffit pour ajuster tes conseils du jour.';
  }
}

function weekSummary(emojis: CheckinEmoji[]): string {
  if (emojis.length === 0) return '';
  const counts: Record<string, number> = {};
  emojis.forEach((e) => { counts[e] = (counts[e] ?? 0) + 1; });
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  const dominant = top[0] as CheckinEmoji;
  const sym = emojiSymbol(dominant);
  return `${emojis.length} check-in${emojis.length > 1 ? 's' : ''} cette semaine. Tendance : ${sym}`;
}

export default function IndexScreen() {
  const greeting = getGreeting();
  const { count: routineCount } = useRoutineCount();
  const { memory } = useMemory();
  const { recent, hasToday } = useCheckins(7);

  const [recommendations, setRecommendations] = useState<AffiliateProduct[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const items = await getAffiliateRecommendations({}, 4);
        if (mounted) setRecommendations(items);
      } catch {
        // silent
      }
    })();
    return () => { mounted = false; };
  }, []);

  const latestCheckin = recent[0]?.emoji ?? null;
  const weekEmojis = recent.map((c) => c.emoji);
  const lastSummary = memory?.last_analysis_summary ?? null;

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.brand}>RITUEL</Text>
          <Text style={s.greeting}>{greeting}</Text>
          <Text style={s.subtitle}>Prête pour ton rituel beauté ?</Text>
        </View>

        {/* Check-in CTA (only when not done today) */}
        {!hasToday && (
          <Pressable
            onPress={() => router.push('/check-in' as any)}
            style={s.checkinCard}
          >
            <Text style={s.checkinLabel}>CHECK-IN DU JOUR</Text>
            <Text style={s.checkinTitle}>Comment va ta peau aujourd’hui ?</Text>
            <Text style={s.checkinSub}>10 secondes pour ajuster ton rituel du jour.</Text>
          </Pressable>
        )}

        {/* Aujourd'hui block */}
        <Text style={s.sectionTitle}>Aujourd’hui</Text>
        <PremiumCard variant="cream" style={s.block}>
          <View style={s.blockRow}>
            <Text style={s.bigEmoji}>{latestCheckin ? emojiSymbol(latestCheckin) : '·'}</Text>
            <View style={s.blockText}>
              <Text style={s.blockTitle}>
                {latestCheckin
                  ? CHECKIN_EMOJIS.find((e) => e.id === latestCheckin)?.label_fr
                  : 'Ta peau attend son rituel'}
              </Text>
              <Text style={s.blockSub}>{todaySuggestion(latestCheckin)}</Text>
            </View>
          </View>
        </PremiumCard>

        {/* Cette semaine block */}
        <View style={s.sectionTitleRow}>
          <Text style={s.sectionTitle}>Cette semaine</Text>
          <Pressable onPress={() => router.push('/glow-timeline' as any)} hitSlop={6}>
            <Text style={s.sectionLink}>Voir tout →</Text>
          </Pressable>
        </View>
        <PremiumCard variant="espresso" style={s.blockWeek}>
          {weekEmojis.length === 0 ? (
            <>
              <Text style={s.weekTitle}>Ton rythme commence ici</Text>
              <Text style={s.weekSub}>
                Fais ton premier check-in pour construire ton suivi beauté de la semaine.
              </Text>
            </>
          ) : (
            <>
              <Text style={s.weekTxt}>{weekSummary(weekEmojis)}</Text>
              <View style={s.weekRow}>
                {weekEmojis.slice(0, 7).map((e, i) => (
                  <Text key={i} style={s.weekEmoji}>{emojiSymbol(e)}</Text>
                ))}
              </View>
            </>
          )}
        </PremiumCard>

        {/* À propos de toi block */}
        <Text style={s.sectionTitle}>À propos de toi</Text>
        <PremiumCard variant="cream" style={s.block}>
          {lastSummary?.skinType ? (
            <>
              <Text style={s.aboutLabel}>TYPE DE PEAU</Text>
              <Text style={s.aboutValue}>{lastSummary.skinType}</Text>
              {lastSummary.issues && lastSummary.issues.length > 0 && (
                <>
                  <Text style={[s.aboutLabel, { marginTop: Sp.md }]}>OBSERVATIONS</Text>
                  <Text style={s.aboutValue}>{lastSummary.issues.join(' · ')}</Text>
                </>
              )}
              <Text style={[s.aboutLabel, { marginTop: Sp.md }]}>ROUTINE</Text>
              <Text style={s.aboutValue}>
                {routineCount > 0 ? `${routineCount} étape${routineCount > 1 ? 's' : ''}` : 'Pas encore configurée'}
              </Text>
            </>
          ) : (
            <>
              <Text style={s.blockTitle}>Rituel apprend à te connaître</Text>
              <Text style={s.blockSub}>
                Lance ta première analyse pour adapter tes conseils à ta peau, ton rythme et tes produits.
              </Text>
              <PillButton
                label="Analyser ma peau"
                variant="primary"
                onPress={() => router.push('/(tabs)/skin-analysis' as any)}
                style={{ marginTop: Sp.md }}
              />
            </>
          )}
        </PremiumCard>

        {/* Skin Analysis CTA — always visible, complementary */}
        {lastSummary?.skinType && (
          <HeroCard
            label="ANALYSE IA"
            title="Refais ton analyse"
            subtitle="Tes besoins évoluent. Une nouvelle photo, des conseils mis à jour."
            ctaLabel="Lancer l’analyse"
            variant="espresso"
            onPress={() => router.push('/(tabs)/skin-analysis' as any)}
            style={{ marginBottom: Sp.lg }}
          />
        )}

        {/* Pour toi — affiliate recommendations */}
        {recommendations.length > 0 && (
          <>
            <Text style={s.sectionTitle}>Sélectionné pour toi</Text>
            {recommendations.map((p) => (
              <AffiliateProductCard key={p.id} product={p} />
            ))}
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
  header: { marginBottom: Sp.lg, marginTop: Sp.sm },
  brand: {
    fontSize: 11,
    letterSpacing: 3,
    color: C.copper,
    fontWeight: '600',
    marginBottom: 6,
  },
  greeting: { ...Type.h1, marginBottom: 4 },
  subtitle: { ...Type.body, color: C.textMid, marginBottom: Sp.md },

  checkinCard: {
    backgroundColor: C.cream,
    padding: Sp.lg,
    borderRadius: R.lg,
    marginBottom: Sp.lg,
    borderWidth: 1,
    borderColor: C.copper,
  },
  checkinLabel: {
    fontSize: 10,
    letterSpacing: 1.5,
    color: C.copper,
    fontWeight: '600',
    marginBottom: 6,
  },
  checkinTitle: {
    fontSize: 18,
    color: C.espresso,
    fontWeight: '500',
    marginBottom: 4,
  },
  checkinSub: {
    fontSize: 13,
    color: C.textMid,
  },

  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: C.text,
    marginBottom: Sp.sm,
    marginTop: Sp.md,
    letterSpacing: 0.3,
  },

  block: { marginBottom: Sp.md, padding: Sp.lg },
  blockRow: { flexDirection: 'row', alignItems: 'center', gap: Sp.md },
  bigEmoji: { fontSize: 36 },
  blockText: { flex: 1 },
  blockTitle: {
    fontSize: 16,
    color: C.espresso,
    fontWeight: '500',
    marginBottom: 4,
  },
  blockSub: {
    fontSize: 13,
    color: C.textMid,
    lineHeight: 19,
  },

  weekTxt: {
    fontSize: 14,
    color: C.cream,
    marginBottom: Sp.md,
  },
  weekRow: { flexDirection: 'row', gap: Sp.xs },
  weekEmoji: { fontSize: 22 },

  aboutLabel: {
    fontSize: 10,
    letterSpacing: 1.2,
    color: C.copper,
    fontWeight: '600',
    marginBottom: 4,
  },
  aboutValue: {
    fontSize: 15,
    color: C.espresso,
    textTransform: 'capitalize',
  },
  blockWeek: { marginBottom: Sp.md, paddingHorizontal: Sp.lg, paddingVertical: Sp.md },
  weekTitle: {
    fontSize: 16,
    color: C.cream,
    fontWeight: '500',
    marginBottom: 6,
  },
  weekSub: {
    fontSize: 13,
    color: C.cream,
    opacity: 0.75,
    lineHeight: 18,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: Sp.sm,
    marginTop: Sp.md,
  },
  sectionLink: {
    fontSize: 12,
    color: C.copper,
    fontWeight: '500',
  },
});
