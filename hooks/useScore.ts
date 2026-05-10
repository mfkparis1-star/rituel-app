/**
 * useScore — read the user's Rituel Score for the active session.
 * Auto-refreshes on auth change.
 */
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { computeRitualScore, ScoreBreakdown } from '../utils/score';

export function useScore() {
  const [score, setScore] = useState<ScoreBreakdown | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const refresh = useCallback(async (uid: string | null) => {
    if (!uid) {
      setScore(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const s = await computeRitualScore(uid);
      setScore(s);
    } catch {
      setScore(null);
    } finally {
      setLoading(false);
    }
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
    const { data: sub } = supabase.auth.onAuthStateChange((_e, sess) => {
      const uid = sess?.user?.id ?? null;
      setUserId(uid);
      refresh(uid);
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [refresh]);

  return { score, loading, refresh: () => refresh(userId) };
}
