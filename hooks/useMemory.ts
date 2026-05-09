/**
 * useMemory — read profile memory for current session.
 *
 * Returns { memory, loading, refresh, patch }. Auto-fetches on mount
 * and whenever the user id changes. patch() updates the DB and the
 * local cache atomically so consumers see the new value immediately.
 */
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getMemory, patchMemory, Memory } from '../utils/memory';

export function useMemory() {
  const [memory, setMemory] = useState<Memory | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const refresh = useCallback(async (uid: string | null) => {
    if (!uid) {
      setMemory(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const m = await getMemory(uid);
    setMemory(m ?? {});
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getSession();
      const uid = data.session?.user?.id ?? null;
      if (cancelled) return;
      setUserId(uid);
      await refresh(uid);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const uid = session?.user?.id ?? null;
      setUserId(uid);
      refresh(uid);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [refresh]);

  const patch = useCallback(
    async (p: Partial<Memory>) => {
      if (!userId) return false;
      const ok = await patchMemory(userId, p);
      if (ok) setMemory((prev) => ({ ...(prev ?? {}), ...p }));
      return ok;
    },
    [userId]
  );

  return { memory, loading, refresh: () => refresh(userId), patch };
}
