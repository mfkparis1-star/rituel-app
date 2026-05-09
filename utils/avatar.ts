/**
 * Avatar upload utility (Phase 16C M1).
 *
 * Picks a square-cropped image, uploads it to the avatars Storage bucket
 * under {user_id}/{timestamp}.jpg, and returns the public URL. Resizing
 * is intentionally deferred to M1.1; ImagePicker quality 0.6 + 1:1 crop
 * keeps the file well under the 2MB bucket cap in practice.
 */
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';

const BUCKET = 'avatars';

export type PickResult =
  | { ok: true; uri: string }
  | { ok: false; reason: 'cancelled' | 'no_permission' | 'unknown' };

/**
 * Show the native image picker. Returns the local URI of a square-cropped
 * picked image, or a typed reason if the user cancelled / denied permission.
 */
export async function pickAvatarFromLibrary(): Promise<PickResult> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return { ok: false, reason: 'no_permission' };
  const r = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.6,
  });
  if (r.canceled || !r.assets?.[0]?.uri) return { ok: false, reason: 'cancelled' };
  return { ok: true, uri: r.assets[0].uri };
}

/**
 * Upload a local image URI to the avatars bucket under the user's folder.
 * Returns the public URL on success, null on failure.
 */
export async function uploadAvatar(userId: string, localUri: string): Promise<string | null> {
  try {
    const filename = `${userId}/${Date.now()}.jpg`;

    // Read the file as ArrayBuffer (RN-safe path; supabase-js handles it)
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
