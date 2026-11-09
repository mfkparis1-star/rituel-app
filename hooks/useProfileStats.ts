import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getAICacheList } from '../utils/aiCache';
import { useCacheAccount } from './useCacheAccount';

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
  const account = useCacheAccount();
  const [analysis, setAnalysis] = useState<{ account: string | null; count: number } | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const id = account;
      if (id) {
        const { count, error } = await supabase
          .from('products')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', id);
        if (!error && typeof count === 'number') setProductCount(count);
      } else {
        setProductCount(0);
      }
      const skin = await getAICacheList(id ?? null, 'skin');
      setAnalysis({ account: id ?? null, count: skin.length });
    } catch {
      // keep previous values — never crash the profile screen
    } finally {
      setLoading(false);
    }
  }, [account]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const analysisCount = analysis && analysis.account === account ? analysis.count : 0;
  return { productCount, analysisCount, loading, refresh };
}
