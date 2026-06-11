import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getAICacheList } from '../utils/aiCache';

/**
 * useProfileStats — reactive profile counters.
 *
 * productCount: Supabase `products` count for the signed-in user
 *   (same source of truth as the Archive screen).
 * analysisCount: local aiCache 'skin' entries — analyses are
 *   device-local by design (no server table yet).
 *
 * Safe fallback: counts stay at 0 on error or no session.
 */
export function useProfileStats() {
  const [productCount, setProductCount] = useState(0);
  const [analysisCount, setAnalysisCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase.auth.getSession();
      const id = data.session?.user?.id;
      if (id) {
        const { count, error } = await supabase
          .from('products')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', id);
        if (!error && typeof count === 'number') setProductCount(count);
      } else {
        setProductCount(0);
      }
      const skin = await getAICacheList('skin');
      setAnalysisCount(skin.length);
    } catch {
      // keep previous values — never crash the profile screen
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { productCount, analysisCount, loading, refresh };
}
