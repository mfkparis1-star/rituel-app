import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from '../../hooks/useTranslation';
import { supabase } from '../../lib/supabase';

const T = {
  bg: '#08080E', surface: '#11111A', border: '#1C1C2E',
  accent: '#C9A96E', rose: '#E87FAC', text: '#F5F0F8',
  textMid: '#B8B0C4', textSoft: '#6B6278',
};

export default function OnboardingScreen() {
  const { t, lang } = useTranslation();
  const [step, setStep] = useState(0);
  const [skinType, setSkinType] = useState('');
  const [concerns, setConcerns] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const SKIN_TYPES = [
    { id: 'dry', label: lang === 'fr' ? 'Sèche' : 'Dry', emoji: '🌵', desc: lang === 'fr' ? 'Tiraillements, manque d\'éclat' : 'Tightness, lack of radiance' },
    { id: 'oily', label: lang === 'fr' ? 'Grasse' : 'Oily', emoji: '✨', desc: lang === 'fr' ? 'Brillances, pores dilatés' : 'Shine, enlarged pores' },
    { id: 'combination', label: lang === 'fr' ? 'Mixte' : 'Combination', emoji: '⚖️', desc: lang === 'fr' ? 'Zone T grasse, joues sèches' : 'Oily T-zone, dry cheeks' },
    { id: 'normal', label: lang === 'fr' ? 'Normale' : 'Normal', emoji: '🌸', desc: lang === 'fr' ? 'Équilibrée, peu de problèmes' : 'Balanced, few issues' },
    { id: 'sensitive', label: lang === 'fr' ? 'Sensible' : 'Sensitive', emoji: '🌿', desc: lang === 'fr' ? 'Réactive, rougeurs fréquentes' : 'Reactive, frequent redness' },
  ];

  const CONCERNS = [
    { id: 'hydration', label: lang === 'fr' ? 'Hydratation' : 'Hydration', emoji: '💧' },
    { id: 'anti_age', label: lang === 'fr' ? 'Anti-âge' : 'Anti-aging', emoji: '⏰' },
    { id: 'acne', label: lang === 'fr' ? 'Acné' : 'Acne', emoji: '🎯' },
    { id: 'brightness', label: lang === 'fr' ? 'Éclat' : 'Radiance', emoji: '☀️' },
    { id: 'pores', label: lang === 'fr' ? 'Pores' : 'Pores', emoji: '🔍' },
    { id: 'sensitivity', label: lang === 'fr' ? 'Rougeurs' : 'Redness', emoji: '🌹' },
  ];

  const toggleConcern = (id: string) => {
    setConcerns(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  };

  const handleFinish = async () => {
    setSaving(true);
    const { data } = await supabase.auth.getSession();
    const userId = data.session?.user?.id;
    if (userId) {
      await supabase.from('profiles').upsert({ id: userId, skin_type: skinType });
    }
    setSaving(false);
    router.replace('/');
  };

  const slides = [
    {
      emoji: '✦',
      title: t.onboarding.welcome_title,
      sub: t.onboarding.welcome_sub,
      content: null,
    },
    {
      emoji: '🌸',
      title: t.onboarding.skin_title,
      sub: t.onboarding.skin_sub,
      content: (
        <View style={styles.options}>
          {SKIN_TYPES.map(s => (
            <TouchableOpacity key={s.id} onPress={() => setSkinType(s.id)} style={[styles.optionCard, skinType === s.id && styles.optionCardActive]}>
              <Text style={styles.optionEmoji}>{s.emoji}</Text>
              <View style={styles.optionInfo}>
                <Text style={[styles.optionLabel, skinType === s.id && styles.optionLabelActive]}>{s.label}</Text>
                <Text style={styles.optionDesc}>{s.desc}</Text>
              </View>
              {skinType === s.id && <Text style={styles.check}>✓</Text>}
            </TouchableOpacity>
          ))}
        </View>
      ),
    },
    {
      emoji: '🎯',
      title: t.onboarding.concerns_title,
      sub: t.onboarding.concerns_sub,
      content: (
        <View style={styles.chips}>
          {CONCERNS.map(c => (
            <TouchableOpacity key={c.id} onPress={() => toggleConcern(c.id)} style={[styles.chip, concerns.includes(c.id) && styles.chipActive]}>
              <Text style={styles.chipEmoji}>{c.emoji}</Text>
              <Text style={[styles.chipLabel, concerns.includes(c.id) && styles.chipLabelActive]}>{c.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ),
    },
    {
      emoji: '🎉',
      title: t.onboarding.ready_title,
      sub: t.onboarding.ready_sub,
      content: (
        <View style={styles.readyBox}>
          <Text style={styles.readyItem}>🗂 {lang === 'fr' ? 'Archivez vos produits' : 'Archive your products'}</Text>
          <Text style={styles.readyItem}>✦ {lang === 'fr' ? 'Créez votre routine' : 'Build your routine'}</Text>
          <Text style={styles.readyItem}>👥 {lang === 'fr' ? 'Rejoignez la communauté' : 'Join the community'}</Text>
        </View>
      ),
    },
  ];

  const s = slides[step];
  const isLast = step === slides.length - 1;
  const canNext = step === 0 || step === 2 || (step === 1 && skinType !== '') || isLast;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.progress}>
        {slides.map((_, i) => (
          <View key={i} style={[styles.dot, i === step && styles.dotActive, i < step && styles.dotDone]} />
        ))}
      </View>

      <View style={styles.slide}>
        <Text style={styles.emoji}>{s.emoji}</Text>
        <Text style={styles.title}>{s.title}</Text>
        <Text style={styles.sub}>{s.sub}</Text>
      </View>

      {s.content}

      <View style={styles.btns}>
        {step > 0 && (
          <TouchableOpacity style={styles.backBtn} onPress={() => setStep(p => p - 1)}>
            <Text style={styles.backBtnText}>{t.onboarding.back}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.nextBtn, !canNext && styles.nextBtnDisabled]}
          onPress={() => isLast ? handleFinish() : setStep(p => p + 1)}
          disabled={!canNext || saving}
        >
          <Text style={styles.nextBtnText}>
            {saving ? '...' : isLast ? t.onboarding.start : t.onboarding.continue}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  content: { padding: 24, paddingTop: 60, paddingBottom: 40 },
  progress: { flexDirection: 'row', gap: 8, marginBottom: 40, justifyContent: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: T.border },
  dotActive: { width: 24, backgroundColor: T.accent },
  dotDone: { backgroundColor: T.accent, opacity: 0.4 },
  slide: { alignItems: 'center', marginBottom: 32 },
  emoji: { fontSize: 56, marginBottom: 16 },
  title: { fontSize: 26, fontWeight: '700', color: T.text, textAlign: 'center', marginBottom: 10 },
  sub: { fontSize: 14, color: T.textSoft, textAlign: 'center', lineHeight: 22 },
  options: { gap: 10, marginBottom: 24 },
  optionCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: T.surface, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: T.border },
  optionCardActive: { borderColor: T.accent, backgroundColor: 'rgba(201,169,110,0.08)' },
  optionEmoji: { fontSize: 24 },
  optionInfo: { flex: 1 },
  optionLabel: { fontSize: 14, fontWeight: '600', color: T.text, marginBottom: 2 },
  optionLabelActive: { color: T.accent },
  optionDesc: { fontSize: 11, color: T.textSoft },
  check: { fontSize: 16, color: T.accent, fontWeight: '700' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, backgroundColor: T.surface, borderWidth: 1, borderColor: T.border },
  chipActive: { backgroundColor: 'rgba(201,169,110,0.12)', borderColor: T.accent },
  chipEmoji: { fontSize: 16 },
  chipLabel: { fontSize: 13, color: T.textSoft, fontWeight: '500' },
  chipLabelActive: { color: T.accent },
  readyBox: { backgroundColor: T.surface, borderRadius: 18, padding: 24, gap: 14, marginBottom: 24, borderWidth: 1, borderColor: T.border },
  readyItem: { fontSize: 15, color: T.text, fontWeight: '500' },
  btns: { flexDirection: 'row', gap: 10, marginTop: 8 },
  backBtn: { padding: 14, borderRadius: 12, borderWidth: 1, borderColor: T.border, alignItems: 'center', flex: 1 },
  backBtnText: { fontSize: 14, color: T.textSoft },
  nextBtn: { flex: 2, backgroundColor: T.accent, borderRadius: 14, padding: 16, alignItems: 'center' },
  nextBtnDisabled: { opacity: 0.4 },
  nextBtnText: { fontSize: 15, fontWeight: '700', color: '#1A1208' },
});