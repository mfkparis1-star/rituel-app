/**
 * Create a new community post (Phase 16D D1).
 *
 * Single-screen flow: optional image (4:5 crop), required caption,
 * optional auto-fill of skin_type from profile.memory.last_analysis_summary
 * and product_names from the active archive. Submits via utils/posts.createPost.
 *
 * Tone: beauty diary, soft luxury — not generic social media.
 */
import { type Session } from '@supabase/supabase-js';
import { Stack } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Image, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PillButton from '../../components/ui/PillButton';
import { supabase } from '../../lib/supabase';
import { createPost, pickPostImage, uploadPostImage } from '../../utils/posts';
import { useProfile } from '../../hooks/useProfile';
import { useMemory } from '../../hooks/useMemory';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { safeBack } from '../../utils/safeBack';
import { C, R, Sp, Type } from '../../theme';

const MAX_CAPTION = 280;

export default function NewPostScreen() {
  const [session, setSession] = useState<Session | null>(null);
  const { profile } = useProfile();
  const { memory } = useMemory();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [emotion, setEmotion] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (mounted) setSession(data.session);
    })();
    return () => { mounted = false; };
  }, []);

  const skinType = useMemo(
    () => memory?.last_analysis_summary?.skinType ?? profile?.skin_type ?? null,
    [memory, profile]
  );

  const valid = caption.trim().length >= 4 && caption.trim().length <= MAX_CAPTION;
  const canSubmit = valid && !submitting && !!session;

  const handlePickImage = async () => {
    if (submitting) return;
    const r = await pickPostImage();
    if (!r.ok) {
      if (r.reason === 'no_permission') {
        Alert.alert(
          'Accès aux photos refusé',
          'Active l’accès aux photos dans Réglages pour ajouter une image à ta publication.',
          [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Ouvrir Réglages', onPress: () => { Linking.openSettings().catch(() => {}); } },
          ]
        );
      }
      return;
    }
    setImageUri(r.uri);
  };

  const handleSubmit = async () => {
    if (!canSubmit || !session) return;
    setSubmitting(true);

    let imageUrl: string | null = null;
    if (imageUri) {
      imageUrl = await uploadPostImage(session.user.id, imageUri);
      if (!imageUrl) {
        setSubmitting(false);
        Alert.alert('Erreur', 'Téléchargement de l’image impossible. Réessaye.');
        return;
      }
    }

    const display = profile?.full_name?.trim() || (session.user.email ?? '').split('@')[0] || null;
    const result = await createPost({
      userId: session.user.id,
      caption: caption.trim(),
      emotion,
      skinType,
      imageUrl,
      displayName: display,
      userEmail: session.user.email ?? null,
      lang: profile?.language ?? 'fr',
    });
    setSubmitting(false);

    if (!result.ok) {
      Alert.alert('Erreur', 'Publication impossible. Réessaye dans un instant.');
      return;
    }
    await AsyncStorage.setItem('@rituel:community:invalidate', '1');
    safeBack('/(tabs)/community');
  };

  if (!session) {
    return (
      <SafeAreaView style={s.root} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={s.centered}>
          <Text style={s.muted}>Connecte-toi pour partager ton rituel.</Text>
          <PillButton label="Retour" variant="primary" onPress={() => safeBack('/(tabs)/community')} style={{ marginTop: Sp.md }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => safeBack('/(tabs)/community')} style={s.back}>
          <Text style={s.backTxt}>{'←  Retour'}</Text>
        </Pressable>

        <Text style={s.label}>NOUVEAU RITUEL</Text>
        <Text style={s.title}>Partage ton instant</Text>
        <Text style={s.subtitle}>Une note, une photo, un rituel. Ton journal beauté est privé par défaut, mais ce que tu publies ici est partagé avec la communauté Rituel.</Text>

        <Pressable onPress={handlePickImage} style={s.imageSlot} disabled={submitting}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={s.imagePreview} resizeMode="cover" />
          ) : (
            <View style={s.imagePlaceholder}>
              <Text style={s.imagePlaceholderTitle}>Ajouter une photo</Text>
              <Text style={s.imagePlaceholderSub}>Optionnel · format portrait</Text>
            </View>
          )}
        </Pressable>

        <Text style={s.fieldLabel}>Ta note</Text>
        <TextInput
          value={caption}
          onChangeText={(t) => t.length <= MAX_CAPTION && setCaption(t)}
          placeholder="Comment se sent ta peau aujourd’hui ? Quel rituel as-tu suivi ?"
          placeholderTextColor={C.textSoft}
          style={s.captionInput}
          multiline
          editable={!submitting}
        />
        <Text style={s.counter}>{caption.length} / {MAX_CAPTION}</Text>

        {skinType && (
          <View style={s.metaRow}>
            <Text style={s.metaChip}>Peau {skinType}</Text>
          </View>
        )}

        {/* Phase 17A — emotion picker (optional, beauty ritual emotion) */}
        <View style={s.emotionWrap}>
          <Text style={s.emotionLabel}>Comment t'es-tu sentie ?</Text>
          <View style={s.emotionRow}>
            {(['Apaisant','Réconfortant','Lumineux','Énergisant','Fragile','Doux'] as const).map((e) => {
              const active = emotion === e;
              return (
                <Pressable
                  key={e}
                  onPress={() => setEmotion(active ? null : e)}
                  style={[s.emotionChip, active && s.emotionChipActive]}
                  hitSlop={6}
                >
                  <Text style={[s.emotionChipTxt, active && s.emotionChipTxtActive]}>{e}</Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={s.emotionHint}>Facultatif</Text>
        </View>

        <PillButton
          label="Publier"
          variant="primary"
          fullWidth
          disabled={!canSubmit}
          loading={submitting}
          onPress={handleSubmit}
          style={{ marginTop: Sp.lg }}
        />

        <View style={{ height: Sp.huge }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.appBg },
  scroll: { paddingHorizontal: Sp.lg, paddingTop: Sp.sm, paddingBottom: Sp.huge },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Sp.lg },
  back: { paddingVertical: Sp.sm, marginBottom: Sp.md },
  backTxt: { fontSize: 14, color: C.textMid },
  label: { fontSize: 11, letterSpacing: 1.5, color: C.copper, fontWeight: '600', marginBottom: 6 },
  title: { ...Type.h1, marginBottom: 4 },
  subtitle: { ...Type.body, color: C.textMid, marginBottom: Sp.lg, lineHeight: 20 },
  muted: { ...Type.body, color: C.textMid, textAlign: 'center' },

  imageSlot: {
    aspectRatio: 4 / 5,
    backgroundColor: C.bg2,
    borderRadius: R.md,
    overflow: 'hidden',
    marginBottom: Sp.lg,
  },
  imagePreview: { width: '100%', height: '100%' },
  imagePlaceholder: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: C.copper, borderStyle: 'dashed', borderRadius: R.md,
  },
  imagePlaceholderTitle: { fontSize: 15, color: C.espresso, fontWeight: '500', marginBottom: 4 },
  imagePlaceholderSub: { fontSize: 12, color: C.textMid },

  fieldLabel: { fontSize: 12, letterSpacing: 0.5, color: C.textMid, marginBottom: 6, fontWeight: '500' },
  captionInput: {
    backgroundColor: C.bg2, borderRadius: R.md, padding: Sp.md,
    minHeight: 120, fontSize: 14, color: C.text, textAlignVertical: 'top', lineHeight: 20,
  },
  emotionWrap: {
    marginTop: 18,
    marginBottom: 4,
  },
  emotionLabel: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 2,
    color: C.copper,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  emotionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  emotionChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 100,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#E8DFD2',
  },
  emotionChipActive: {
    backgroundColor: '#FBF6F1',
    borderColor: C.copper,
  },
  emotionChipTxt: {
    fontSize: 13,
    fontStyle: 'italic',
    color: '#7A6555',
  },
  emotionChipTxtActive: {
    color: C.copper,
    fontWeight: '500',
  },
  emotionHint: {
    fontSize: 11,
    fontStyle: 'italic',
    color: '#A99583',
    marginTop: 8,
    letterSpacing: 0.3,
  },
  counter: { fontSize: 11, color: C.textSoft, textAlign: 'right', marginTop: 4 },

  metaRow: { flexDirection: 'row', gap: Sp.xs, marginTop: Sp.md, flexWrap: 'wrap' },
  metaChip: {
    fontSize: 11, color: C.copper, backgroundColor: C.cream,
    paddingHorizontal: Sp.sm, paddingVertical: 4, borderRadius: 999,
    textTransform: 'capitalize', fontWeight: '500',
  },
});
