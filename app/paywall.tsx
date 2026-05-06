import { router, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import PillButton from '../components/ui/PillButton';
import { C, G, R, Sh, Sp, Type } from '../theme';
import { trackEvent } from '../utils/analytics';
import { safeBack } from '../utils/safeBack';
import { purchaseProduct, restorePurchases, hasActivePremium } from '../utils/purchases';

type Plan = 'monthly' | 'yearly';

type PlanInfo = {
  id: Plan;
  title: string;
  price: string;
  period: string;
  hint?: string;
  badge?: string;
};

const PRODUCT_IDS: Record<Plan, string> = {
  monthly: 'com.mfkparis.rituel.premium.monthly',
  yearly: 'com.mfkparis.rituel.premium.yearly',
};

const PLANS: PlanInfo[] = [
  {
    id: 'monthly',
    title: 'Mensuel',
    price: '2,99 €',
    period: '/ mois',
  },
  {
    id: 'yearly',
    title: 'Annuel',
    price: '17,99 €',
    period: '/ an',
    hint: 'Soit 1,49 €/mois',
    badge: 'MEILLEURE OFFRE',
  },
];

const BENEFITS = [
  'Analyses IA complètes',
  'Recommandations personnalisées',
  'Accès illimité à toutes les fonctionnalités',
];

function CloseIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M18 6L6 18M6 6l12 12" />
    </Svg>
  );
}

function CheckIcon({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M20 6L9 17l-5-5" />
    </Svg>
  );
}

export default function PaywallScreen() {
  const [selected, setSelected] = useState<Plan>('yearly');
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    trackEvent('paywall_viewed', { source: 'route' });
  }, []);

  const handlePurchase = async () => {
    if (purchasing) return;
    setPurchasing(true);
    trackEvent('paywall_cta_clicked', { plan: selected });
    try {
      const productId = PRODUCT_IDS[selected];
      const result = await purchaseProduct(productId);
      if (result.ok) {
        const premium = hasActivePremium(result.customerInfo);
        if (premium) {
          trackEvent('purchase_success', { plan: selected });
          Alert.alert(
            'Bienvenue dans Rituel Premium',
            'Tu as maintenant accès à toutes les fonctionnalités premium.'
          );
          safeBack('/(tabs)/auth');
        } else {
          Alert.alert(
            'Achat reçu',
            'Ton abonnement sera activé sous peu.'
          );
        }
      } else if ('userCancelled' in result && result.userCancelled) {
        // silent
      } else {
        trackEvent('purchase_failed', { plan: selected });
        const errMsg = 'error' in result ? result.error : 'unknown';
        Alert.alert(
          'Achat impossible (debug)',
          `Product: ${productId}\nError: ${errMsg}`
        );
      }
    } catch (e: any) {
      trackEvent('purchase_failed', { plan: selected });
      Alert.alert(
        'Achat impossible (catch)',
        `Plan: ${selected}\nException: ${e?.message || String(e)}`
      );
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    if (restoring) return;
    setRestoring(true);
    trackEvent('restore_clicked');
    try {
      const customerInfo = await restorePurchases();
      const premium = hasActivePremium(customerInfo);
      if (premium) {
        trackEvent('restore_success');
        Alert.alert(
          'Achats restaurés',
          'Ton abonnement Rituel Premium est actif.'
        );
        safeBack('/(tabs)/auth');
      } else {
        trackEvent('restore_failed');
        Alert.alert(
          'Aucun achat trouvé',
          "Nous n'avons pas trouvé d'achat actif lié à ton compte."
        );
      }
    } catch {
      trackEvent('restore_failed');
      Alert.alert(
        'Restauration impossible',
        'Une erreur est survenue. Réessaye dans un instant.'
      );
    } finally {
      setRestoring(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false, presentation: 'modal' }} />
      <SafeAreaView style={s.root} edges={['top']}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          <View style={s.topBar}>
            <Pressable onPress={() => safeBack('/(tabs)/auth')} style={s.closeBtn} hitSlop={8}>
              <CloseIcon color={C.espresso} />
            </Pressable>
          </View>

          <LinearGradient colors={G.espresso} style={[s.hero, Sh.medium]}>
            <Text style={s.heroLabel}>RITUEL PREMIUM</Text>
            <Text style={s.heroTitle}>Active toute la puissance de Rituel</Text>
            <Text style={s.heroSub}>
              Analyses complètes, recommandations IA et accès premium.
            </Text>
            <View style={s.benefits}>
              {BENEFITS.map((b) => (
                <View key={b} style={s.benefitRow}>
                  <View style={s.checkBox}>
                    <CheckIcon color={C.espresso} />
                  </View>
                  <Text style={s.benefitTxt}>{b}</Text>
                </View>
              ))}
            </View>
          </LinearGradient>

          <View style={s.plans}>
            {PLANS.map((p) => {
              const active = selected === p.id;
              return (
                <Pressable
                  key={p.id}
                  onPress={() => setSelected(p.id)}
                  style={({ pressed }) => [
                    s.planCard,
                    Sh.soft,
                    active && s.planCardActive,
                    pressed && { opacity: 0.92 },
                  ]}
                >
                  {p.badge && (
                    <View style={s.badge}>
                      <Text style={s.badgeTxt}>{p.badge}</Text>
                    </View>
                  )}
                  <View style={s.planHead}>
                    <Text style={s.planTitle}>{p.title}</Text>
                    <View style={[s.radio, active && s.radioActive]}>
                      {active && <View style={s.radioDot} />}
                    </View>
                  </View>
                  <View style={s.planPriceRow}>
                    <Text style={s.planPrice}>{p.price}</Text>
                    <Text style={s.planPeriod}>{p.period}</Text>
                  </View>
                  {p.hint && <Text style={s.planHint}>{p.hint}</Text>}
                </Pressable>
              );
            })}
          </View>

          <PillButton
            label="Continuer"
            variant="primary"
            fullWidth
            loading={purchasing}
            onPress={handlePurchase}
            style={{ marginTop: Sp.sm }}
          />

          <PillButton
            label="Restaurer mes achats"
            variant="ghost"
            fullWidth
            loading={restoring}
            onPress={handleRestore}
            style={{ marginTop: Sp.xs }}
          />

          <Text style={s.compliance}>
            Abonnement renouvelé automatiquement sauf annulation 24h avant la fin
            de la période en cours. Annulation possible à tout moment depuis votre
            compte App Store.
          </Text>

          <View style={s.legalRow}>
            <Pressable onPress={() => Linking.openURL('https://rituel.beauty/terms').catch(() => {})}>
              <Text style={s.legalLink}>Conditions</Text>
            </Pressable>
            <Text style={s.legalDot}>·</Text>
            <Pressable onPress={() => Linking.openURL('https://rituel.beauty/privacy').catch(() => {})}>
              <Text style={s.legalLink}>Confidentialité</Text>
            </Pressable>
          </View>

          <View style={{ height: Sp.huge }} />
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.appBg },
  scroll: { paddingHorizontal: Sp.lg, paddingTop: Sp.sm, paddingBottom: Sp.xl },
  topBar: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: Sp.md },
  closeBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: C.white, alignItems: 'center', justifyContent: 'center',
    ...Sh.soft,
  },
  hero: {
    borderRadius: R.xl,
    padding: Sp.xl,
    marginBottom: Sp.xl,
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: C.copper,
    letterSpacing: 2,
    marginBottom: Sp.sm,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '300',
    color: C.white,
    lineHeight: 32,
    letterSpacing: -0.3,
    marginBottom: Sp.xs,
  },
  heroSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.78)',
    lineHeight: 20,
    marginBottom: Sp.lg,
  },
  benefits: { marginTop: Sp.xs },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Sp.sm,
  },
  checkBox: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: C.white,
    alignItems: 'center', justifyContent: 'center',
    marginRight: Sp.sm,
  },
  benefitTxt: {
    fontSize: 14,
    color: C.white,
    flex: 1,
  },
  plans: {
    marginBottom: Sp.lg,
  },
  planCard: {
    backgroundColor: C.white,
    borderRadius: R.lg,
    padding: Sp.lg,
    marginBottom: Sp.sm,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  planCardActive: {
    borderColor: C.copper,
  },
  badge: {
    position: 'absolute',
    top: -10,
    right: Sp.lg,
    backgroundColor: C.copper,
    paddingHorizontal: Sp.sm,
    paddingVertical: 4,
    borderRadius: R.full,
  },
  badgeTxt: {
    fontSize: 9,
    fontWeight: '700',
    color: C.white,
    letterSpacing: 1.2,
  },
  planHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Sp.xs,
  },
  planTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: C.text,
  },
  radio: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 1.5, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
  radioActive: { borderColor: C.copper, borderWidth: 2 },
  radioDot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: C.copper,
  },
  planPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  planPrice: {
    fontSize: 22,
    fontWeight: '600',
    color: C.text,
  },
  planPeriod: {
    fontSize: 13,
    color: C.textMid,
    marginLeft: 4,
  },
  planHint: {
    fontSize: 12,
    color: C.copper,
    marginTop: 4,
  },
  compliance: {
    fontSize: 11,
    color: C.textSoft,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: Sp.lg,
    paddingHorizontal: Sp.md,
  },
  legalRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Sp.sm,
  },
  legalLink: {
    fontSize: 12,
    color: C.copper,
    fontWeight: '500',
  },
  legalDot: {
    color: C.textSoft,
    marginHorizontal: Sp.xs,
  },
});
