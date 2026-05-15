/**
 * Product discovery (Phase 17B).
 *
 * "Dans son rituel" — when a community product chip or a profile
 * ritual chip is tapped, this screen surfaces other women who have
 * shared this product in their own rituals.
 *
 * Tone:
 *   - Soft inspiration board, not a shopping page.
 *   - No counts shown as ranking. We say "Des femmes l'ont partagé".
 *   - No buy buttons, no affiliate spam, no influencer vibe.
 *   - Empty state is gentle, never punishing.
 *
 * Reads:
 *   - posts where product_names contains :name (newest first, capped 30)
 */
import { type Session } from '@supabase/supabase-js';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { fetchPostsByProduct, type FeedPost } from '../../utils/posts';
import { safeBack } from '../../utils/safeBack';
import { C, R, Sh, Sp, Type } from '../../theme';

function relativeTime(iso: string): string {
  const d = new Date(iso);
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 60) return "à l’instant";
  if (sec < 3600) return `il y a ${Math.floor(sec / 60)} min`;
  if (sec < 86400) return `il y a ${Math.floor(sec / 3600)} h`;
  return `il y a ${Math.floor(sec / 86400)} j`;
}

function authorName(post: FeedPost): string {
  const dn = (post as any).display_name as string | null | undefined;
  if (dn && dn.trim()) return dn.trim();
  const email = (post as any).user_email as string | null | undefined;
  if (email) return email.split('@')[0];
  return 'Membre';
}

export default function ProductDiscoveryScreen() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const productName = (() => {
    try {
      return decodeURIComponent(name || '').trim();
    } catch {
      return (name || '').trim();
    }
  })();

  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!productName) {
      setPosts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const list = await fetchPostsByProduct(productName, 30);
    setPosts(list);
    setLoading(false);
  }, [productName]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <Pressable onPress={() => { if (router.canGoBack()) router.back(); else router.replace('/(tabs)/community' as any); }} hitSlop={10} style={s.backBtn}>
          <Text style={s.backTxt}>‹</Text>
        </Pressable>
        <View style={s.headerCenter}>
          <Text style={s.label}>DANS LES RITUELS</Text>
          <Text style={s.title} numberOfLines={2}>{productName || 'Produit'}</Text>
        </View>
        <View style={s.backBtn} />
      </View>

      {loading ? (
        <View style={s.loadingWrap}>
          <ActivityIndicator color={C.copper} />
        </View>
      ) : posts.length === 0 ? (
        <View style={s.emptyWrap}>
          <Text style={s.emptyTitle}>Pas encore partagé</Text>
          <Text style={s.emptyBody}>
            Personne n'a encore partagé ce produit dans son rituel. Reviens un peu plus tard.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.scrollBody} showsVerticalScrollIndicator={false}>
          <Text style={s.intro}>
            Des femmes l'ont partagé dans leur routine.
          </Text>

          {posts.map((post) => (
            <View key={post.id} style={[s.card, Sh.soft]}>
              <View style={s.cardHead}>
                <View style={s.avatar}>
                  <Text style={s.avatarLetter}>
                    {(authorName(post)[0] || 'M').toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.cardName}>{authorName(post)}</Text>
                  <Text style={s.cardMeta}>{relativeTime(post.created_at)}</Text>
                </View>
                {post.emotion ? (
                  <View style={s.emotionPill}>
                    <Text style={s.emotionPillTxt}>{post.emotion}</Text>
                  </View>
                ) : null}
              </View>

              {post.caption ? (
                <Text style={s.cardCaption}>{post.caption}</Text>
              ) : null}

              {Array.isArray(post.product_names) && post.product_names.length > 1 ? (
                <View style={s.othersWrap}>
                  <Text style={s.othersLabel}>EGALEMENT DANS CE RITUEL</Text>
                  <View style={s.othersRow}>
                    {post.product_names
                      .filter((n) => n.trim().toLowerCase() !== productName.toLowerCase())
                      .slice(0, 4)
                      .map((n, i) => (
                        <Pressable
                          key={`${post.id}-o-${i}`}
                          onPress={() => router.push(`/product-discovery/${encodeURIComponent(n)}` as any)}
                          style={s.otherChip}
                          hitSlop={6}
                        >
                          <Text style={s.otherChipTxt} numberOfLines={1}>{n}</Text>
                        </Pressable>
                      ))}
                  </View>
                </View>
              ) : null}
            </View>
          ))}

          <View style={{ height: Sp.huge }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.cream },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Sp.md,
    paddingVertical: Sp.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#EFE6D7',
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backTxt: { fontSize: 28, color: C.copper, fontWeight: '300', marginTop: -4 },
  headerCenter: { flex: 1, alignItems: 'center' },
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    color: C.copper,
    marginBottom: 2,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#3A2E25',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Sp.xl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '500',
    fontStyle: 'italic',
    color: C.copper,
    marginBottom: Sp.sm,
  },
  emptyBody: {
    fontSize: 14,
    lineHeight: 22,
    color: '#7A6555',
    textAlign: 'center',
  },
  scrollBody: {
    padding: Sp.md,
  },
  intro: {
    fontSize: 13,
    fontStyle: 'italic',
    color: '#7A6555',
    marginBottom: Sp.md,
    paddingHorizontal: Sp.xs,
    letterSpacing: 0.2,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: R.lg,
    padding: Sp.md,
    marginBottom: Sp.md,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Sp.sm,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FBF6F1',
    borderWidth: 1,
    borderColor: '#E8DFD2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarLetter: { fontSize: 14, color: C.copper, fontWeight: '600' },
  cardName: { fontSize: 14, fontWeight: '600', color: '#3A2E25' },
  cardMeta: { fontSize: 11, color: '#A99583', marginTop: 1 },
  emotionPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
    backgroundColor: '#FBF6F1',
    borderWidth: 1,
    borderColor: '#E8DFD2',
  },
  emotionPillTxt: {
    fontSize: 11,
    fontStyle: 'italic',
    color: C.copper,
    letterSpacing: 0.4,
  },
  cardCaption: {
    fontSize: 14,
    lineHeight: 21,
    color: '#3A2E25',
    marginBottom: Sp.sm,
  },
  othersWrap: {
    marginTop: Sp.xs,
    paddingTop: Sp.sm,
    borderTopWidth: 1,
    borderTopColor: '#F2EAD9',
  },
  othersLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: C.copper,
    marginBottom: 8,
  },
  othersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  otherChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 100,
    backgroundColor: '#FBF6F1',
    borderWidth: 1,
    borderColor: '#E8DFD2',
    maxWidth: 200,
  },
  otherChipTxt: {
    fontSize: 11,
    fontStyle: 'italic',
    color: C.copper,
  },
});
