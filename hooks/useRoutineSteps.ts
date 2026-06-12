import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

/**
 * useRoutineSteps — read-only routine steps for a slot.
 * Used by the home Tonight card. Never writes; safe fallback
 * to empty list on error or signed-out session.
 */
export type TonightStep = {
  id: string;
  product_name: string;
  step_order: number;
  duration: string;
};

export function useRoutineSteps(slot: 'matin' | 'soir' = 'soir') {
  const [steps, setSteps] = useState<TonightStep[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase.auth.getSession();
      const id = data.session?.user?.id;
      if (!id) {
        setSteps([]);
        return;
      }
      const { data: rows, error } = await supabase
        .from('routine_steps')
        .select('id, product_name, step_order, duration')
        .eq('user_id', id)
        .eq('routine_type', slot)
        .order('step_order', { ascending: true });
      if (!error && rows) setSteps(rows as TonightStep[]);
    } catch {
      // keep previous steps
    } finally {
      setLoading(false);
    }
  }, [slot]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { steps, loading, refresh };
}
