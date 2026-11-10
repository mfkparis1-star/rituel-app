import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useCacheAccount } from './useCacheAccount';

export type TonightStep = {
  id: string;
  product_name: string;
  step_order: number;
  duration: string;
};

export function useRoutineSteps(slot: 'matin' | 'soir' = 'soir') {
  const account = useCacheAccount();
  const [result, setResult] = useState<{
    account: string;
    slot: 'matin' | 'soir';
    steps: TonightStep[];
  } | null>(null);

  useFocusEffect(useCallback(() => {
    if (!account) return;
    let active = true;
    void (async () => {
      try {
        const { data, error } = await supabase
          .from('routine_steps')
          .select('id, product_name, step_order, duration')
          .eq('user_id', account)
          .eq('routine_type', slot)
          .order('step_order', { ascending: true });
        if (active && !error) {
          setResult({ account, slot, steps: data as TonightStep[] ?? [] });
        }
      } catch {
        // Fall back to the last result for this account and slot.
      } finally {
        if (active) {
          setResult((previous) => previous?.account === account && previous.slot === slot
            ? previous : { account, slot, steps: [] });
        }
      }
    })();
    return () => { active = false; };
  }, [account, slot]));

  const current = result?.account === account && result?.slot === slot ? result : null;
  return { steps: current?.steps ?? [], loading: account === undefined || (!!account && !current) };
}
