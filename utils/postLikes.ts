/**
 * Post likes (Phase 16D D1).
 *
 * Like / unlike a post. RLS enforces ownership of the like row. The UNIQUE
 * (user_id, post_id) index in migration 0003 prevents double-likes; if the
 * insert hits the unique violation we treat the row as already liked.
 *
 * likes_count on posts is updated optimistically client-side. A future
 * Phase 16D.x trigger could keep it strict server-side; for launch the
 * client increments and the read path always re-fetches the truth.
 */
import { supabase } from '../lib/supabase';

export async function isLiked(userId: string, postId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('post_likes')
    .select('id')
    .eq('user_id', userId)
    .eq('post_id', postId)
    .maybeSingle();
  if (error) return false;
  return !!data;
}

export async function toggleLike(
  userId: string,
  postId: string,
  currentlyLiked: boolean
): Promise<boolean> {
  if (currentlyLiked) {
    const { error } = await supabase
      .from('post_likes')
      .delete()
      .eq('user_id', userId)
      .eq('post_id', postId);
    return !error;
  } else {
    const { error } = await supabase
      .from('post_likes')
      .insert({ user_id: userId, post_id: postId });
    // unique violation = already liked, treat as success
    if (error && !String(error.message).toLowerCase().includes('duplicate')) {
      return false;
    }
    return true;
  }
}

export async function getLikedSet(userId: string, postIds: string[]): Promise<Set<string>> {
  if (postIds.length === 0) return new Set();
  const { data, error } = await supabase
    .from('post_likes')
    .select('post_id')
    .eq('user_id', userId)
    .in('post_id', postIds);
  if (error || !data) return new Set();
  return new Set(data.map((r: { post_id: string }) => r.post_id));
}

export async function bumpLikesCount(postId: string, delta: number): Promise<void> {
  // Optimistic client-side bump. Read path always trusts server next time.
  const { data } = await supabase
    .from('posts')
    .select('likes_count')
    .eq('id', postId)
    .maybeSingle();
  const current = data?.likes_count ?? 0;
  const next = Math.max(0, current + delta);
  await supabase.from('posts').update({ likes_count: next }).eq('id', postId);
}
