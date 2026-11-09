/** Credits balance with an account-scoped offline cache and atomic spending. */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

const cacheKey = (userId: string) => `rituel_credit_balance_v2:${userId}`;

export const CREDIT_PACKS = [
  { id: 'com.mfkparis.rituel.credits.1.v2', amount: 1 },
  { id: 'com.mfkparis.rituel.credits.5.v2', amount: 5 },
  { id: 'com.mfkparis.rituel.credits.15.v2', amount: 15 },
];

const creditEnvironment = process.env.EXPO_PUBLIC_VERIFIED_CREDIT_ENVIRONMENT;
export const CREDIT_CHECKOUT_ENABLED = creditEnvironment === 'sandbox' || creditEnvironment === 'production';

export async function isCreditDelivered(transactionId: string): Promise<boolean> {
  if (!CREDIT_CHECKOUT_ENABLED || !/^[0-9]{1,32}$/.test(transactionId)) return false;
  try {
    const { data, error } = await supabase.rpc('verified_rituel_credit_delivered', {
      purchase_environment: creditEnvironment,
      store_id: transactionId,
    });
    return !error && data === true;
  } catch {
    return false;
  }
}

async function readCache(userId: string): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(cacheKey(userId));
    if (!raw) return 0;
    const n = parseInt(raw, 10);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  } catch {
    return 0;
  }
}

async function writeCache(userId: string, value: number): Promise<void> {
  try {
    await AsyncStorage.setItem(cacheKey(userId), String(Math.max(0, value)));
  } catch {}
}

export async function getCreditBalance(userId?: string): Promise<number> {
  if (!userId) return 0;
  try {
    const { data, error } = await supabase
      .from('user_credits')
      .select('balance')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) return readCache(userId);
    const balance = data?.balance ?? 0;
    await writeCache(userId, balance);
    return balance;
  } catch {
    return readCache(userId);
  }
}

export type CreditOpResult =
  | { ok: true; balance: number }
  | { ok: false; reason: 'no_user' | 'insufficient' | 'error' };

export async function spendCredit(
  userId: string,
  amount: number = 1
): Promise<CreditOpResult> {
  if (!userId) return { ok: false, reason: 'no_user' };
  if (!Number.isSafeInteger(amount) || amount <= 0) return { ok: false, reason: 'error' };
  try {
    const { data: balance, error } = await supabase.rpc('spend_rituel_credits', {
      expected_purchaser: userId,
      credit_amount: amount,
    });
    if (error) return { ok: false, reason: 'error' };
    if (balance === null) return { ok: false, reason: 'insufficient' };
    if (typeof balance !== 'number') return { ok: false, reason: 'error' };
    await writeCache(userId, balance);
    return { ok: true, balance };
  } catch {
    return { ok: false, reason: 'error' };
  }
}
