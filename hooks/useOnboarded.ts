/**
 * Phase 16F.1 — useOnboarded
 *
 * Read and write `profiles.onboarded` flag. Used by the root layout to
 * redirect new users to /onboarding, and by the onboarding screen to
 * flip the flag once when the user taps Commencer or Passer.
 */
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

type State = {
  onboarded: boolean | null; // null = unknown / not loaded yet
  loading: boolean;
};

export function useOnboarded(userId: string | null | undefined) {
  const [state, setState] = useState<State>({ onboarded: null, loading: true });

  const refresh = useCallback(async () => {
    if (!userId) {
      setState({ onboarded: null, loading: false });
      return;
    }
    setState((s) => ({ ...s, loading: true }));
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('onboarded')
        .eq('id', userId)
        .maybeSingle();
      if (error) throw error;
      setState({ onboarded: data?.onboarded ?? false, loading: false });
    } catch {
      // Fail-safe: treat as onboarded=true to avoid trapping the user
      // in a loop if profiles row is missing or RLS blocks the read.
      setState({ onboarded: true, loading: false });
    }
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const markOnboarded = useCallback(async () => {
    if (!userId) return;
    // Optimistic — flip local state immediately so the redirect happens
    // even if the server write is slow.
    setState((s) => ({ ...s, onboarded: true }));
    try {
      await supabase
        .from('profiles')
        .update({ onboarded: true })
        .eq('id', userId);
    } catch {
      // If the write fails, the next login will re-trigger onboarding.
      // Not a fatal error.
    }
  }, [userId]);

  return { ...state, refresh, markOnboarded };
}
