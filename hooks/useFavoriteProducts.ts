import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Phase 17C — "Dans mon rituel"
 *
 * Returns products the user has mentioned in 2+ of their own community
 * posts, capped at 8, ordered by frequency (most repeated first).
 *
 * Design notes (do not lose):
 * - Client-side aggregation. No new table, no RPC.
 * - Soft favorite, NOT a ranking. We never expose counts to the UI.
 * - Empty array means "hide the section entirely". No empty state.
 * - 2+ threshold keeps new users seeing something quickly; can be
 *   tuned later from usage data.
 * - Case-insensitive grouping (trim + lowercase key), but we display
 *   the original casing of the most recent mention.
 */

const MIN_OCCURRENCES = 2;
const MAX_CHIPS = 8;

export function useFavoriteProducts(userId: string | null | undefined) {
  const [products, setProducts] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!userId) {
      setProducts([]);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('product_names, created_at')
        .eq('user_id', userId)
        .not('product_names', 'is', null)
        .order('created_at', { ascending: false })
        .limit(200);

      if (error || !data) {
        setProducts([]);
        return;
      }

      // Aggregate occurrences (case-insensitive, preserve recent casing)
      const counts = new Map<string, { count: number; display: string }>();
      for (const row of data) {
        const names: string[] = Array.isArray(row.product_names)
          ? row.product_names
          : [];
        for (const raw of names) {
          if (typeof raw !== 'string') continue;
          const trimmed = raw.trim();
          if (!trimmed) continue;
          const key = trimmed.toLowerCase();
          const entry = counts.get(key);
          if (entry) {
            entry.count += 1;
          } else {
            // First occurrence is the most recent (we ordered desc), keep its casing
            counts.set(key, { count: 1, display: trimmed });
          }
        }
      }

      const ranked = Array.from(counts.values())
        .filter((e) => e.count >= MIN_OCCURRENCES)
        .sort((a, b) => b.count - a.count)
        .slice(0, MAX_CHIPS)
        .map((e) => e.display);

      setProducts(ranked);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { products, loading, refresh };
}
