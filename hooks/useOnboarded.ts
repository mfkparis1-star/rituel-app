import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const completedOnDevice = new Set<string>();
const completionKey = (userId: string) => `@rituel:onboarded:${userId}`;

export async function finishOnboarding(userId: string): Promise<void> {
  if (completedOnDevice.has(userId)) return;
  completedOnDevice.add(userId);
  await AsyncStorage.setItem(completionKey(userId), '1').catch(() => {});
  // Keep navigation available even when the server cannot be reached.
  void Promise.resolve(supabase.from('profiles').upsert(
    { id: userId, onboarded: true }, { onConflict: 'id' }
  )).catch(() => {});
}

export async function readOnboarding(userId: string): Promise<boolean | null> {
  if (completedOnDevice.has(userId)) return true;
  const local = await AsyncStorage.getItem(completionKey(userId)).catch(() => null);
  if (local === '1') return true;
  try {
    const { data, error } = await supabase.from('profiles')
      .select('onboarded').eq('id', userId).maybeSingle();
    return error ? null : data?.onboarded === true;
  } catch {
    return null;
  }
}

export function useOnboarded(userId: string | null | undefined) {
  const [result, setResult] = useState<{ account: string; completed: boolean | null } | null>(null);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    void readOnboarding(userId).then((completed) => {
      if (active) setResult({ account: userId, completed });
    });
    return () => { active = false; };
  }, [userId]);

  if (!userId || completedOnDevice.has(userId)) return true;
  return result?.account === userId ? result.completed : null;
}
