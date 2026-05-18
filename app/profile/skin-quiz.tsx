/**
 * Phase 17E — Optional Skin Profile Quiz.
 *
 * 6-question soft quiz, accessible from Profile only. NEVER forced on
 * onboarding. Result writes to profiles.memory.skin_profile (no DB
 * migration — schema-less JSONB).
 *
 * Tone:
 *   - Cream gradient, italic copper accents.
 *   - Observe, don't judge ("Comment se sent ta peau ?", not
 *     "Quel est ton problème ?").
 *   - "Sauter cette question" available on every page.
 *   - No coaching, no diagnostic, no medical claims.
 *   - Final summary is sober and short — no "Top du top" energy.
 *
 * Downstream effect: utils/reflection.ts reads skin_profile in
 * buildPrompt for richer personalized output (Phase 17D).
 */
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PillButton from '../../components/ui/PillButton';
import { supabase } from '../../lib/supabase';
import { useMemory } from '../../hooks/useMemory';
import { safeBack } from '../../utils/safeBack';
import { C, R, Sh, Sp } from '../../theme';

type Choice = { id: string; label: string };

type Question = {
  id: keyof Answers;
  label: string;
  hint?: string;
  kind: 'single' | 'multi' | 'text';
  choices?: Choice[];
  maxPicks?: number;
};

type Answers = {
  skin_type?: string;
  concerns?: string[];
  sensitivity?: string;
  routine_level?: string;
  self_note?: string;
  goal?: string;
};

const QUESTIONS: Question[] = [
  {
    id: 'skin_type',
    label: 'Comment décrirais-tu ta peau au quotidien ?',
    hint: 'Aucune réponse n\'est mauvaise.',
    kind: 'single',
    choices: [
      { id: 'sec', label: 'Plutôt sèche' },
      { id: 'mixte', label: 'Mixte' },
      { id: 'gras', label: 'Plutôt grasse' },
      { id: 'normal', label: 'Normale' },
      { id: 'sensible', label: 'Sensible' },
      { id: 'unknown', label: 'Je ne sais pas' },
    ],
  },
  {
    id: 'concerns',
    label: 'Qu\'est-ce qui retient ton attention en ce moment ?',
    hint: 'Jusqu\'à 3 choix · Facultatif',
    kind: 'multi',
    maxPicks: 3,
    choices: [
      { id: 'rougeurs', label: 'Rougeurs' },
      { id: 'secheresse', label: 'Sécheresse' },
      { id: 'brillance', label: 'Brillance' },
      { id: 'imperfections', label: 'Imperfections' },
      { id: 'taches', label: 'Taches' },
      { id: 'sensibilite', label: 'Sensibilité' },
      { id: 'fatigue', label: 'Fatigue' },
      { id: 'unknown', label: 'Rien en particulier' },
    ],
  },
  {
    id: 'sensitivity',
    label: 'Ta peau réagit-elle facilement ?',
    hint: 'Aux changements de produit, climat, stress.',
    kind: 'single',
    choices: [
      { id: 'souvent', label: 'Souvent' },
      { id: 'parfois', label: 'Parfois' },
      { id: 'rarement', label: 'Rarement' },
      { id: 'unknown', label: 'Je ne sais pas' },
    ],
  },
  {
    id: 'routine_level',
    label: 'À quoi ressemble ta routine actuelle ?',
    kind: 'single',
    choices: [
      { id: 'basique', label: 'Simple — nettoyant + hydratant' },
      { id: 'intermediaire', label: 'Intermédiaire — quelques actifs' },
      { id: 'avancee', label: 'Riche — plusieurs étapes' },
      { id: 'aucune', label: 'Pas vraiment de routine' },
    ],
  },
  {
    id: 'goal',
    label: 'Qu\'aimerais-tu offrir à ta peau ce mois-ci ?',
    hint: 'Pas d\'objectif chiffré, juste une intention.',
    kind: 'single',
    choices: [
      { id: 'hydratation', label: 'Plus d\'hydratation' },
      { id: 'eclat', label: 'De l\'éclat' },
      { id: 'apaisement', label: 'De l\'apaisement' },
      { id: 'equilibre', label: 'De l\'équilibre' },
      { id: 'aucun', label: 'Rien de particulier' },
    ],
  },
  {
    id: 'self_note',
    label: 'Une note pour toi-même ?',
    hint: 'Facultatif · 140 caractères',
    kind: 'text',
  },
];

const MAX_NOTE = 140;

export default function SkinQuizScreen() {
  const { memory, patch, loading: memLoading } = useMemory();
  const [stepIdx, setStepIdx] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [submitting, setSubmitting] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  // Pre-fill from existing skin_profile if present (re-take case)
  useEffect(() => {
    if (memLoading) return;
    const sp = memory?.skin_profile;
    if (!sp) return;
    setAnswers({
      skin_type: sp.skin_type,
      concerns: sp.concerns,
      sensitivity: sp.sensitivity,
      routine_level: sp.routine_level,
      self_note: sp.self_note,
      goal: sp.goal,
    });
  }, [memory, memLoading]);

  const totalSteps = QUESTIONS.length;
  const current = QUESTIONS[stepIdx];
  const progress = (stepIdx + 1) / totalSteps;

  const handleAnswer = (val: string | string[]) => {
    setAnswers((prev) => ({ ...prev, [current.id]: val }));
  };

  const handleNext = () => {
    if (stepIdx + 1 < totalSteps) {
      setStepIdx(stepIdx + 1);
    } else {
      setShowSummary(true);
    }
  };

  const handleSkip = () => {
    setAnswers((prev) => {
      const next = { ...prev };
      delete (next as any)[current.id];
      return next;
    });
    handleNext();
  };

  const handleBack = () => {
    if (stepIdx > 0) setStepIdx(stepIdx - 1);
  };

  const handleSave = async () => {
    setSubmitting(true);
    const clean: Answers = {};
    if (answers.skin_type) clean.skin_type = answers.skin_type;
    if (answers.concerns && answers.concerns.length > 0) clean.concerns = answers.concerns;
    if (answers.sensitivity) clean.sensitivity = answers.sensitivity;
    if (answers.routine_level) clean.routine_level = answers.routine_level;
    if (answers.goal) clean.goal = answers.goal;
    if (answers.self_note && answers.self_note.trim()) clean.self_note = answers.self_note.trim();

    await patch({
      skin_profile: {
        ...clean,
        completed_at: new Date().toISOString(),
      },
    });
    setSubmitting(false);
    safeBack('/(tabs)/auth');
  };

  const handleExit = () => {
    safeBack('/(tabs)/auth');
  };

  // ----- Summary view -----
  if (showSummary) {
    const summary = answers;
    const items: { label: string; value: string }[] = [];
    const labelFor = (qid: keyof Answers, choiceId?: string): string => {
      if (!choiceId) return '—';
      const q = QUESTIONS.find((x) => x.id === qid);
      const c = q?.choices?.find((c) => c.id === choiceId);
      return c?.label ?? choiceId;
    };
    if (summary.skin_type) items.push({ label: 'Type de peau', value: labelFor('skin_type', summary.skin_type) });
    if (summary.concerns && summary.concerns.length > 0) {
      items.push({
        label: 'Attention',
        value: summary.concerns.map((c) => labelFor('concerns', c)).join(' · '),
      });
    }
    if (summary.sensitivity) items.push({ label: 'Sensibilité', value: labelFor('sensitivity', summary.sensitivity) });
    if (summary.routine_level) items.push({ label: 'Routine', value: labelFor('routine_level', summary.routine_level) });
    if (summary.goal) items.push({ label: 'Intention', value: labelFor('goal', summary.goal) });

    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.summaryHeader}>
          <Pressable onPress={() => setShowSummary(false)} hitSlop={10} style={s.backBtn}>
            <Text style={s.backTxt}>‹</Text>
          </Pressable>
          <View style={{ flex: 1 }} />
        </View>

        <ScrollView contentContainerStyle={s.summaryScroll} showsVerticalScrollIndicator={false}>
          <Text style={s.summaryKicker}>VOICI TON PROFIL</Text>
          <Text style={s.summaryTitle}>Une note sur ta peau, telle qu\'elle est aujourd\'hui.</Text>
          <Text style={s.summarySub}>
            Rituel s\'en souvient pour t\'accompagner avec plus de douceur. Tu peux le mettre à jour quand tu veux.
          </Text>

          <View style={s.summaryCard}>
            {items.length === 0 ? (
              <Text style={s.summaryEmpty}>Tu as préféré passer toutes les questions. C\'est aussi un choix.</Text>
            ) : (
              items.map((it) => (
                <View key={it.label} style={s.summaryRow}>
                  <Text style={s.summaryRowLabel}>{it.label}</Text>
                  <Text style={s.summaryRowValue}>{it.value}</Text>
                </View>
              ))
            )}
            {summary.self_note ? (
              <View style={s.summaryNote}>
                <Text style={s.summaryNoteLabel}>NOTE</Text>
                <Text style={s.summaryNoteValue}>"{summary.self_note}"</Text>
              </View>
            ) : null}
          </View>

          <PillButton
            label={submitting ? 'Un instant…' : 'Sauvegarder'}
            variant="primary"
            fullWidth
            disabled={submitting}
            onPress={handleSave}
            style={{ marginTop: Sp.lg }}
          />
          <Pressable onPress={handleExit} hitSlop={6} style={s.summaryCancel}>
            <Text style={s.summaryCancelTxt}>Plus tard</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ----- Question view -----
  const currentVal = answers[current.id];

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <Pressable
          onPress={stepIdx > 0 ? handleBack : handleExit}
          hitSlop={10}
          style={s.backBtn}
        >
          <Text style={s.backTxt}>{stepIdx > 0 ? '‹' : '×'}</Text>
        </Pressable>
        <View style={s.progressTrack}>
          <View style={[s.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        <Pressable onPress={handleSkip} hitSlop={10} style={s.skipBtn}>
          <Text style={s.skipTxt}>Sauter</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.kicker}>Question {stepIdx + 1} / {totalSteps}</Text>
        <Text style={s.questionTitle}>{current.label}</Text>
        {current.hint ? <Text style={s.questionHint}>{current.hint}</Text> : null}

        {current.kind === 'text' ? (
          <View style={s.textBox}>
            <TextInput
              value={(currentVal as string) ?? ''}
              onChangeText={(t) => {
                if (t.length <= MAX_NOTE) handleAnswer(t);
              }}
              placeholder="Optionnel, juste pour toi…"
              placeholderTextColor="#A99583"
              multiline
              style={s.textInput}
            />
            <Text style={s.counter}>
              {((currentVal as string) ?? '').length} / {MAX_NOTE}
            </Text>
          </View>
        ) : current.kind === 'single' ? (
          <View style={s.choicesWrap}>
            {(current.choices ?? []).map((c) => {
              const active = currentVal === c.id;
              return (
                <Pressable
                  key={c.id}
                  onPress={() => handleAnswer(c.id)}
                  style={[s.choiceCard, active && s.choiceCardActive]}
                  hitSlop={4}
                >
                  <Text style={[s.choiceTxt, active && s.choiceTxtActive]}>{c.label}</Text>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <View style={s.choicesWrap}>
            {(current.choices ?? []).map((c) => {
              const arr = (currentVal as string[]) ?? [];
              const active = arr.includes(c.id);
              const max = current.maxPicks ?? 3;
              return (
                <Pressable
                  key={c.id}
                  onPress={() => {
                    const cur = arr.slice();
                    const idx = cur.indexOf(c.id);
                    if (idx >= 0) {
                      cur.splice(idx, 1);
                    } else if (cur.length < max) {
                      cur.push(c.id);
                    }
                    handleAnswer(cur);
                  }}
                  style={[s.choiceCard, active && s.choiceCardActive]}
                  hitSlop={4}
                >
                  <Text style={[s.choiceTxt, active && s.choiceTxtActive]}>{c.label}</Text>
                </Pressable>
              );
            })}
          </View>
        )}

        <PillButton
          label={stepIdx + 1 === totalSteps ? 'Terminer' : 'Continuer'}
          variant="primary"
          fullWidth
          onPress={handleNext}
          style={{ marginTop: Sp.lg }}
        />
        <View style={{ height: Sp.huge }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FBF6F1' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Sp.md,
    paddingVertical: Sp.sm,
    gap: Sp.sm,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backTxt: { fontSize: 24, color: C.copper, fontWeight: '300', marginTop: -2 },
  progressTrack: {
    flex: 1,
    height: 3,
    backgroundColor: '#EFE6D7',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: C.copper,
  },
  skipBtn: { paddingHorizontal: Sp.sm, paddingVertical: 6 },
  skipTxt: { fontSize: 12, color: '#A99583', fontStyle: 'italic', letterSpacing: 0.3 },

  // Body
  scroll: { paddingHorizontal: Sp.lg, paddingTop: Sp.lg },
  kicker: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    color: C.copper,
    marginBottom: 14,
  },
  questionTitle: {
    fontSize: 22,
    fontWeight: '500',
    color: '#3A2E25',
    lineHeight: 30,
    letterSpacing: 0.2,
    marginBottom: 8,
  },
  questionHint: {
    fontSize: 13,
    fontStyle: 'italic',
    color: '#7A6555',
    marginBottom: Sp.lg,
    letterSpacing: 0.2,
    lineHeight: 19,
  },

  // Choices
  choicesWrap: { gap: 10 },
  choiceCard: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFE6D7',
  },
  choiceCardActive: {
    backgroundColor: '#FFFFFF',
    borderColor: C.copper,
    borderWidth: 2,
  },
  choiceTxt: {
    fontSize: 14,
    color: '#3A2E25',
    letterSpacing: 0.2,
  },
  choiceTxtActive: {
    color: C.copper,
    fontWeight: '500',
  },

  // Text input
  textBox: { marginTop: 4 },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EFE6D7',
    padding: 16,
    minHeight: 110,
    fontSize: 14,
    color: '#3A2E25',
    textAlignVertical: 'top',
    lineHeight: 20,
  },
  counter: {
    fontSize: 11,
    color: '#A99583',
    textAlign: 'right',
    marginTop: 6,
    fontStyle: 'italic',
  },

  // Summary
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Sp.md,
    paddingVertical: Sp.sm,
  },
  summaryScroll: {
    paddingHorizontal: Sp.lg,
    paddingTop: Sp.md,
    paddingBottom: Sp.huge,
  },
  summaryKicker: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    color: C.copper,
    marginBottom: 14,
  },
  summaryTitle: {
    fontSize: 22,
    fontWeight: '500',
    fontStyle: 'italic',
    color: '#3A2E25',
    lineHeight: 30,
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  summarySub: {
    fontSize: 13,
    color: '#7A6555',
    lineHeight: 20,
    marginBottom: Sp.lg,
    letterSpacing: 0.2,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: Sp.lg,
    borderWidth: 1,
    borderColor: '#EFE6D7',
  },
  summaryEmpty: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#7A6555',
    lineHeight: 22,
    textAlign: 'center',
  },
  summaryRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F2EAD9',
  },
  summaryRowLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: C.copper,
    marginBottom: 4,
  },
  summaryRowValue: {
    fontSize: 14,
    color: '#3A2E25',
    lineHeight: 20,
  },
  summaryNote: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F2EAD9',
  },
  summaryNoteLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: C.copper,
    marginBottom: 6,
  },
  summaryNoteValue: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#3A2E25',
    lineHeight: 21,
  },
  summaryCancel: {
    alignSelf: 'center',
    marginTop: 14,
    paddingVertical: 8,
  },
  summaryCancelTxt: {
    fontSize: 13,
    fontStyle: 'italic',
    color: '#A99583',
    letterSpacing: 0.3,
  },
});
