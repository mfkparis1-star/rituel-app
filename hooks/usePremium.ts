import { useEffect, useState, useCallback } from 'react';
import Purchases, { CustomerInfo } from 'react-native-purchases';
import { supabase } from '../lib/supabase';
import {
  configurePurchases,
  getCustomerInfo,
  hasActivePremium,
  restorePurchases as restorePurchasesUtil,
} from '../utils/purchases';

/**
 * usePremium — reactive premium entitlement hook.
 *
 * Phase 15: RevenueCat is the single source of truth.
 * No profiles.is_premium column. No webhook.
 * Premium state derives from CustomerInfo.entitlements.active['Rituel Pro'].
 */
export function usePremium() {
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const info = await getCustomerInfo();
      setCustomerInfo(info);
      setIsPremium(hasActivePremium(info));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const uid = data.session?.user?.id || null;
        if (!mounted) return;
        setUserId(uid);

        const ok = await configurePurchases(uid);
        if (!mounted) return;

        if (ok) {
          await refresh();
        } else {
          setLoading(false);
        }
      } catch {
        if (mounted) setLoading(false);
      }
    };

    init();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_e, session) => {
        if (!mounted) return;
        const uid = session?.user?.id || null;
        setUserId(uid);
        try {
          await configurePurchases(uid);
          await refresh();
        } catch {}
      }
    );

    let removeRcListener: (() => void) | null = null;
    try {
      const handler = (info: CustomerInfo) => {
        if (!mounted) return;
        setCustomerInfo(info);
        setIsPremium(hasActivePremium(info));
      };
      Purchases.addCustomerInfoUpdateListener(handler);
      removeRcListener = () => {
        try {
          Purchases.removeCustomerInfoUpdateListener(handler);
        } catch {}
      };
    } catch {}

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
      if (removeRcListener) removeRcListener();
    };
  }, [refresh]);

  const restore = useCallback(async (): Promise<boolean> => {
    try {
      const info = await restorePurchasesUtil();
      if (info) {
        setCustomerInfo(info);
        const premium = hasActivePremium(info);
        setIsPremium(premium);
        return premium;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  return { isPremium, loading, customerInfo, userId, refresh, restore };
}
