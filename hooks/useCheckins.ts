/**
 * useCheckins — recent check-ins + today gate.
 *
 * Returns:
 *   - recent: last N check-ins (default 7)
 *   - hasToday: boolean, true if a check-in exists for today (local TZ)
 *   - loading
 *   - refresh: re-fetch
 *   - submit: insert a new check-in (auto-refreshes)
 */
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  Checkin,
  CheckinEmoji,
  getRecentCheckins,
  hasCheckedInToday,
  insertCheckin,
} from '../utils/checkins';

export function useCheckins(limit = 7) {
  const [recent, setRecent] = useState<Checkin[]>([]);
  const [hasToday, setHasToday] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const refresh = useCallback(
    async (uid: string | null) => {
      if (!uid) {
        setRecent([]);
        setHasToday(false);
        setLoading(false);
        return;
      }
      setLoading(true);
      const [list, today] = await Promise.all([
        getRecentCheckins(uid, limit),
        hasCheckedInToday(uid),
      ]);
      setRecent(list);
      setHasToday(today);
      setLoading(false);
    },
    [limit]
  );

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

  const submit = useCallback(
    async (emoji: CheckinEmoji, note?: string) => {
      if (!userId) return false;
      const ok = await insertCheckin(userId, emoji, note);
      if (ok) await refresh(userId);
      return ok;
    },
    [userId, refresh]
  );

  return { recent, hasToday, loading, refresh: () => refresh(userId), submit };
}
