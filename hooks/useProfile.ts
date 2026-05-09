/**
 * useProfile — read + write the active user's profile row.
 *
 * Exposes { profile, loading, refresh, update }. Subscribes to auth
 * state so the hook follows the active session. update() patches the
 * profiles row and merges into local state for immediate UI feedback.
 */
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  skin_type: string | null;
  country: string | null;
  language: string | null;
  avatar_url: string | null;
  skin_issues: string[] | null;
  skin_analyzed_at: string | null;
  is_premium: boolean | null;
};

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const refresh = useCallback(async (uid: string | null) => {
    if (!uid) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, skin_type, country, language, avatar_url, skin_issues, skin_analyzed_at, is_premium')
      .eq('id', uid)
      .maybeSingle();
    setProfile(error || !data ? null : (data as Profile));
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

  const update = useCallback(
    async (patch: Partial<Pick<Profile, 'full_name' | 'avatar_url' | 'skin_type'>>) => {
      if (!userId) return false;
      const { error } = await supabase.from('profiles').update(patch).eq('id', userId);
      if (error) return false;
      setProfile((prev) => (prev ? { ...prev, ...patch } : prev));
      return true;
    },
    [userId]
  );

  return { profile, loading, refresh: () => refresh(userId), update };
}
