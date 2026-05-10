/**
 * Posts utility (Phase 16D D1 — Community V1).
 *
 * Fetch the public feed, create a new post (with optional image upload
 * to the post-images bucket), and delete own posts. RLS enforces that
 * only the owner can mutate. Image uploads use the same RN-safe pattern
 * as utils/avatar.ts.
 */
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';

const BUCKET = 'post-images';

export type FeedPost = {
  id: string;
  user_id: string;
  caption: string;
  skin_type: string | null;
  product_names: string[] | null;
  likes_count: number;
  created_at: string;
  user_email?: string | null;
  display_name?: string | null;
  image_url?: string | null;
  lang?: string | null;
};

export type PickResult =
  | { ok: true; uri: string }
  | { ok: false; reason: 'cancelled' | 'no_permission' };

export async function pickPostImage(): Promise<PickResult> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return { ok: false, reason: 'no_permission' };
  const r = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [4, 5],
    quality: 0.7,
  });
  if (r.canceled || !r.assets?.[0]?.uri) return { ok: false, reason: 'cancelled' };
  return { ok: true, uri: r.assets[0].uri };
}

export async function uploadPostImage(userId: string, localUri: string): Promise<string | null> {
  try {
    const filename = `${userId}/${Date.now()}.jpg`;
    const res = await fetch(localUri);
    const blob = await res.blob();
    const arrayBuffer = await new Response(blob).arrayBuffer();
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(filename, arrayBuffer, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: false,
      });
    if (error) return null;
    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(filename);
    return pub?.publicUrl ?? null;
  } catch {
    return null;
  }
}

export async function fetchFeed(limit = 30): Promise<FeedPost[]> {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data as FeedPost[];
}

export type CreatePostInput = {
  userId: string;
  caption: string;
  skinType?: string | null;
  productNames?: string[];
  imageUrl?: string | null;
  displayName?: string | null;
  userEmail?: string | null;
  lang?: string;
};

export async function createPost(input: CreatePostInput): Promise<{ ok: boolean; id?: string }> {
  const { data, error } = await supabase
    .from('posts')
    .insert({
      user_id: input.userId,
      caption: input.caption.trim(),
      skin_type: input.skinType ?? null,
      product_names: input.productNames ?? null,
      image_url: input.imageUrl ?? null,
      display_name: input.displayName ?? null,
      user_email: input.userEmail ?? null,
      lang: input.lang ?? 'fr',
      likes_count: 0,
    })
    .select('id')
    .single();
  if (error || !data) return { ok: false };
  return { ok: true, id: data.id };
}


export async function fetchOwnPosts(userId: string, limit = 30): Promise<FeedPost[]> {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data as FeedPost[];
}


export async function updatePostCaption(postId: string, caption: string): Promise<boolean> {
  const trimmed = caption.trim();
  if (trimmed.length < 4 || trimmed.length > 280) return false;
  const { error } = await supabase
    .from('posts')
    .update({ caption: trimmed })
    .eq('id', postId);
  return !error;
}

export async function deletePost(postId: string): Promise<boolean> {
  const { error } = await supabase.from('posts').delete().eq('id', postId);
  return !error;
}
