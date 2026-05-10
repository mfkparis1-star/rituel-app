/**
 * Skin check-ins — daily 5-emoji snapshot.
 *
 * Backed by public.skin_checkins (RLS: own rows only). Insert is
 * immutable; there is no update path on purpose. Recent reads are
 * indexed (user_id, created_at desc).
 *
 * Phase 16C: powers Adaptive Home today/week signals.
 * Phase 16D: feeds Glow Timeline.
 */
import { supabase } from '../lib/supabase';

export type CheckinEmoji = 'glowing' | 'good' | 'neutral' | 'tired' | 'rough';

export type Checkin = {
  id: string;
  user_id: string;
  emoji: CheckinEmoji;
  note: string | null;
  created_at: string; // ISO
};

export const CHECKIN_EMOJIS: { id: CheckinEmoji; symbol: string; label_fr: string }[] = [
  { id: 'glowing', symbol: '✨', label_fr: 'Rayonnante' },
  { id: 'good',    symbol: '🙂', label_fr: 'Bien' },
  { id: 'neutral', symbol: '😐', label_fr: 'Neutre' },
  { id: 'tired',   symbol: '😴', label_fr: 'Fatiguée' },
  { id: 'rough',   symbol: '😣', label_fr: 'Difficile' },
];

export async function insertCheckin(
  userId: string,
  emoji: CheckinEmoji,
  note?: string
): Promise<boolean> {
  const { error } = await supabase
    .from('skin_checkins')
    .insert({ user_id: userId, emoji, note: note ?? null });
  return !error;
}

export async function getRecentCheckins(userId: string, limit = 7): Promise<Checkin[]> {
  const { data, error } = await supabase
    .from('skin_checkins')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data as Checkin[];
}

/**
 * Has the user already checked in today? Used to gate the daily
 * check-in CTA on Home so it does not nag.
 */
export async function hasCheckedInToday(userId: string): Promise<boolean> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const { count, error } = await supabase
    .from('skin_checkins')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', start.toISOString());
  if (error) return false;
  return (count ?? 0) > 0;
}

export async function deleteCheckin(checkinId: string): Promise<boolean> {
  const { error } = await supabase
    .from('skin_checkins')
    .delete()
    .eq('id', checkinId);
  return !error;
}
