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
import { useLanguage } from '../hooks/useLanguage';
import { CHECKIN_EMOJIS } from '../utils/checkins';
import { C, R, Sp, Type } from '../theme';
import { supabase } from '../lib/supabase';
import { adaptRitual } from '../utils/ritualAdapt';
import { categoryInfo } from '../utils/routineGestures';

export default function CheckinScreen() {
  const { t } = useLanguage();
  const emojiLabelMap = CHECKIN_EMOJIS.reduce((acc, e) => {
    acc[e.id] = t(`checkin.emojis.${e.id}`);
    return acc;
  }, {} as Record<CheckinEmoji, string>);

  const { hasToday, submit } = useCheckins();
  const [emoji, setEmoji] = useState<CheckinEmoji | null>(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<CheckinEmoji | null>(null);
  const [adaptSteps, setAdaptSteps] = useState<{ id: string; product_name: string; category: string | null; duration: string }[]>([]);

  const canSubmit = !!emoji && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit || !emoji) return;
    setSubmitting(true);
    const ok = await submit(emoji, note.trim() || undefined);
    if (!ok) {
      setSubmitting(false);
      Alert.alert(t('checkin.error.title'), t('checkin.error.body'));
      return;
    }
    // load tonight's steps to show the adaptation
    try {
      const { data: sess } = await supabase.auth.getSession();
      const uid = sess.session?.user?.id;
      if (uid) {
        const { data } = await supabase
          .from('routine_steps')
          .select('id, product_name, category, duration')
          .eq('user_id', uid)
          .eq('routine_type', 'soir')
          .order('step_order', { ascending: true });
        if (data) setAdaptSteps(data as any);
      }
    } catch {
      // proceed with empty list
    }
    setSubmitting(false);
    setSubmitted(emoji);
  };

  if (submitted) {
    const adaptation = adaptRitual(submitted, adaptSteps);
    const emojiObj = CHECKIN_EMOJIS.find((e) => e.id === submitted);
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={s.root} edges={['top']}>
          <ScrollView contentContainerStyle={s.scroll}>
            <Pressable onPress={() => router.replace('/(tabs)' as any)} style={s.adaptClose} hitSlop={10}>
              <Text style={s.adaptCloseTxt}>✕</Text>
            </Pressable>

            <Text style={s.adaptEmoji}>{emojiObj?.symbol ?? ''}</Text>
            <Text style={s.adaptMood}>{emojiLabelMap[submitted]}</Text>
            <Text style={s.adaptSaved}>{t('home.adapt.saved')}</Text>

            {adaptSteps.length > 0 && (
              <View style={s.adaptCard}>
                <Text style={s.adaptCardLabel}>{t('home.adapt.label')}</Text>
                <Text style={s.adaptHeadline}>{t(adaptation.headlineKey)}</Text>
                {adaptation.steps.map(({ step, softened }) => (
                  <View key={step.id} style={s.adaptRow}>
                    <View style={softened ? s.adaptStrike : s.adaptDot} />
                    <Text style={[s.adaptStepTxt, softened && s.adaptStepSoft]}>
                      {step.product_name}
                    </Text>
                    <Text style={s.adaptTag}>
                      {softened ? t('home.adapt.softened') : t('home.adapt.kept')}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            <PillButton
              label={t('home.adapt.startCta')}
              variant="primary"
              fullWidth
              onPress={() => router.replace('/routine-session' as any)}
              style={{ marginTop: Sp.lg }}
            />
            <Pressable onPress={() => router.replace('/(tabs)' as any)} hitSlop={8}>
              <Text style={s.adaptSeeHome}>{t('home.adapt.seeHome')}</Text>
            </Pressable>
          </ScrollView>
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={s.root} edges={['top']}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <Pressable onPress={() => safeBack('/(tabs)')} style={s.back}>
            <Text style={s.backTxt}>{`←  ${t('checkin.back')}`}</Text>
          </Pressable>

          <Text style={s.label}>{t('checkin.kicker')}</Text>
          <Text style={s.title}>{t('checkin.title')}</Text>
          <Text style={s.subtitle}>{t('checkin.subtitle')}</Text>

          {hasToday && (
            <View style={s.alreadyBox}>
              <Text style={s.alreadyTxt}>{t('checkin.alreadyToday')}</Text>
            </View>
          )}

          <View style={s.section}>
            <EmojiScale value={emoji} onChange={setEmoji} disabled={submitting} labelMap={emojiLabelMap} />
          </View>

          <Text style={s.fieldLabel}>{t('checkin.noteLabel')}</Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder={t('checkin.notePlaceholder')}
            placeholderTextColor={C.textSoft}
            style={s.input}
            multiline
            maxLength={140}
            editable={!submitting}
          />
          <Text style={s.counter}>{note.length} / 140</Text>

          <PillButton
            label={t('checkin.save')}
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
  adaptClose: { alignSelf: 'flex-end', width: 34, height: 34, borderRadius: 17, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center', marginTop: Sp.sm, marginBottom: Sp.md },
  adaptCloseTxt: { fontSize: 14, color: C.espresso },
  adaptEmoji: { fontSize: 54, textAlign: 'center', marginBottom: 4 },
  adaptMood: { fontSize: 26, fontWeight: '300', color: C.espresso, textAlign: 'center' },
  adaptSaved: { fontSize: 13, color: C.textSoft, textAlign: 'center', marginTop: 4, marginBottom: Sp.xl },
  adaptCard: { backgroundColor: C.espresso, borderRadius: R.lg, padding: Sp.md },
  adaptCardLabel: { fontSize: 10, letterSpacing: 1.6, color: C.copper },
  adaptHeadline: { fontSize: 15, color: C.cream, marginTop: 6, marginBottom: Sp.sm, lineHeight: 21 },
  adaptRow: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 9, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#4A352A' },
  adaptDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.copper },
  adaptStrike: { width: 6, height: 6, borderRadius: 3, borderWidth: 1, borderColor: C.textMid },
  adaptStepTxt: { flex: 1, fontSize: 13, color: C.cream },
  adaptStepSoft: { color: '#7C6456', textDecorationLine: 'line-through' },
  adaptTag: { fontSize: 10, color: C.copper },
  adaptSeeHome: { fontSize: 13, color: C.textSoft, textAlign: 'center', marginTop: Sp.md },
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
