import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import Purchases, { type CustomerInfo } from 'react-native-purchases';
import { supabase } from '../lib/supabase';
import { configurePurchases, getCustomerInfo, hasActivePremium, restorePurchases } from '../utils/purchases';

type PremiumState = {
  userId: string | null;
  customerInfo: CustomerInfo | null;
  loading: boolean;
};

type PremiumContextValue = PremiumState & {
  isPremium: boolean;
  refresh: () => Promise<void>;
  restore: () => Promise<boolean>;
};

const PremiumContext = createContext<PremiumContextValue | null>(null);

export function PremiumProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PremiumState>({ userId: null, customerInfo: null, loading: true });
  const account = useRef<string | null | undefined>(undefined);
  const revision = useRef(0);
  const refreshing = useRef(false);

  const refresh = async () => {
    const userId = account.current;
    if (!userId || refreshing.current) return;
    const request = revision.current;
    refreshing.current = true;
    try {
      const info = await getCustomerInfo(userId);
      if (revision.current === request && info) {
        setState({ userId, customerInfo: info, loading: false });
      }
    } finally {
      refreshing.current = false;
    }
  };

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const userId = session?.user.id ?? null;
      if (account.current === userId) return;
      account.current = userId;
      const request = ++revision.current;
      setState({ userId, customerInfo: null, loading: true });
      void (async () => {
        const ready = await configurePurchases(userId);
        if (revision.current !== request) return;
        const info = ready ? await getCustomerInfo(userId) : null;
        if (revision.current === request) {
          setState({ userId, customerInfo: info, loading: false });
        }
      })();
    });
    const onUpdate = () => { void refresh(); };
    let listening = false;
    try {
      Purchases.addCustomerInfoUpdateListener(onUpdate);
      listening = true;
    } catch {
      // The SDK can be unavailable in development or on unsupported platforms.
    }
    return () => {
      revision.current++;
      account.current = undefined;
      data.subscription.unsubscribe();
      if (listening) Purchases.removeCustomerInfoUpdateListener(onUpdate);
    };
  }, []);

  const restore = async () => {
    const userId = account.current;
    if (!userId) return false;
    const request = revision.current;
    const info = await restorePurchases(userId);
    if (revision.current !== request || !info) return false;
    setState({ userId, customerInfo: info, loading: false });
    return hasActivePremium(info);
  };

  return (
    <PremiumContext.Provider value={{ ...state, isPremium: hasActivePremium(state.customerInfo), refresh, restore }}>
      {children}
    </PremiumContext.Provider>
  );
}

export function usePremium() {
  const value = useContext(PremiumContext);
  if (!value) throw new Error('usePremium requires PremiumProvider');
  return value;
}
