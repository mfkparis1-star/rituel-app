import { useEffect, useState, useCallback, useRef } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Chip from '../../components/ui/Chip';
import EmptyState from '../../components/ui/EmptyState';
import { supabase } from '../../lib/supabase';
import { router, useFocusEffect } from 'expo-router';
import { Image } from 'react-native';
import { type Session } from '@supabase/supabase-js';
import { fetchFeed, FeedPost } from '../../utils/posts';
import { getLikedSet, toggleLike, bumpLikesCount } from '../../utils/postLikes';
import { getSavedSet, toggleSave } from '../../utils/postSaves';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translate } from '../../utils/translate';
import { C, R, Sh, Sp, Type } from '../../theme';

type SkinFilter = 'all' | 'dry' | 'oily' | 'combination' | 'normal';

type Post = {
  id: string;
  user_id: string;
  caption: string;
  skin_type: string;
  product_names: string[] | null;
  likes_count: number;
  created_at: string;
  user_email?: string;
  display_name?: string;
  image_url?: string;
};

function mapSkinType(raw: string): Exclude<SkinFilter, "all"> {
  const v = (raw || '').toLowerCase();
  if (v.includes('sech') || v.includes('sèch') || v.includes('dry') || v.includes('kuru')) return 'dry';
  if (v.includes('grass') || v.includes('oily') || v.includes('yagl') || v.includes('yağl')) return 'oily';
  if (v.includes('mixt') || v.includes('combin') || v.includes('karma')) return 'combination';
  if (v.includes('normal')) return 'normal';
  return 'normal';
}

function relativeTime(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 60) return "à l'instant";
  if (sec < 3600) return `il y a ${Math.floor(sec / 60)} min`;
  if (sec < 86400) return `il y a ${Math.floor(sec / 3600)} h`;
  if (sec < 604800) return `il y a ${Math.floor(sec / 86400)} j`;
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function displayName(post: Post): string {
  return post.display_name || (post.user_email ? post.user_email.split('@')[0] : 'Membre');
}

const SKIN_LABEL: Record<Exclude<SkinFilter, 'all'>, string> = {
  dry: 'Peau sèche',
  oily: 'Peau grasse',
  combination: 'Peau mixte',
  normal: 'Peau normale',
};

export default function CommunityScreen() {
  const [filter, setFilter] = useState<SkinFilter>('all');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [translated, setTranslated] = useState<Record<string, string>>({});
  const [translatingIds, setTranslatingIds] = useState<Set<string>>(new Set());

  const [session, setSession] = useState<Session | null>(null);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const lastFetchedAtRef = useRef(0);

  const STALE_MS = 75 * 1000;
  const INVALIDATE_KEY = '@rituel:community:invalidate';

  const loadFeed = useCallback(async (silent: boolean = false) => {
    if (!silent) setLoading(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      setSession(sess.session);
      const list = await fetchFeed(30);
      setPosts(list as Post[]);
      if (sess.session) {
        const ids = list.map((p) => p.id);
        const [liked, saved] = await Promise.all([
          getLikedSet(sess.session.user.id, ids),
          getSavedSet(sess.session.user.id, ids),
        ]);
        setLikedIds(liked);
        setSavedIds(saved);
      }
      lastFetchedAtRef.current = Date.now();
    } catch {
      // silent — keep current cache
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // Initial mount
  useEffect(() => {
    loadFeed(false);
  }, [loadFeed]);

  // Focus-refresh: only when stale (>75s) OR an invalidate flag is set
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        const flag = await AsyncStorage.getItem(INVALIDATE_KEY);
        const isStale = Date.now() - lastFetchedAtRef.current > STALE_MS;
        if (cancelled) return;
        if (flag || isStale) {
          if (flag) await AsyncStorage.removeItem(INVALIDATE_KEY);
          await loadFeed(true);
        }
      })();
      return () => { cancelled = true; };
    }, [loadFeed])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadFeed(true);
    setRefreshing(false);
  }, [loadFeed]);

  const handleLike = async (postId: string) => {
    if (!session) {
      router.push('/(tabs)/auth' as any);
      return;
    }
    const wasLiked = likedIds.has(postId);
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (wasLiked) next.delete(postId); else next.add(postId);
      return next;
    });
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, likes_count: Math.max(0, (p.likes_count ?? 0) + (wasLiked ? -1 : 1)) }
          : p
      )
    );
    const ok = await toggleLike(session.user.id, postId, wasLiked);
    if (ok) {
      bumpLikesCount(postId, wasLiked ? -1 : 1);
    } else {
      setLikedIds((prev) => {
        const next = new Set(prev);
        if (wasLiked) next.add(postId); else next.delete(postId);
        return next;
      });
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, likes_count: Math.max(0, (p.likes_count ?? 0) + (wasLiked ? 1 : -1)) }
            : p
        )
      );
    }
  };

  const handleSave = async (postId: string) => {
    if (!session) {
      router.push('/(tabs)/auth' as any);
      return;
    }
    const wasSaved = savedIds.has(postId);
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (wasSaved) next.delete(postId); else next.add(postId);
      return next;
    });
    const ok = await toggleSave(session.user.id, postId, wasSaved);
    if (!ok) {
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (wasSaved) next.add(postId); else next.delete(postId);
        return next;
      });
    }
  };

  const handleTranslate = async (post: Post) => {
    if (translated[post.id]) {
      setTranslated((prev) => {
        const next = { ...prev };
        delete next[post.id];
        return next;
      });
      return;
    }
    if (translatingIds.has(post.id)) return;
    setTranslatingIds((prev) => {
      const next = new Set(prev);
      next.add(post.id);
      return next;
    });
    try {
      const result = await translate(post.caption, 'en', 'fr');
      if (!result.failed && result.text) {
        setTranslated((prev) => ({ ...prev, [post.id]: result.text }));
      }
    } catch {
      // silent fallback
    } finally {
      setTranslatingIds((prev) => {
        const next = new Set(prev);
        next.delete(post.id);
        return next;
      });
    }
  };

  const filtered = posts.filter((p) => filter === 'all' || mapSkinType(p.skin_type) === filter);
  const isEmpty = !loading && filtered.length === 0;

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.copper} />
        }
      >
        <View style={s.header}>
          <Text style={s.title}>Communauté</Text>
          <Text style={s.subtitle}>Découvrez les routines des femmes comme vous</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.filtersScroll}
        >
          <Chip label="Tous" active={filter === 'all'} onPress={() => setFilter('all')} />
          <Chip label="Sèche" active={filter === 'dry'} onPress={() => setFilter('dry')} />
          <Chip label="Grasse" active={filter === 'oily'} onPress={() => setFilter('oily')} />
          <Chip label="Mixte" active={filter === 'combination'} onPress={() => setFilter('combination')} />
          <Chip label="Normale" active={filter === 'normal'} onPress={() => setFilter('normal')} />
        </ScrollView>

        {loading ? (
          <View style={s.loadingBox}>
            <ActivityIndicator color={C.copper} />
          </View>
        ) : isEmpty ? (
          <EmptyState
            title="Pas encore de routines"
            subtitle="Les routines partagées par la communauté apparaîtront ici."
          />
        ) : (
          <View style={s.list}>
            {filtered.map((post) => (
              <PostCard
              isLiked={likedIds.has(post.id)}
              onLikePress={() => handleLike(post.id)}
              isSaved={savedIds.has(post.id)}
              onSavePress={() => handleSave(post.id)}
                key={post.id}
                post={post}
                translatedCaption={translated[post.id]}
                isTranslating={translatingIds.has(post.id)}
                onTranslatePress={() => handleTranslate(post)}
              />
            ))}
          </View>
        )}

        <View style={{ height: Sp.huge }} />
      </ScrollView>
    
        <Pressable
          onPress={() => router.push('/post/new' as any)}
          style={fabS.fab}
          hitSlop={8}
        >
          <Text style={fabS.fabPlus}>+</Text>
        </Pressable>
      </SafeAreaView>
  );
}

type PostCardProps = {
  post: Post;
  isLiked?: boolean;
  onLikePress?: () => void;
  isSaved?: boolean;
  onSavePress?: () => void;
  translatedCaption?: string;
  isTranslating: boolean;
  onTranslatePress: () => void;
};

function PostCard({ post, translatedCaption, isTranslating, onTranslatePress, isLiked, onLikePress, isSaved, onSavePress }: PostCardProps) {
  const skinType = mapSkinType(post.skin_type);
  const skinLabel = SKIN_LABEL[skinType];
  const username = displayName(post);
  const meta = relativeTime(post.created_at);
  const showTranslated = !!translatedCaption;
  const captionToShow = showTranslated ? translatedCaption : post.caption;
  const productNames = post.product_names || [];

  let translateLabel = 'Traduire';
  if (isTranslating) translateLabel = 'Traduction...';
  else if (showTranslated) translateLabel = 'Original';

  return (
    <View style={[s.postCard, Sh.soft]}>
      <View style={s.postHeader}>
        <View style={s.avatar}>
          <Text style={s.avatarLetter}>
            {(username[0] || 'M').toUpperCase()}
          </Text>
        </View>
        <View style={s.postUserBox}>
          <Text style={s.postUsername}>{username}</Text>
          {meta ? <Text style={s.postMeta}>{meta}</Text> : null}
        </View>
        <View style={s.skinBadge}>
          <Text style={s.skinBadgeTxt}>{skinLabel}</Text>
        </View>
      </View>

      {captionToShow ? (
        <Text style={s.postContent}>{captionToShow}</Text>
      ) : null}

      {productNames.length > 0 && (
        <>
          <Text style={s.productsLabel}>PRODUITS UTILISÉS</Text>
          <View style={s.productChipsBox}>
            {productNames.map((name, i) => (
              <View key={`${post.id}-p-${i}`} style={s.productChip}>
                <Text style={s.productChipTxt} numberOfLines={1}>{name}</Text>
              </View>
            ))}
          </View>
        </>
      )}

      <View style={s.footerRow}>
        <Text style={s.likesTxt}>
          {post.likes_count || 0} {(post.likes_count || 0) === 1 ? "j'aime" : "j'aime"}
        </Text>
        <Pressable
          onPress={onTranslatePress}
          disabled={isTranslating}
          style={s.translateBtn}
          hitSlop={6}
        >
          <Text style={s.translateTxt}>{translateLabel}</Text>
        </Pressable>
      </View>
    
      {post.image_url ? (
        <Image source={{ uri: post.image_url }} style={cardS.postImage} resizeMode="cover" />
      ) : null}
      <View style={cardS.likeRow}>
        <Pressable
          onPress={onLikePress}
          hitSlop={8}
          style={cardS.likeBtn}
        >
          <Text style={[cardS.heart, isLiked && cardS.heartActive]}>{isLiked ? '♥' : '♡'}</Text>
          <Text style={cardS.likeCount}>{post.likes_count ?? 0}</Text>
        </Pressable>
        <View style={{ flex: 1 }} />
        <Pressable
          onPress={onSavePress}
          hitSlop={8}
          style={cardS.saveBtn}
        >
          <Text style={[cardS.bookmark, isSaved && cardS.bookmarkActive]}>{isSaved ? '◆' : '◇'}</Text>
        </Pressable>
      </View>
</View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.appBg },
  scroll: { paddingHorizontal: Sp.lg, paddingTop: Sp.sm, paddingBottom: Sp.xl },
  header: { marginBottom: Sp.lg, marginTop: Sp.sm },
  title: { ...Type.h1, marginBottom: 4 },
  subtitle: { ...Type.body, color: C.textMid },
  filtersScroll: {
    paddingRight: Sp.lg,
    marginBottom: Sp.lg,
  },
  list: { marginTop: Sp.sm },
  postCard: {
    backgroundColor: C.white,
    borderRadius: R.lg,
    padding: Sp.lg,
    marginBottom: Sp.md,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Sp.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.cream,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Sp.sm,
  },
  avatarLetter: {
    fontSize: 16,
    fontWeight: '600',
    color: C.espresso,
  },
  postUserBox: { flex: 1 },
  postUsername: {
    fontSize: 14,
    fontWeight: '600',
    color: C.text,
  },
  postMeta: {
    fontSize: 11,
    color: C.textSoft,
    marginTop: 2,
  },
  skinBadge: {
    backgroundColor: C.cream,
    paddingHorizontal: Sp.sm,
    paddingVertical: 4,
    borderRadius: R.full,
  },
  skinBadgeTxt: {
    fontSize: 10,
    fontWeight: '600',
    color: C.espresso,
    letterSpacing: 0.4,
  },
  postContent: {
    fontSize: 14,
    color: C.textMid,
    lineHeight: 21,
    marginBottom: Sp.md,
  },
  productsLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: C.copper,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: Sp.sm,
  },
  productsBox: {
    marginBottom: Sp.md,
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.cream,
    borderRadius: R.md,
    padding: Sp.sm,
    marginBottom: Sp.xs,
  },
  productImg: {
    width: 48,
    height: 48,
    borderRadius: R.sm,
    backgroundColor: C.white,
    marginRight: Sp.sm,
  },
  productMeta: { flex: 1 },
  productBrand: {
    fontSize: 9,
    fontWeight: '700',
    color: C.copper,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  productName: {
    fontSize: 13,
    fontWeight: '500',
    color: C.text,
    lineHeight: 17,
  },
  productCta: {
    fontSize: 11,
    fontWeight: '600',
    color: C.copper,
    marginLeft: Sp.xs,
  },
  actionsRow: {
    flexDirection: 'row',
    marginTop: Sp.xs,
  },
  loadingBox: {
    paddingVertical: Sp.huge,
    alignItems: 'center',
  },
  productChipsBox: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Sp.md,
  },
  productChip: {
    backgroundColor: C.cream,
    borderRadius: R.full,
    paddingHorizontal: Sp.sm,
    paddingVertical: 6,
    marginRight: 6,
    marginBottom: 6,
    maxWidth: '100%',
  },
  productChipTxt: {
    fontSize: 12,
    color: C.text,
    fontWeight: '500',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Sp.xs,
    paddingTop: Sp.sm,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  likesTxt: {
    fontSize: 12,
    color: C.textMid,
    fontWeight: '500',
  },
  translateBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  translateTxt: {
    fontSize: 12,
    color: C.copper,
    fontWeight: '600',
  },
});


const cardS = StyleSheet.create({
  postImage: {
    width: '100%',
    aspectRatio: 4 / 5,
    borderRadius: R.md,
    marginTop: Sp.md,
    backgroundColor: C.bg2,
  },
  likeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Sp.md,
    paddingTop: Sp.sm,
    borderTopWidth: 0.5,
    borderTopColor: C.border,
  },
  likeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heart: { fontSize: 20, color: C.textMid },
  heartActive: { color: C.red },
  likeCount: { fontSize: 13, color: C.textMid, fontWeight: '500' },
  saveBtn: { paddingHorizontal: 4 },
  bookmark: { fontSize: 18, color: C.textMid },
  bookmarkActive: { color: C.copper },
});


const fabS = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: Sp.lg,
    bottom: Sp.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: C.copper,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 6,
  },
  fabPlus: { color: '#FFFFFF', fontSize: 28, fontWeight: '300', marginTop: -2 },
});
