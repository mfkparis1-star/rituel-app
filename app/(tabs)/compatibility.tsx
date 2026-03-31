import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTranslation } from '../../hooks/useTranslation';

const T = {
  bg: '#08080E', surface: '#11111A', border: '#1C1C2E',
  accent: '#C9A96E', rose: '#E87FAC', text: '#F5F0F8',
  textMid: '#B8B0C4', textSoft: '#6B6278',
};

type CompatResult = {
  status: 'ok' | 'warning' | 'avoid';
  title_fr: string; title_en: string;
  explanation_fr: string; explanation_en: string;
  tip_fr: string; tip_en: string;
};

const COMBINATIONS: Record<string, CompatResult> = {
  'niacinamide+vitamin c': { status: 'warning', title_fr: 'Utilisation déconseillée ensemble', title_en: 'Not recommended together', explanation_fr: 'La niacinamide et la vitamine C peuvent se neutraliser mutuellement.', explanation_en: 'Niacinamide and vitamin C can neutralize each other and reduce their effectiveness.', tip_fr: 'Utilisez la vitamine C le matin et la niacinamide le soir.', tip_en: 'Use vitamin C in the morning and niacinamide in the evening.' },
  'vitamin c+niacinamide': { status: 'warning', title_fr: 'Utilisation déconseillée ensemble', title_en: 'Not recommended together', explanation_fr: 'La niacinamide et la vitamine C peuvent se neutraliser mutuellement.', explanation_en: 'Niacinamide and vitamin C can neutralize each other.', tip_fr: 'Utilisez la vitamine C le matin et la niacinamide le soir.', tip_en: 'Use vitamin C in the morning and niacinamide in the evening.' },
  'retinol+aha': { status: 'avoid', title_fr: 'À éviter absolument', title_en: 'Absolutely avoid', explanation_fr: 'La combinaison de rétinol et d\'AHA peut provoquer des irritations sévères.', explanation_en: 'Combining retinol and AHA can cause severe irritation and peeling.', tip_fr: 'Alternez les soirs : rétinol un soir, AHA le suivant.', tip_en: 'Alternate evenings: retinol one night, AHA the next.' },
  'aha+retinol': { status: 'avoid', title_fr: 'À éviter absolument', title_en: 'Absolutely avoid', explanation_fr: 'La combinaison de rétinol et d\'AHA peut provoquer des irritations sévères.', explanation_en: 'Combining retinol and AHA can cause severe irritation.', tip_fr: 'Alternez les soirs : rétinol un soir, AHA le suivant.', tip_en: 'Alternate evenings: retinol one night, AHA the next.' },
  'retinol+bha': { status: 'avoid', title_fr: 'À éviter absolument', title_en: 'Absolutely avoid', explanation_fr: 'Le rétinol et le BHA combinés peuvent irriter fortement.', explanation_en: 'Retinol and BHA combined can strongly irritate skin.', tip_fr: 'Utilisez le BHA le matin et le rétinol le soir.', tip_en: 'Use BHA in the morning and retinol in the evening.' },
  'bha+retinol': { status: 'avoid', title_fr: 'À éviter absolument', title_en: 'Absolutely avoid', explanation_fr: 'Le rétinol et le BHA combinés peuvent irriter fortement.', explanation_en: 'Retinol and BHA combined can strongly irritate skin.', tip_fr: 'Utilisez le BHA le matin et le rétinol le soir.', tip_en: 'Use BHA in the morning and retinol in the evening.' },
  'vitamin c+spf': { status: 'ok', title_fr: 'Combinaison parfaite! ✨', title_en: 'Perfect combination! ✨', explanation_fr: 'La vitamine C booste l\'efficacité du SPF et offre une double protection.', explanation_en: 'Vitamin C boosts SPF effectiveness and provides double antioxidant protection.', tip_fr: 'Appliquez la vitamine C en premier, puis le SPF.', tip_en: 'Apply vitamin C first, let it absorb, then apply SPF.' },
  'spf+vitamin c': { status: 'ok', title_fr: 'Combinaison parfaite! ✨', title_en: 'Perfect combination! ✨', explanation_fr: 'La vitamine C booste l\'efficacité du SPF.', explanation_en: 'Vitamin C boosts SPF effectiveness.', tip_fr: 'Appliquez la vitamine C en premier, puis le SPF.', tip_en: 'Apply vitamin C first, then SPF.' },
  'niacinamide+hyaluronic acid': { status: 'ok', title_fr: 'Duo idéal! 💧', title_en: 'Ideal duo! 💧', explanation_fr: 'La niacinamide et l\'acide hyaluronique hydratent et apaisent ensemble.', explanation_en: 'Niacinamide and hyaluronic acid together hydrate and soothe skin.', tip_fr: 'Appliquez l\'acide hyaluronique sur peau humide, puis la niacinamide.', tip_en: 'Apply hyaluronic acid on damp skin, then niacinamide.' },
  'hyaluronic acid+niacinamide': { status: 'ok', title_fr: 'Duo idéal! 💧', title_en: 'Ideal duo! 💧', explanation_fr: 'La niacinamide et l\'acide hyaluronique hydratent et apaisent ensemble.', explanation_en: 'Niacinamide and hyaluronic acid together hydrate and soothe skin.', tip_fr: 'Appliquez l\'acide hyaluronique sur peau humide, puis la niacinamide.', tip_en: 'Apply hyaluronic acid on damp skin, then niacinamide.' },
  'retinol+hyaluronic acid': { status: 'ok', title_fr: 'Combinaison recommandée', title_en: 'Recommended combination', explanation_fr: 'L\'acide hyaluronique contrebalance les effets asséchants du rétinol.', explanation_en: 'Hyaluronic acid counterbalances the drying effects of retinol.', tip_fr: 'Appliquez l\'acide hyaluronique après le rétinol.', tip_en: 'Apply hyaluronic acid after retinol to reduce irritation.' },
  'hyaluronic acid+retinol': { status: 'ok', title_fr: 'Combinaison recommandée', title_en: 'Recommended combination', explanation_fr: 'L\'acide hyaluronique contrebalance les effets asséchants du rétinol.', explanation_en: 'Hyaluronic acid counterbalances the drying effects of retinol.', tip_fr: 'Appliquez l\'acide hyaluronique après le rétinol.', tip_en: 'Apply hyaluronic acid after retinol.' },
  'niacinamide+retinol': { status: 'ok', title_fr: 'Excellent duo anti-âge! ✨', title_en: 'Excellent anti-aging duo! ✨', explanation_fr: 'La niacinamide aide à réduire les irritations causées par le rétinol.', explanation_en: 'Niacinamide helps reduce irritation caused by retinol while boosting its effects.', tip_fr: 'Appliquez la niacinamide en premier, puis le rétinol.', tip_en: 'Apply niacinamide first, wait 5 minutes, then retinol.' },
  'retinol+niacinamide': { status: 'ok', title_fr: 'Excellent duo anti-âge! ✨', title_en: 'Excellent anti-aging duo! ✨', explanation_fr: 'La niacinamide aide à réduire les irritations causées par le rétinol.', explanation_en: 'Niacinamide helps reduce irritation caused by retinol.', tip_fr: 'Appliquez la niacinamide en premier, puis le rétinol.', tip_en: 'Apply niacinamide first, then retinol.' },
  'vitamin c+retinol': { status: 'warning', title_fr: 'Mieux séparés', title_en: 'Better separated', explanation_fr: 'La vitamine C et le rétinol ont des pH différents et peuvent s\'inactiver.', explanation_en: 'Vitamin C and retinol have different pH levels and can inactivate each other.', tip_fr: 'Vitamine C le matin, rétinol le soir.', tip_en: 'Vitamin C in the morning, retinol in the evening.' },
  'retinol+vitamin c': { status: 'warning', title_fr: 'Mieux séparés', title_en: 'Better separated', explanation_fr: 'La vitamine C et le rétinol ont des pH différents.', explanation_en: 'Vitamin C and retinol have different pH levels.', tip_fr: 'Vitamine C le matin, rétinol le soir.', tip_en: 'Vitamin C in the morning, retinol in the evening.' },
  'hyaluronic acid+spf': { status: 'ok', title_fr: 'Routine matin parfaite! ☀️', title_en: 'Perfect morning routine! ☀️', explanation_fr: 'L\'acide hyaluronique et le SPF forment une base hydratante et protectrice.', explanation_en: 'Hyaluronic acid and SPF form an ideal hydrating and protective base.', tip_fr: 'Appliquez l\'acide hyaluronique sur peau humide, puis le SPF.', tip_en: 'Apply hyaluronic acid on damp skin, then SPF.' },
  'spf+hyaluronic acid': { status: 'ok', title_fr: 'Routine matin parfaite! ☀️', title_en: 'Perfect morning routine! ☀️', explanation_fr: 'L\'acide hyaluronique et le SPF forment une base hydratante et protectrice.', explanation_en: 'Hyaluronic acid and SPF form an ideal base.', tip_fr: 'Appliquez l\'acide hyaluronique sur peau humide, puis le SPF.', tip_en: 'Apply hyaluronic acid on damp skin, then SPF.' },
};

const INGREDIENTS_FR = ['Niacinamide', 'Vitamin C', 'Rétinol', 'AHA', 'BHA', 'Acide Hyaluronique', 'SPF', 'Caféine', 'Peptides', 'Céramides'];
const INGREDIENTS_EN = ['Niacinamide', 'Vitamin C', 'Retinol', 'AHA', 'BHA', 'Hyaluronic Acid', 'SPF', 'Caffeine', 'Peptides', 'Ceramides'];
const INGREDIENTS_KEY = ['niacinamide', 'vitamin c', 'retinol', 'aha', 'bha', 'hyaluronic acid', 'spf', 'caffeine', 'peptides', 'ceramides'];

const STATUS_COLORS = { ok: '#52DBA8', warning: '#F5A623', avoid: '#FF5272' };
const STATUS_ICONS = { ok: '✅', warning: '⚠️', avoid: '🚫' };

export default function CompatibilityScreen() {
  const { t, lang } = useTranslation();
  const [ingredient1, setIngredient1] = useState('');
  const [ingredient1Key, setIngredient1Key] = useState('');
  const [ingredient2, setIngredient2] = useState('');
  const [ingredient2Key, setIngredient2Key] = useState('');
  const [result, setResult] = useState<CompatResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  const INGREDIENTS = lang === 'fr' ? INGREDIENTS_FR : INGREDIENTS_EN;

  const checkCompatibility = (key1 = ingredient1Key, key2 = ingredient2Key) => {
    if (!key1 || !key2) return;
    setLoading(true);
    setTimeout(() => {
      const key = `${key1}+${key2}`;
      const found = COMBINATIONS[key];
      if (found) {
        setResult(found);
      } else {
        setResult({
          status: 'ok',
          title_fr: 'Combinaison généralement sûre',
          title_en: 'Generally safe combination',
          explanation_fr: `Nous n'avons pas de données spécifiques sur ${ingredient1} + ${ingredient2}, mais aucune interaction négative connue.`,
          explanation_en: `We don't have specific data on ${ingredient1} + ${ingredient2}, but no known negative interactions.`,
          tip_fr: 'Testez sur une petite zone et observez pendant 48h.',
          tip_en: 'Test on a small area and observe for 48 hours.',
        });
      }
      setLoading(false);
    }, 800);
  };

  const reset = () => {
    setIngredient1(''); setIngredient1Key('');
    setIngredient2(''); setIngredient2Key('');
    setResult(null); setStep(1);
  };

  const selectIngredient = (label: string, idx: number) => {
    const key = INGREDIENTS_KEY[idx];
    if (step === 1) {
      setIngredient1(label); setIngredient1Key(key); setStep(2);
    } else {
      if (key === ingredient1Key) return;
      setIngredient2(label); setIngredient2Key(key);
    }
  };

  const POPULAR = [
    { a: lang === 'fr' ? 'Vitamin C' : 'Vitamin C', b: 'SPF', ka: 'vitamin c', kb: 'spf' },
    { a: 'Niacinamide', b: lang === 'fr' ? 'Rétinol' : 'Retinol', ka: 'niacinamide', kb: 'retinol' },
    { a: lang === 'fr' ? 'Acide Hyaluronique' : 'Hyaluronic Acid', b: 'SPF', ka: 'hyaluronic acid', kb: 'spf' },
    { a: lang === 'fr' ? 'Rétinol' : 'Retinol', b: 'AHA', ka: 'retinol', kb: 'aha' },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t.compatibility.title}</Text>
        <Text style={styles.sub}>{t.compatibility.sub}</Text>
      </View>

      {!result ? (
        <>
          <View style={styles.selectionRow}>
            <View style={[styles.selectionBox, ingredient1 && styles.selectionBoxFilled]}>
              {ingredient1 ? (
                <>
                  <Text style={styles.selectionBoxLabel}>{t.compatibility.ingredient1}</Text>
                  <Text style={styles.selectionBoxValue}>{ingredient1}</Text>
                </>
              ) : (
                <Text style={styles.selectionBoxPlaceholder}>{t.compatibility.ingredient1}</Text>
              )}
            </View>
            <Text style={styles.plus}>+</Text>
            <View style={[styles.selectionBox, ingredient2 && styles.selectionBoxFilled]}>
              {ingredient2 ? (
                <>
                  <Text style={styles.selectionBoxLabel}>{t.compatibility.ingredient2}</Text>
                  <Text style={styles.selectionBoxValue}>{ingredient2}</Text>
                </>
              ) : (
                <Text style={styles.selectionBoxPlaceholder}>{t.compatibility.ingredient2}</Text>
              )}
            </View>
          </View>

          <Text style={styles.stepHint}>{step === 1 ? t.compatibility.step1 : t.compatibility.step2}</Text>

          <View style={styles.ingredientGrid}>
            {INGREDIENTS.map((ing, idx) => (
              <TouchableOpacity
                key={ing}
                onPress={() => selectIngredient(ing, idx)}
                style={[
                  styles.ingredientChip,
                  ingredient1Key === INGREDIENTS_KEY[idx] && styles.ingredientChipSelected1,
                  ingredient2Key === INGREDIENTS_KEY[idx] && styles.ingredientChipSelected2,
                  step === 2 && INGREDIENTS_KEY[idx] === ingredient1Key && styles.ingredientChipDisabled,
                ]}
                disabled={step === 2 && INGREDIENTS_KEY[idx] === ingredient1Key}
              >
                <Text style={[styles.ingredientChipText, (ingredient1Key === INGREDIENTS_KEY[idx] || ingredient2Key === INGREDIENTS_KEY[idx]) && styles.ingredientChipTextSelected]}>{ing}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.orText}>{lang === 'fr' ? '— ou saisissez manuellement —' : '— or enter manually —'}</Text>
          <View style={styles.manualRow}>
            <TextInput style={[styles.manualInput, { flex: 1 }]} placeholder={t.compatibility.ingredient1} placeholderTextColor={T.textSoft} value={ingredient1} onChangeText={v => { setIngredient1(v); setIngredient1Key(v.toLowerCase()); }} autoCorrect={false} blurOnSubmit={false} />
            <Text style={styles.manualPlus}>+</Text>
            <TextInput style={[styles.manualInput, { flex: 1 }]} placeholder={t.compatibility.ingredient2} placeholderTextColor={T.textSoft} value={ingredient2} onChangeText={v => { setIngredient2(v); setIngredient2Key(v.toLowerCase()); }} autoCorrect={false} blurOnSubmit={false} />
          </View>

          <TouchableOpacity style={[styles.checkBtn, (!ingredient1 || !ingredient2) && styles.checkBtnDisabled]} onPress={() => checkCompatibility()} disabled={!ingredient1 || !ingredient2 || loading}>
            {loading ? <ActivityIndicator color="#1A1208" /> : <Text style={styles.checkBtnText}>{t.compatibility.check_btn}</Text>}
          </TouchableOpacity>

          <Text style={styles.sectionLabel}>{t.compatibility.popular}</Text>
          {POPULAR.map((combo, i) => {
            const r = COMBINATIONS[`${combo.ka}+${combo.kb}`];
            return (
              <TouchableOpacity key={i} onPress={() => {
                setIngredient1(combo.a); setIngredient1Key(combo.ka);
                setIngredient2(combo.b); setIngredient2Key(combo.kb);
                setStep(2);
                const found = COMBINATIONS[`${combo.ka}+${combo.kb}`];
                if (found) setResult(found);
              }} style={styles.comboCard}>
                <Text style={styles.comboText}>{combo.a} + {combo.b}</Text>
                {r && <Text style={{ fontSize: 16 }}>{STATUS_ICONS[r.status]}</Text>}
              </TouchableOpacity>
            );
          })}
        </>
      ) : (
        <>
          <View style={[styles.resultCard, { borderColor: STATUS_COLORS[result.status] }]}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultIcon}>{STATUS_ICONS[result.status]}</Text>
              <View style={styles.resultCombo}>
                <Text style={styles.resultComboText}>{ingredient1}</Text>
                <Text style={styles.resultComboPlus}>+</Text>
                <Text style={styles.resultComboText}>{ingredient2}</Text>
              </View>
            </View>
            <View style={[styles.resultStatus, { backgroundColor: STATUS_COLORS[result.status] + '20', borderColor: STATUS_COLORS[result.status] }]}>
              <Text style={[styles.resultStatusText, { color: STATUS_COLORS[result.status] }]}>{lang === 'fr' ? result.title_fr : result.title_en}</Text>
            </View>
            <Text style={styles.resultExplanation}>{lang === 'fr' ? result.explanation_fr : result.explanation_en}</Text>
            <View style={styles.tipBox}>
              <Text style={styles.tipLabel}>💡 {lang === 'fr' ? 'Conseil' : 'Tip'}</Text>
              <Text style={styles.tipText}>{lang === 'fr' ? result.tip_fr : result.tip_en}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.resetBtn} onPress={reset}>
            <Text style={styles.resetBtnText}>{t.compatibility.reset_btn}</Text>
          </TouchableOpacity>

          <Text style={styles.sectionLabel}>{t.compatibility.popular}</Text>
          {POPULAR.map((combo, i) => {
            const r = COMBINATIONS[`${combo.ka}+${combo.kb}`];
            return (
              <TouchableOpacity key={i} onPress={() => {
                setIngredient1(combo.a); setIngredient1Key(combo.ka);
                setIngredient2(combo.b); setIngredient2Key(combo.kb);
                const found = COMBINATIONS[`${combo.ka}+${combo.kb}`];
                if (found) setResult(found);
              }} style={styles.comboCard}>
                <Text style={styles.comboText}>{combo.a} + {combo.b}</Text>
                {r && <Text style={{ fontSize: 16 }}>{STATUS_ICONS[r.status]}</Text>}
              </TouchableOpacity>
            );
          })}
        </>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg, padding: 20 },
  header: { paddingTop: 60, paddingBottom: 20 },
  title: { fontSize: 26, fontWeight: '700', color: T.text, marginBottom: 4 },
  sub: { fontSize: 12, color: T.textSoft },
  selectionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  selectionBox: { flex: 1, backgroundColor: T.surface, borderRadius: 14, padding: 14, borderWidth: 1.5, borderColor: T.border, minHeight: 60, alignItems: 'center', justifyContent: 'center' },
  selectionBoxFilled: { borderColor: T.accent },
  selectionBoxPlaceholder: { fontSize: 13, color: T.textSoft },
  selectionBoxLabel: { fontSize: 9, color: T.accent, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  selectionBoxValue: { fontSize: 13, fontWeight: '700', color: T.text, textAlign: 'center' },
  plus: { fontSize: 24, color: T.accent, fontWeight: '700' },
  stepHint: { fontSize: 12, color: T.textSoft, textAlign: 'center', marginBottom: 16 },
  ingredientGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  ingredientChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: T.surface, borderWidth: 1, borderColor: T.border },
  ingredientChipSelected1: { backgroundColor: 'rgba(201,169,110,0.2)', borderColor: T.accent },
  ingredientChipSelected2: { backgroundColor: 'rgba(232,127,172,0.2)', borderColor: T.rose },
  ingredientChipDisabled: { opacity: 0.4 },
  ingredientChipText: { fontSize: 12, color: T.textSoft, fontWeight: '500' },
  ingredientChipTextSelected: { color: T.text, fontWeight: '700' },
  orText: { textAlign: 'center', fontSize: 11, color: T.textSoft, marginBottom: 12 },
  manualRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  manualInput: { backgroundColor: T.surface, borderRadius: 12, padding: 12, color: T.text, fontSize: 13, borderWidth: 1, borderColor: T.border },
  manualPlus: { fontSize: 20, color: T.accent, fontWeight: '700' },
  checkBtn: { backgroundColor: T.accent, borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 24 },
  checkBtnDisabled: { opacity: 0.4 },
  checkBtnText: { fontSize: 14, fontWeight: '700', color: '#1A1208' },
  resultCard: { backgroundColor: T.surface, borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 2 },
  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  resultIcon: { fontSize: 36 },
  resultCombo: { flex: 1 },
  resultComboText: { fontSize: 15, fontWeight: '700', color: T.text },
  resultComboPlus: { fontSize: 13, color: T.textSoft, marginVertical: 2 },
  resultStatus: { borderRadius: 12, padding: 12, marginBottom: 14, borderWidth: 1 },
  resultStatusText: { fontSize: 14, fontWeight: '700', textAlign: 'center' },
  resultExplanation: { fontSize: 13, color: T.textMid, lineHeight: 22, marginBottom: 16 },
  tipBox: { backgroundColor: T.bg, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: T.border },
  tipLabel: { fontSize: 12, fontWeight: '700', color: T.accent, marginBottom: 6 },
  tipText: { fontSize: 13, color: T.textMid, lineHeight: 20 },
  resetBtn: { borderWidth: 1, borderColor: T.border, borderRadius: 14, padding: 14, alignItems: 'center', marginBottom: 24 },
  resetBtnText: { fontSize: 14, color: T.textSoft },
  sectionLabel: { fontSize: 10, color: T.textSoft, letterSpacing: 2, marginBottom: 12 },
  comboCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: T.surface, borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: T.border },
  comboText: { fontSize: 13, color: T.text, fontWeight: '500' },
});