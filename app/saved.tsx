/**
 * Mes favoris (Phase 16D D2).
 *
 * The user's personal beauty inspiration board: posts they have saved
 * from the community feed. Tone: archive / inspiration board, not
 * generic social bookmarks.
 *
 * Reads:
 *   - post_saves rows for current user (newest first)
 *   - posts table joined client-side for full payload
 */
import { type Session } from '@supabase/supabase-js';
import { router, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PillButton from '../components/ui/PillButton';
import { supabase } from '../lib/supabase';
import { fetchSavedPostIds } from '../utils/postSaves';
import type { FeedPost } from '../utils/posts';
import { safeBack } from '../utils/safeBack';
import { C, R, Sp, Type } from '../theme';

function relativeTime(iso: string): string {
  const d = new Date(iso);
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 60) return "à l\u2019instant";
  if (sec < 3600) return `il y a ${Math.floor(sec / 60)} min`;
  if (sec < 86400) return `il y a ${Math.floor(sec / 3600)} h`;
  return `il y a ${Math.floor(sec / 86400)} j`;
}

export default function SavedScreen() {
  const [session, setSession] = useState<Session | null>(null);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data: sess } = await supabase.auth.getSession();
    setSession(sess.session);
    if (!sess.session) {
      setLoading(false);
      return;
    }
    const saved = await fetchSavedPostIds(sess.session.user.id, 50);
    if (saved.length === 0) {
      setPosts([]);
      setLoading(false);
      return;
    }
    const ids = saved.map((s) => s.post_id);
    const { data: postRows } = await supabase
      .from('posts')
      .select('*')
      .in('id', ids);
    // Preserve save order (saved newest first)
    const byId = new Map<string, FeedPost>();
    (postRows ?? []).forEach((p: FeedPost) => byId.set(p.id, p));
    const ordered = saved.map((s) => byId.get(s.post_id)).filter(Boolean) as FeedPost[];
    setPosts(ordered);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (!session && !loading) {
    return (
      <SafeAreaView style={s.root} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={s.centered}>
          <Text style={s.muted}>Connecte-toi pour voir tes favoris.</Text>
          <PillButton label="Retour" variant="primary" onPress={() => safeBack('/(tabs)')} style={{ marginTop: Sp.md }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => safeBack('/(tabs)')} style={s.back}>
          <Text style={s.backTxt}>{'←  Retour'}</Text>
        </Pressable>

        <Text style={s.label}>INSPIRATIONS</Text>
        <Text style={s.title}>Mes favoris</Text>
        <Text style={s.subtitle}>Les rituels et les inspirations que tu as choisis de garder.</Text>

        {loading ? (
          <View style={s.centered}><ActivityIndicator color={C.copper} /></View>
        ) : posts.length === 0 ? (
          <View style={s.emptyBox}>
            <Text style={s.emptyTitle}>Ton tableau d’inspirations</Text>
            <Text style={s.emptySub}>
              Tes inspirations sauvegardées apparaîtront ici. Touche le marque-page sur les publications qui te plaisent.
            </Text>
          </View>
        ) : (
          posts.map((p) => (
            <View key={p.id} style={s.card}>
              {p.image_url ? (
                <Image source={{ uri: p.image_url }} style={s.cardImage} resizeMode="cover" />
              ) : null}
              <View style={s.cardBody}>
                <Text style={s.cardAuthor}>{p.display_name ?? (p.user_email?.split('@')[0] ?? 'Anonyme')}</Text>
                <Text style={s.cardCaption} numberOfLines={4}>{p.caption}</Text>
                <Text style={s.cardMeta}>{relativeTime(p.created_at)}</Text>
              </View>
            </View>
          ))
        )}

        <View style={{ height: Sp.huge }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.appBg },
  scroll: { paddingHorizontal: Sp.lg, paddingTop: Sp.sm, paddingBottom: Sp.huge },
  centered: { padding: Sp.xl, alignItems: 'center' },
  back: { paddingVertical: Sp.sm, marginBottom: Sp.md },
  backTxt: { fontSize: 14, color: C.textMid },
  label: { fontSize: 11, letterSpacing: 1.5, color: C.copper, fontWeight: '600', marginBottom: 6 },
  title: { ...Type.h1, marginBottom: 4 },
  subtitle: { ...Type.body, color: C.textMid, marginBottom: Sp.xl, lineHeight: 20 },
  muted: { ...Type.body, color: C.textMid, textAlign: 'center' },

  emptyBox: {
    backgroundColor: C.cream,
    padding: Sp.lg,
    borderRadius: R.md,
    marginTop: Sp.md,
  },
  emptyTitle: { fontSize: 16, color: C.espresso, fontWeight: '500', marginBottom: 6 },
  emptySub: { fontSize: 13, color: C.textMid, lineHeight: 19 },

  card: {
    backgroundColor: C.bg2,
    borderRadius: R.md,
    overflow: 'hidden',
    marginBottom: Sp.md,
  },
  cardImage: { width: '100%', aspectRatio: 4 / 5 },
  cardBody: { padding: Sp.md },
  cardAuthor: {
    fontSize: 11,
    letterSpacing: 1.2,
    color: C.copper,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  cardCaption: { fontSize: 14, color: C.text, lineHeight: 20 },
  cardMeta: { fontSize: 11, color: C.textSoft, marginTop: 6 },
});
