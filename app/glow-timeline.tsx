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
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PillButton from '../components/ui/PillButton';
import { supabase } from '../lib/supabase';
import { useMemory } from '../hooks/useMemory';
import { useScore } from '../hooks/useScore';
import { Checkin, CHECKIN_EMOJIS, getRecentCheckins } from '../utils/checkins';
import { fetchOwnPosts, FeedPost } from '../utils/posts';
import { safeBack } from '../utils/safeBack';
import { C, R, Sp, Type } from '../theme';

type TimelineItem =
  | { kind: 'checkin'; at: string; data: Checkin }
  | { kind: 'analysis'; at: string; data: { skinType?: string; issues?: string[] } }
  | { kind: 'post'; at: string; data: FeedPost };

function emojiSymbol(id: string): string {
  return CHECKIN_EMOJIS.find((e) => e.id === id)?.symbol ?? '·';
}

function emojiLabel(id: string): string {
  return CHECKIN_EMOJIS.find((e) => e.id === id)?.label_fr ?? '';
}

function formatDay(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  if (sameDay(d, today)) return "Aujourd’hui";
  if (sameDay(d, yesterday)) return 'Hier';
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function dayKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export default function GlowTimelineScreen() {
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

  if (!session && !loading) {
    return (
      <SafeAreaView style={s.root} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={s.centered}>
          <Text style={s.muted}>Connecte-toi pour ouvrir ton journal.</Text>
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

        <Text style={s.label}>JOURNAL</Text>
        <Text style={s.title}>Ton parcours</Text>
        <Text style={s.subtitle}>Chaque check-in, chaque analyse, chaque rituel partagé. Ton histoire beauté, jour après jour.</Text>

        {score && (
          <View style={s.scoreChip}>
            <Text style={s.scoreChipLabel}>Cette semaine, tu es</Text>
            <Text style={s.scoreChipValue}>{score.label}</Text>
          </View>
        )}

        {loading ? (
          <View style={s.centered}>
            <ActivityIndicator color={C.copper} />
          </View>
        ) : grouped.length === 0 ? (
          <View style={s.emptyBox}>
            <Text style={s.emptyTitle}>Ton journal commence aujourd’hui</Text>
            <Text style={s.emptySub}>
              Fais ton premier check-in pour ouvrir ton parcours beauté personnel.
            </Text>
            <PillButton
              label="Faire mon check-in"
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
                    <View key={`c-${it.data.id}`} style={s.itemCard}>
                      <View style={s.itemHeader}>
                        <Text style={s.itemEmoji}>{emojiSymbol(it.data.emoji)}</Text>
                        <View style={s.itemHeaderRight}>
                          <Text style={s.itemKind}>{emojiLabel(it.data.emoji)}</Text>
                          <Text style={s.itemTime}>{formatTime(it.at)}</Text>
                        </View>
                      </View>
                      {it.data.note ? <Text style={s.itemNote}>{it.data.note}</Text> : null}
                    </View>
                  );
                }
                if (it.kind === 'analysis') {
                  return (
                    <View key={`a-${it.at}`} style={[s.itemCard, s.itemCardAccent]}>
                      <View style={s.itemHeader}>
                        <Text style={s.itemEmoji}>✦</Text>
                        <View style={s.itemHeaderRight}>
                          <Text style={s.itemKind}>Analyse de peau</Text>
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
                    <View key={`p-${it.data.id}`} style={s.itemCard}>
                      <View style={s.itemHeader}>
                        <Text style={s.itemEmoji}>♡</Text>
                        <View style={s.itemHeaderRight}>
                          <Text style={s.itemKind}>Publication</Text>
                          <Text style={s.itemTime}>{formatTime(it.at)}</Text>
                        </View>
                      </View>
                      {it.data.image_url ? (
                        <Image source={{ uri: it.data.image_url }} style={s.postThumb} resizeMode="cover" />
                      ) : null}
                      {it.data.caption ? (
                        <Text style={s.itemNote} numberOfLines={3}>{it.data.caption}</Text>
                      ) : null}
                    </View>
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
});
