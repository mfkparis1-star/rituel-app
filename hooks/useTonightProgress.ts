/**
 * useTonightProgress — local persistence for tonight's completed
 * ritual steps. AsyncStorage keyed by date, so progress naturally
 * resets at midnight. Same local-only pattern as ai_unlocks.
 */
import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

function todayKey(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `@rituel:tonight:${d.getFullYear()}-${m}-${day}`;
}

export function useTonightProgress() {
  const [completedIds, setCompletedIds] = useState<string[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(todayKey());
        if (mounted && raw) setCompletedIds(JSON.parse(raw));
      } catch {
        // start empty
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const toggle = useCallback((id: string) => {
    setCompletedIds((prev) => {
      const next = prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id];
      AsyncStorage.setItem(todayKey(), JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  return { completedIds, toggle };
}
