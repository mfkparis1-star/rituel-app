/**
 * Daily skin check-in screen.
 *
 * Single-question flow: pick one of 5 emojis, optional short note,
 * tap Enregistrer. Inserts into skin_checkins via useCheckins.submit
 * and routes back. If a check-in already exists for today, the screen
 * shows a soft "déjà fait aujourd'hui" state with a re-edit option
 * (insert anyway — checkins are immutable but multiple per day are fine).
 */
import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import EmojiScale from '../components/ui/EmojiScale';
import PillButton from '../components/ui/PillButton';
import { useCheckins } from '../hooks/useCheckins';
import { CheckinEmoji } from '../utils/checkins';
import { safeBack } from '../utils/safeBack';
import { C, R, Sp, Type } from '../theme';

export default function CheckinScreen() {
  const { hasToday, submit } = useCheckins();
  const [emoji, setEmoji] = useState<CheckinEmoji | null>(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = !!emoji && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit || !emoji) return;
    setSubmitting(true);
    const ok = await submit(emoji, note.trim() || undefined);
    setSubmitting(false);
    if (!ok) {
      Alert.alert(
        'Enregistrement impossible',
        'Une erreur est survenue. Réessaye dans un instant.'
      );
      return;
    }
    safeBack('/(tabs)');
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={s.root} edges={['top']}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <Pressable onPress={() => safeBack('/(tabs)')} style={s.back}>
            <Text style={s.backTxt}>{'←  Retour'}</Text>
          </Pressable>

          <Text style={s.label}>CHECK-IN DU JOUR</Text>
          <Text style={s.title}>Comment va ta peau ?</Text>
          <Text style={s.subtitle}>
            Un instant pour toi. Ce signal nous aide à affiner tes recommandations.
          </Text>

          {hasToday && (
            <View style={s.alreadyBox}>
              <Text style={s.alreadyTxt}>
                Tu as déjà fait ton check-in aujourd’hui. Tu peux en ajouter un autre si ton ressenti a changé.
              </Text>
            </View>
          )}

          <View style={s.section}>
            <EmojiScale value={emoji} onChange={setEmoji} disabled={submitting} />
          </View>

          <Text style={s.fieldLabel}>Une note (optionnel)</Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Hydratation, sommeil, événement…"
            placeholderTextColor={C.textSoft}
            style={s.input}
            multiline
            maxLength={140}
            editable={!submitting}
          />
          <Text style={s.counter}>{note.length} / 140</Text>

          <PillButton
            label="Enregistrer"
            variant="primary"
            fullWidth
            disabled={!canSubmit}
            loading={submitting}
            onPress={handleSubmit}
            style={{ marginTop: Sp.lg }}
          />
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.appBg },
  scroll: { paddingHorizontal: Sp.lg, paddingTop: Sp.sm, paddingBottom: Sp.huge },
  back: { paddingVertical: Sp.sm, marginBottom: Sp.md },
  backTxt: { fontSize: 14, color: C.textMid },
  label: {
    fontSize: 11,
    letterSpacing: 1.5,
    color: C.copper,
    fontWeight: '600',
    marginBottom: 6,
  },
  title: { ...Type.h1, marginBottom: 8 },
  subtitle: { ...Type.body, color: C.textMid, marginBottom: Sp.lg },
  alreadyBox: {
    backgroundColor: C.cream,
    padding: Sp.md,
    borderRadius: R.md,
    marginBottom: Sp.lg,
  },
  alreadyTxt: {
    fontSize: 13,
    color: C.espresso,
    lineHeight: 19,
  },
  section: { marginBottom: Sp.xl },
  fieldLabel: {
    fontSize: 12,
    letterSpacing: 0.5,
    color: C.textMid,
    marginBottom: 6,
    fontWeight: '500',
  },
  input: {
    backgroundColor: C.bg2,
    borderRadius: R.md,
    padding: Sp.md,
    minHeight: 80,
    fontSize: 14,
    color: C.text,
    textAlignVertical: 'top',
  },
  counter: {
    fontSize: 11,
    color: C.textSoft,
    textAlign: 'right',
    marginTop: 4,
  },
});
