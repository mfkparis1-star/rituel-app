import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePremium } from './usePremium';
import { useCredits } from './useCredits';

const UNLOCKS_KEY = 'rituel_ai_unlocks_v1';

export type AIScope = 'skin_analysis' | 'routine_optimize' | 'makeup_full';

type UnlockMap = Record<string, true>;

async function readUnlocks(): Promise<UnlockMap> {
  try {
    const raw = await AsyncStorage.getItem(UNLOCKS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

async function writeUnlocks(map: UnlockMap): Promise<void> {
  try {
    await AsyncStorage.setItem(UNLOCKS_KEY, JSON.stringify(map));
  } catch {}
}

function makeKey(scope: AIScope, resultId: string): string {
  return `${scope}:${resultId}`;
}

/**
 * useAIUnlock — per-result AI unlock tracking.
 *
 * Phase 15 decision 4A:
 * - Premium users always unlocked.
 * - Free users unlock per-result via 1 credit spend.
 * - Unlocks persist in AsyncStorage with scope:resultId key.
 * - Refund-aware: refundUnlock removes unlock and refunds credit.
 */
export function useAIUnlock(scope: AIScope) {
  const { isPremium } = usePremium();
  const { spend, add, balance } = useCredits();
  const [unlocks, setUnlocks] = useState<UnlockMap>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    readUnlocks().then((map) => {
      if (mounted) {
        setUnlocks(map);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const isUnlocked = useCallback(
    (resultId: string): boolean => {
      if (isPremium) return true;
      return unlocks[makeKey(scope, resultId)] === true;
    },
    [isPremium, unlocks, scope]
  );

  const unlock = useCallback(
    async (resultId: string): Promise<{ ok: true } | { ok: false; reason: 'insufficient' | 'error' }> => {
      if (isPremium) return { ok: true };
      const key = makeKey(scope, resultId);
      if (unlocks[key]) return { ok: true };

      const r = await spend(1);
      if (!r.ok) {
        if (r.reason === 'insufficient') return { ok: false, reason: 'insufficient' };
        return { ok: false, reason: 'error' };
      }

      const next = { ...unlocks, [key]: true as const };
      setUnlocks(next);
      await writeUnlocks(next);
      return { ok: true };
    },
    [isPremium, unlocks, scope, spend]
  );

  const refundUnlock = useCallback(
    async (resultId: string): Promise<void> => {
      if (isPremium) return;
      const key = makeKey(scope, resultId);
      if (!unlocks[key]) return;

      const next = { ...unlocks };
      delete next[key];
      setUnlocks(next);
      await writeUnlocks(next);
      await add(1, 'ai_unlock_refund');
    },
    [isPremium, unlocks, scope, add]
  );

  return { isUnlocked, unlock, refundUnlock, isPremium, balance, loading };
}
