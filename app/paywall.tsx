import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import PillButton from '../components/ui/PillButton';
import { C, G, R, Sh, Sp } from '../theme';
import { trackEvent } from '../utils/analytics';
import { safeBack } from '../utils/safeBack';
import { useLanguage } from '../hooks/useLanguage';
import type { PurchasesPackage } from 'react-native-purchases';
import { usePremium } from '../hooks/usePremium';
import { getCurrentOffering, isCurrentPurchaseAccount, purchaseStorePackage, restorePurchasesWithStatus, hasActivePremium } from '../utils/purchases';

type Plan = 'monthly' | 'yearly';

const PRODUCT_IDS: Record<Plan, string> = {
  monthly: 'com.mfkparis.rituel.premium.monthly',
  yearly: 'com.mfkparis.rituel.premium.yearly',
};

const PLANS: Plan[] = ['monthly', 'yearly'];

const BENEFIT_KEYS = ['analyses', 'reco', 'unlimited'] as const;

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
  const { t } = useLanguage();
  const [selected, setSelected] = useState<Plan>('yearly');
  const params = useLocalSearchParams<{ source?: string }>();
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const { loading: initializing, userId } = usePremium();
  const [offeringSnapshot, setOfferingSnapshot] = useState<{
    account: string | null;
    attempt: number;
    packages: Partial<Record<Plan, PurchasesPackage>>;
  } | null>(null);
  const [retry, setRetry] = useState(0);
  const paymentInProgress = useRef(false);

  useEffect(() => {
    let active = true;
    if (!initializing) {
      getCurrentOffering().then((offering) => {
        if (!active) return;
        const next: Partial<Record<Plan, PurchasesPackage>> = {};
        for (const plan of PLANS) {
          const pkg = offering?.availablePackages.find((item) =>
            item.product.identifier === PRODUCT_IDS[plan] && item.product.priceString.trim()
          );
          if (pkg) next[plan] = pkg;
        }
        setOfferingSnapshot({ account: userId, attempt: retry, packages: next });
        setSelected((current) => next[current] ? current : next.yearly ? 'yearly' : 'monthly');
      });
    }
    return () => { active = false; };
  }, [initializing, userId, retry]);

  const currentOffering = !initializing && offeringSnapshot?.account === userId &&
    offeringSnapshot.attempt === retry ? offeringSnapshot : null;
  const selectedPackage = currentOffering?.packages[selected];
  const pricesPending = !currentOffering;

  useEffect(() => {
    trackEvent('paywall_viewed', { source: params.source ?? 'route' });
  }, [params.source]);

  const handlePurchase = async () => {
    if (!selectedPackage || pricesPending || paymentInProgress.current) return;
    paymentInProgress.current = true;
    setPurchasing(true);
    trackEvent('paywall_cta_clicked', { plan: selected });
    try {
      const result = await purchaseStorePackage(selectedPackage, userId);
      if (result.ok && !isCurrentPurchaseAccount(userId)) return;
      if (result.ok) {
        const premium = hasActivePremium(result.customerInfo);
        if (premium) {
          trackEvent('purchase_success', { plan: selected, source: params.source ?? 'route' });
          Alert.alert(
            t('paywall.alerts.welcomeTitle'),
            t('paywall.alerts.welcomeBody')
          );
          if (params.source === 'skin_quiz_ai') {
            router.replace('/profile/skin-analysis-result' as any);
          } else {
            safeBack('/(tabs)/auth');
          }
        } else {
          Alert.alert(
            t('paywall.alerts.receivedTitle'),
            t('paywall.alerts.receivedBody')
          );
        }
      } else if ('userCancelled' in result && result.userCancelled) {
        // silent
      } else {
        trackEvent('purchase_failed', { plan: selected });
        Alert.alert(
          t('paywall.alerts.errorTitle'),
          t('paywall.alerts.errorBody')
        );
      }
    } catch {
      trackEvent('purchase_failed', { plan: selected });
      Alert.alert(
        t('paywall.alerts.errorTitle'),
        t('paywall.alerts.errorBody')
      );
    } finally {
      paymentInProgress.current = false;
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    if (!userId || initializing || paymentInProgress.current) return;
    paymentInProgress.current = true;
    setRestoring(true);
    trackEvent('restore_clicked');
    try {
      const result = await restorePurchasesWithStatus(userId);
      if (result.status === 'account_changed' ||
          (result.status === 'success' && !isCurrentPurchaseAccount(userId))) {
        trackEvent('restore_failed');
        Alert.alert(
          t('paywall.alerts.restoreAccountChangedTitle'),
          t('paywall.alerts.restoreAccountChangedBody')
        );
      } else if (result.status === 'unavailable') {
        trackEvent('restore_failed');
        Alert.alert(
          t('paywall.alerts.restoreErrorTitle'),
          t('paywall.alerts.restoreErrorBody')
        );
      } else if (hasActivePremium(result.customerInfo)) {
        trackEvent('restore_success');
        Alert.alert(
          t('paywall.alerts.restoreSuccessTitle'),
          t('paywall.alerts.restoreSuccessBody')
        );
        safeBack('/(tabs)/auth');
      } else {
        trackEvent('restore_failed');
        Alert.alert(
          t('paywall.alerts.restoreEmptyTitle'),
          t('paywall.alerts.restoreEmptyBody')
        );
      }
    } catch {
      trackEvent('restore_failed');
      Alert.alert(
        t('paywall.alerts.restoreErrorTitle'),
        t('paywall.alerts.restoreErrorBody')
      );
    } finally {
      paymentInProgress.current = false;
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
            <Text style={s.heroLabel}>{t('paywall.heroLabel')}</Text>
            <Text style={s.heroTitle}>{t('paywall.heroTitle')}</Text>
            <Text style={s.heroSub}>{t('paywall.heroSub')}</Text>
            <View style={s.benefits}>
              {BENEFIT_KEYS.map((b) => (
                <View key={b} style={s.benefitRow}>
                  <View style={s.checkBox}>
                    <CheckIcon color={C.espresso} />
                  </View>
                  <Text style={s.benefitTxt}>{t(`paywall.benefits.${b}`)}</Text>
                </View>
              ))}
            </View>
          </LinearGradient>

          <View style={s.plans}>
            {PLANS.map((plan) => {
              const pkg = currentOffering?.packages[plan];
              const active = selected === plan && !!pkg;
              return (
                <Pressable
                  key={plan}
                  disabled={!pkg || purchasing || restoring}
                  onPress={() => setSelected(plan)}
                  style={({ pressed }) => [
                    s.planCard,
                    Sh.soft,
                    active && s.planCardActive,
                    pressed && { opacity: 0.92 },
                  ]}
                >
                  <View style={s.planHead}>
                    <Text style={s.planTitle}>{plan === 'monthly' ? t('paywall.plans.monthlyTitle') : t('paywall.plans.yearlyTitle')}</Text>
                    <View style={[s.radio, active && s.radioActive]}>
                      {active && <View style={s.radioDot} />}
                    </View>
                  </View>
                  <View style={s.planPriceRow}>
                    <Text style={s.planPrice}>{pkg?.product.priceString ?? t(pricesPending ? 'paywall.priceLoading' : 'paywall.priceUnavailable')}</Text>
                    {pkg && <Text style={s.planPeriod}>{t(`paywall.plans.${plan}Period`)}</Text>}
                  </View>
                </Pressable>
              );
            })}
          </View>

          <PillButton
            label={t(!userId ? 'paywall.signIn' :
              !pricesPending && !selectedPackage ? 'paywall.retryPrices' : 'paywall.continue')}
            variant="primary"
            fullWidth
            loading={purchasing}
            disabled={initializing || (!!userId && pricesPending) || restoring}
            onPress={() => {
              if (!userId) router.replace('/(tabs)/auth');
              else if (selectedPackage) void handlePurchase();
              else setRetry((value) => value + 1);
            }}
            style={{ marginTop: Sp.sm }}
          />

          <PillButton
            label={t('paywall.restore')}
            variant="ghost"
            fullWidth
            loading={restoring}
            disabled={!userId || initializing || purchasing}
            onPress={handleRestore}
            style={{ marginTop: Sp.xs }}
          />

          <Text style={s.compliance}>{t('paywall.compliance')}</Text>

          <View style={s.legalRow}>
            <Pressable onPress={() => Linking.openURL('https://rituel.beauty/terms').catch(() => {})}>
              <Text style={s.legalLink}>{t('paywall.legalTerms')}</Text>
            </Pressable>
            <Text style={s.legalDot}>·</Text>
            <Pressable onPress={() => Linking.openURL('https://rituel.beauty/privacy').catch(() => {})}>
              <Text style={s.legalLink}>{t('paywall.legalPrivacy')}</Text>
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
