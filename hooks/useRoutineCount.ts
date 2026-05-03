import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

/**
 * useRoutineCount — reactive count of user's routine steps.
 *
 * Returns total routine_steps for logged-in user.
 * Safe fallback: count = 0 on error or no session.
 */
export function useRoutineCount() {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const refresh = useCallback(async (uid?: string) => {
    const id = uid || userId;
    if (!id) {
      setCount(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { count: c, error } = await supabase
        .from('routine_steps')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', id);
      if (error) {
        setCount(0);
      } else {
        setCount(c ?? 0);
      }
    } catch {
      setCount(0);
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

  return { count, loading, refresh };
}
