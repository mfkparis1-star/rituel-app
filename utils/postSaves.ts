/**
 * Post saves (Phase 16D D2).
 *
 * Save / unsave a post. RLS enforces ownership. UNIQUE(user_id, post_id)
 * in migration 0005 prevents double-saves; if the insert hits the unique
 * violation we treat the row as already saved.
 *
 * Mirror of postLikes. No saves_count on posts — the count surface is
 * per-user only, fetched from this table directly.
 */
import { supabase } from '../lib/supabase';

export async function isSaved(userId: string, postId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('post_saves')
    .select('id')
    .eq('user_id', userId)
    .eq('post_id', postId)
    .maybeSingle();
  if (error) return false;
  return !!data;
}

export async function toggleSave(
  userId: string,
  postId: string,
  currentlySaved: boolean
): Promise<boolean> {
  if (currentlySaved) {
    const { error } = await supabase
      .from('post_saves')
      .delete()
      .eq('user_id', userId)
      .eq('post_id', postId);
    return !error;
  } else {
    const { error } = await supabase
      .from('post_saves')
      .insert({ user_id: userId, post_id: postId });
    if (error && !String(error.message).toLowerCase().includes('duplicate')) {
      return false;
    }
    return true;
  }
}

export async function getSavedSet(userId: string, postIds: string[]): Promise<Set<string>> {
  if (postIds.length === 0) return new Set();
  const { data, error } = await supabase
    .from('post_saves')
    .select('post_id')
    .eq('user_id', userId)
    .in('post_id', postIds);
  if (error || !data) return new Set();
  return new Set(data.map((r: { post_id: string }) => r.post_id));
}

export type SavedRow = {
  id: string;
  post_id: string;
  created_at: string;
};

export async function fetchSavedPostIds(userId: string, limit = 50): Promise<SavedRow[]> {
  const { data, error } = await supabase
    .from('post_saves')
    .select('id, post_id, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data as SavedRow[];
}
