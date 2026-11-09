import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  CreditOpResult,
  getCreditBalance,
  spendCredit as spendCreditUtil,
} from '../utils/credits';

/**
 * useCredits — reactive credit balance hook.
 *
 * Phase 12: balance + loading + refresh.
 * The spend helper wraps utils/credits.ts and refreshes state.
 */
export function useCredits() {
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const refresh = useCallback(async (uid?: string) => {
    const id = uid || userId;
    try {
      const b = await getCreditBalance(id || undefined);
      setBalance(b);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const uid = data.session?.user?.id || null;
      setUserId(uid);
      refresh(uid || undefined);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!mounted) return;
      const uid = session?.user?.id || null;
      setUserId(uid);
      refresh(uid || undefined);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [refresh]);

  const spend = useCallback(
    async (amount: number = 1): Promise<CreditOpResult> => {
      if (!userId) return { ok: false, reason: 'no_user' };
      const r = await spendCreditUtil(userId, amount);
      if (r.ok) setBalance(r.balance);
      return r;
    },
    [userId]
  );

  return { balance, loading, userId, refresh, spend };
}
