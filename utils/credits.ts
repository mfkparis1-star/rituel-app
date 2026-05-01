/**
 * Credits utilities — Phase 12 foundation.
 *
 * Safe simplified version:
 * - balance is an integer in user_credits.balance
 * - never goes negative
 * - source of truth is Supabase, but local cache (AsyncStorage) is acceptable
 * - no retries, no webhooks, no server-side enforcement
 *
 * Phase 14 will harden this with edge-function backed validation.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

const CACHE_KEY = 'rituel_credit_balance_v1';

export const CREDIT_PACKS = [
  { id: 'credits_1', amount: 1, priceLabel: '1,99 €' },
  { id: 'credits_5', amount: 5, priceLabel: '7,99 €', popular: true },
  { id: 'credits_15', amount: 15, priceLabel: '19,99 €', best: true },
];

async function readCache(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return 0;
    const n = parseInt(raw, 10);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  } catch {
    return 0;
  }
}

async function writeCache(value: number): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHE_KEY, String(Math.max(0, value)));
  } catch {}
}

export async function getCreditBalance(userId?: string): Promise<number> {
  if (!userId) return readCache();
  try {
    const { data } = await supabase
      .from('user_credits')
      .select('balance')
      .eq('user_id', userId)
      .maybeSingle();
    const balance = data?.balance ?? 0;
    await writeCache(balance);
    return balance;
  } catch {
    return readCache();
  }
}

export type CreditOpResult =
  | { ok: true; balance: number }
  | { ok: false; reason: 'no_user' | 'insufficient' | 'error' };

export async function addCredits(
  userId: string,
  amount: number,
  source: string
): Promise<CreditOpResult> {
  if (!userId) return { ok: false, reason: 'no_user' };
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, reason: 'error' };
  }
  try {
    const current = await getCreditBalance(userId);
    const next = current + Math.floor(amount);
    const { error } = await supabase
      .from('user_credits')
      .upsert(
        {
          user_id: userId,
          balance: next,
        },
        { onConflict: 'user_id' }
      );
    if (error) return { ok: false, reason: 'error' };

    // Best-effort transaction log (silent failure — non-critical)
    try {
      await supabase.from('credit_transactions').insert({
        user_id: userId,
        amount,
        source,
        kind: 'add',
      });
    } catch {}

    await writeCache(next);
    return { ok: true, balance: next };
  } catch {
    return { ok: false, reason: 'error' };
  }
}

export async function spendCredit(
  userId: string,
  amount: number = 1
): Promise<CreditOpResult> {
  if (!userId) return { ok: false, reason: 'no_user' };
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, reason: 'error' };
  }
  try {
    const current = await getCreditBalance(userId);
    if (current < amount) return { ok: false, reason: 'insufficient' };

    const next = current - Math.floor(amount);
    const { error } = await supabase
      .from('user_credits')
      .update({ balance: next })
      .eq('user_id', userId)
      .gte('balance', amount);

    if (error) return { ok: false, reason: 'error' };

    try {
      await supabase.from('credit_transactions').insert({
        user_id: userId,
        amount: -amount,
        source: 'spend',
        kind: 'spend',
      });
    } catch {}

    await writeCache(next);
    return { ok: true, balance: next };
  } catch {
    return { ok: false, reason: 'error' };
  }
}
