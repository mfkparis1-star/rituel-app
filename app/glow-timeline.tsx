/**
 * Glow Timeline (Phase 16D D3).
 *
 * The user's chronological beauty journal: check-ins, AI analysis
 * milestones, and own community posts merged into one soft, dated
 * stream. Tone: luxury diary, not health tracker. Zero charts, zero
 * scores, zero streaks. The point is reflection, not gamification.
 *
 * Sources (all read-only, no DB changes):
 *   - skin_checkins (last 30 via getRecentCheckins)
 *   - profile.memory.last_analysis_summary (one milestone card)
 *   - own posts (last 30 via fetchOwnPosts)
 *
 * Items are merged client-side, sorted by date desc, grouped by day.
 */
import { type Session } from '@supabase/supabase-js';
import { router, Stack } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PillButton from '../components/ui/PillButton';
import { supabase } from '../lib/supabase';
import { useMemory } from '../hooks/useMemory';
import { useScore } from '../hooks/useScore';
import { Checkin, CHECKIN_EMOJIS, getRecentCheckins, deleteCheckin } from '../utils/checkins';
import { fetchOwnPosts, FeedPost, updatePostCaption, deletePost } from '../utils/posts';
import { safeBack } from '../utils/safeBack';
import { useLanguage } from '../hooks/useLanguage';
import { fr as frDict } from '../utils/i18n/locales/fr';
import { en as enDict } from '../utils/i18n/locales/en';
import { tr as trDict } from '../utils/i18n/locales/tr';
import { localeToBcp47, type Lang } from '../utils/i18n';
import { C, R, Sp, Type } from '../theme';

type TimelineItem =
  | { kind: 'checkin'; at: string; data: Checkin }
  | { kind: 'analysis'; at: string; data: { skinType?: string; issues?: string[] } }
  | { kind: 'post'; at: string; data: FeedPost };

function emojiSymbol(id: string): string {
  return CHECKIN_EMOJIS.find((e) => e.id === id)?.symbol ?? '·';
}

function makeEmojiLabel(t: (k: string) => string) {
  return (id: string): string => t(`checkin.emojis.${id}`);
}

function makeFormatDay(t: (k: string) => string, lang: Lang) {
  const bcp = localeToBcp47(lang);
  return (iso: string): string => {
    const d = new Date(iso);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const sameDay = (a: Date, b: Date) =>
      a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
    if (sameDay(d, today)) return t('glowTimeline.relative.today');
    if (sameDay(d, yesterday)) return t('glowTimeline.relative.yesterday');
    return d.toLocaleDateString(bcp, { day: 'numeric', month: 'long' });
  };
}

function makeFormatTime(lang: Lang) {
  const bcp = localeToBcp47(lang);
  return (iso: string): string => {
    const d = new Date(iso);
    return d.toLocaleTimeString(bcp, { hour: '2-digit', minute: '2-digit' });
  };
}

function dayKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export default function GlowTimelineScreen() {
  const { t, lang } = useLanguage();
  const scoreDict = lang === 'en' ? enDict : lang === 'tr' ? trDict : frDict;
  const formatDay = useMemo(() => makeFormatDay(t, lang), [t, lang]);
  const formatTime = useMemo(() => makeFormatTime(lang), [lang]);
  const emojiLabel = useMemo(() => makeEmojiLabel(t), [t]);

  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [ownPosts, setOwnPosts] = useState<FeedPost[]>([]);
  const { memory } = useMemory();
  const { score } = useScore();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getSession();
      const sess = data.session;
      if (cancelled) return;
      setSession(sess);
      if (!sess) {
        setLoading(false);
        return;
      }
      const [c, p] = await Promise.all([
        getRecentCheckins(sess.user.id, 30),
        fetchOwnPosts(sess.user.id, 30),
      ]);
      if (cancelled) return;
      setCheckins(c);
      setOwnPosts(p);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const items: TimelineItem[] = useMemo(() => {
    const out: TimelineItem[] = [];
    checkins.forEach((c) => out.push({ kind: 'checkin', at: c.created_at, data: c }));
    ownPosts.forEach((p) => out.push({ kind: 'post', at: p.created_at, data: p }));
    const ana = memory?.last_analysis_summary;
    if (ana?.at) {
      out.push({ kind: 'analysis', at: ana.at, data: { skinType: ana.skinType, issues: ana.issues } });
    }
    out.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
    return out;
  }, [checkins, ownPosts, memory]);

  // Group by day
  const grouped = useMemo(() => {
    const map = new Map<string, { label: string; items: TimelineItem[] }>();
    items.forEach((it) => {
      const k = dayKey(it.at);
      if (!map.has(k)) map.set(k, { label: formatDay(it.at), items: [] });
      map.get(k)!.items.push(it);
    });
    return Array.from(map.entries()).map(([k, v]) => ({ key: k, ...v }));
  }, [items]);

  const handleDeleteCheckin = (checkin: Checkin) => {
    Alert.alert(
      t('glowTimeline.actions.checkin.deleteTitle'),
      t('glowTimeline.actions.checkin.deleteBody'),
      [
        { text: t('glowTimeline.actions.post.cancel'), style: 'cancel' },
        {
          text: t('glowTimeline.actions.post.delete'),
          style: 'destructive',
          onPress: async () => {
            // Optimistic removal from local state
            setCheckins((prev) => prev.filter((c) => c.id !== checkin.id));
            const ok = await deleteCheckin(checkin.id);
            if (!ok) {
              // Revert by re-fetching
              if (session) {
                const fresh = await getRecentCheckins(session.user.id, 30);
                setCheckins(fresh);
              }
              Alert.alert(t('glowTimeline.actions.checkin.errorTitle'), t('glowTimeline.actions.checkin.errorBody'));
            }
          },
        },
      ]
    );
  };

  const handleEditPost = (post: FeedPost) => {
    Alert.prompt(
      t('glowTimeline.actions.post.editTitle'),
      undefined,
      [
        { text: t('glowTimeline.actions.post.cancel'), style: 'cancel' },
        {
          text: t('glowTimeline.actions.post.editSave'),
          onPress: async (text?: string) => {
            const next = (text ?? '').trim();
            if (next.length < 4 || next.length > 280) {
              Alert.alert(t('glowTimeline.actions.post.editInvalidTitle'), t('glowTimeline.actions.post.editInvalidBody'));
              return;
            }
            // Optimistic update
            setOwnPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, caption: next } : p)));
            const ok = await updatePostCaption(post.id, next);
            if (!ok) {
              setOwnPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, caption: post.caption } : p)));
              Alert.alert(t('glowTimeline.actions.post.editErrorTitle'), t('glowTimeline.actions.post.editErrorBody'));
            }
          },
        },
      ],
      'plain-text',
      post.caption ?? ''
    );
  };

  const handleDeletePost = (post: FeedPost) => {
    Alert.alert(
      t('glowTimeline.actions.post.deleteTitle'),
      t('glowTimeline.actions.post.deleteBody'),
      [
        { text: t('glowTimeline.actions.post.cancel'), style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            // Optimistic removal
            setOwnPosts((prev) => prev.filter((p) => p.id !== post.id));
            const ok = await deletePost(post.id);
            if (!ok && session) {
              const fresh = await fetchOwnPosts(session.user.id, 30);
              setOwnPosts(fresh);
              Alert.alert(t('glowTimeline.actions.checkin.errorTitle'), t('glowTimeline.actions.post.deleteErrorBody'));
            }
          },
        },
      ]
    );
  };

  const handleMenuPostPress = (post: FeedPost) => {
    Alert.alert(
      t('glowTimeline.actions.post.sheetTitle'),
      undefined,
      [
        { text: t('glowTimeline.actions.post.edit'), onPress: () => handleEditPost(post) },
        { text: t('glowTimeline.actions.post.delete'), style: 'destructive', onPress: () => handleDeletePost(post) },
        { text: 'Annuler', style: 'cancel' },
      ]
    );
  };

  if (!session && !loading) {
    return (
      <SafeAreaView style={s.root} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={s.centered}>
          <Text style={s.muted}>{t('glowTimeline.needSignIn')}</Text>
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

        <Text style={s.label}>{t('glowTimeline.kicker')}</Text>
        <Text style={s.title}>{t('glowTimeline.title')}</Text>
        <Text style={s.subtitle}>{t('glowTimeline.subtitle')}</Text>

        {score && (
          <View style={s.scoreChip}>
            <Text style={s.scoreChipLabel}>{t('glowTimeline.scoreChipLabel')}</Text>
            <Text style={s.scoreChipValue}>{scoreDict.score.energyLevels[score.level]}</Text>
          </View>
        )}

        {loading ? (
          <View style={s.centered}>
            <ActivityIndicator color={C.copper} />
          </View>
        ) : grouped.length === 0 ? (
          <View style={s.emptyBox}>
            <Text style={s.emptyTitle}>{t('glowTimeline.emptyTitle')}</Text>
            <Text style={s.emptySub}>
              Fais ton premier check-in pour ouvrir ton parcours beauté personnel.
            </Text>
            <PillButton
              label={t('glowTimeline.emptyCta')}
              variant="primary"
              onPress={() => router.push('/check-in' as any)}
              style={{ marginTop: Sp.lg }}
            />
          </View>
        ) : (
          grouped.map((group) => (
            <View key={group.key} style={s.dayGroup}>
              <Text style={s.daySeparator}>{group.label}</Text>
              {group.items.map((it, idx) => {
                if (it.kind === 'checkin') {
                  return (
                    <Pressable key={`c-${it.data.id}`} onLongPress={() => handleDeleteCheckin(it.data)} delayLongPress={400} style={s.itemCard}>
                      <View style={s.itemHeader}>
                        <Text style={s.itemEmoji}>{emojiSymbol(it.data.emoji)}</Text>
                        <View style={s.itemHeaderRight}>
                          <Text style={s.itemKind}>{emojiLabel(it.data.emoji)}</Text>
                          <Text style={s.itemTime}>{formatTime(it.at)}</Text>
                        </View>
                      </View>
                      {it.data.note ? <Text style={s.itemNote}>{it.data.note}</Text> : null}
                      <Text style={s.longPressHint}>{t('glowTimeline.item.hintCheckin')}</Text>
                    </Pressable>
                  );
                }
                if (it.kind === 'analysis') {
                  return (
                    <View key={`a-${it.at}`} style={[s.itemCard, s.itemCardAccent]}>
                      <View style={s.itemHeader}>
                        <Text style={s.itemEmoji}>✦</Text>
                        <View style={s.itemHeaderRight}>
                          <Text style={s.itemKind}>{t('glowTimeline.item.kindAnalysis')}</Text>
                          <Text style={s.itemTime}>{formatTime(it.at)}</Text>
                        </View>
                      </View>
                      {it.data.skinType ? (
                        <Text style={s.itemNote}>
                          Peau {it.data.skinType}
                          {it.data.issues && it.data.issues.length > 0
                            ? ` · ${it.data.issues.slice(0, 2).join(' · ')}`
                            : ''}
                        </Text>
                      ) : null}
                    </View>
                  );
                }
                if (it.kind === 'post') {
                  return (
                    <Pressable key={`p-${it.data.id}`} onLongPress={() => handleMenuPostPress(it.data)} delayLongPress={400} style={s.itemCard}>
                      <View style={s.itemHeader}>
                        <Text style={s.itemEmoji}>♡</Text>
                        <View style={s.itemHeaderRight}>
                          <Text style={s.itemKind}>{t('glowTimeline.item.kindPost')}</Text>
                          <Text style={s.itemTime}>{formatTime(it.at)}</Text>
                        </View>
                      </View>
                      {it.data.image_url ? (
                        <Image source={{ uri: it.data.image_url }} style={s.postThumb} resizeMode="cover" />
                      ) : null}
                      {it.data.caption ? (
                        <Text style={s.itemNote} numberOfLines={3}>{it.data.caption}</Text>
                      ) : null}
                      <Text style={s.longPressHint}>{t('glowTimeline.item.hintPost')}</Text>
                    </Pressable>
                  );
                }
                return null;
              })}
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
  centered: { padding: Sp.xl, alignItems: 'center', justifyContent: 'center' },
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

  dayGroup: { marginBottom: Sp.lg },
  daySeparator: {
    fontSize: 11,
    letterSpacing: 1.5,
    color: C.copper,
    fontWeight: '600',
    marginBottom: Sp.sm,
    marginTop: Sp.sm,
    textTransform: 'uppercase',
  },

  itemCard: {
    backgroundColor: C.bg2,
    borderRadius: R.md,
    padding: Sp.md,
    marginBottom: Sp.xs,
  },
  itemCardAccent: {
    backgroundColor: C.cream,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Sp.sm,
    marginBottom: 6,
  },
  itemEmoji: { fontSize: 22 },
  itemHeaderRight: { flex: 1 },
  itemKind: {
    fontSize: 13,
    color: C.espresso,
    fontWeight: '500',
  },
  itemTime: {
    fontSize: 11,
    color: C.textSoft,
    marginTop: 2,
  },
  itemNote: {
    fontSize: 13,
    color: C.text,
    lineHeight: 19,
    marginTop: 4,
  },
  postThumb: {
    width: '100%',
    aspectRatio: 4 / 5,
    borderRadius: R.sm,
    marginTop: Sp.sm,
    marginBottom: Sp.xs,
    backgroundColor: C.appBg,
  },
  scoreChip: {
    backgroundColor: C.cream,
    borderRadius: R.md,
    padding: Sp.md,
    marginBottom: Sp.lg,
    alignItems: 'center',
  },
  scoreChipLabel: {
    fontSize: 11,
    letterSpacing: 1.2,
    color: C.textMid,
    fontWeight: '500',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  scoreChipValue: {
    fontSize: 18,
    color: C.copper,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  longPressHint: {
    fontSize: 10,
    color: C.textSoft,
    marginTop: 6,
    fontStyle: 'italic',
    letterSpacing: 0.3,
  },
});
