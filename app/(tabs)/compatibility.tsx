import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTranslation } from '../../hooks/useTranslation';

const T = {
  bg: '#FDF8F5', bg2: '#F5EDE6', accent: '#B8856A',
  dark: '#1A1310', mid: '#6B5245', light: '#E8D5C8', white: '#FFFFFF',
  green: '#5B9B6B', red: '#C0392B', orange: '#E67E22',
};

type CompatResult = {
  status: 'ok' | 'warning' | 'avoid';
  title_fr: string; title_en: string; title_tr: string;
  explanation_fr: string; explanation_en: string; explanation_tr: string;
  tip_fr: string; tip_en: string; tip_tr: string;
};

const COMBINATIONS: Record<string, CompatResult> = {
  'niacinamide+vitamin c': { status: 'warning', title_fr: 'Utilisation déconseillée ensemble', title_en: 'Not recommended together', title_tr: 'Birlikte önerilmez', explanation_fr: 'La niacinamide et la vitamine C peuvent se neutraliser mutuellement.', explanation_en: 'Niacinamide and vitamin C can neutralize each other.', explanation_tr: 'Niacinamide ve C vitamini birbirini nötrleştirebilir.', tip_fr: 'Utilisez la vitamine C le matin et la niacinamide le soir.', tip_en: 'Use vitamin C in the morning and niacinamide in the evening.', tip_tr: 'C vitaminini sabah, niacinamide\'i akşam kullanın.' },
  'vitamin c+niacinamide': { status: 'warning', title_fr: 'Utilisation déconseillée ensemble', title_en: 'Not recommended together', title_tr: 'Birlikte önerilmez', explanation_fr: 'La niacinamide et la vitamine C peuvent se neutraliser mutuellement.', explanation_en: 'Niacinamide and vitamin C can neutralize each other.', explanation_tr: 'Niacinamide ve C vitamini birbirini nötrleştirebilir.', tip_fr: 'Utilisez la vitamine C le matin et la niacinamide le soir.', tip_en: 'Use vitamin C in the morning and niacinamide in the evening.', tip_tr: 'C vitaminini sabah, niacinamide\'i akşam kullanın.' },
  'retinol+aha': { status: 'avoid', title_fr: 'À éviter absolument', title_en: 'Absolutely avoid', title_tr: 'Kesinlikle kaçının', explanation_fr: 'La combinaison rétinol + AHA peut provoquer des irritations sévères.', explanation_en: 'Retinol + AHA can cause severe irritation.', explanation_tr: 'Retinol + AHA kombinasyonu ciddi tahriş yapabilir.', tip_fr: 'Alternez les soirs : rétinol un soir, AHA le suivant.', tip_en: 'Alternate evenings: retinol one night, AHA the next.', tip_tr: 'Gece gece değiştirin: bir gece retinol, ertesi gece AHA.' },
  'aha+retinol': { status: 'avoid', title_fr: 'À éviter absolument', title_en: 'Absolutely avoid', title_tr: 'Kesinlikle kaçının', explanation_fr: 'La combinaison rétinol + AHA peut provoquer des irritations sévères.', explanation_en: 'Retinol + AHA can cause severe irritation.', explanation_tr: 'Retinol + AHA kombinasyonu ciddi tahriş yapabilir.', tip_fr: 'Alternez les soirs.', tip_en: 'Alternate evenings.', tip_tr: 'Geceleri değiştirin.' },
  'retinol+bha': { status: 'avoid', title_fr: 'À éviter absolument', title_en: 'Absolutely avoid', title_tr: 'Kesinlikle kaçının', explanation_fr: 'Le rétinol et le BHA combinés peuvent irriter fortement.', explanation_en: 'Retinol and BHA combined can strongly irritate skin.', explanation_tr: 'Retinol ve BHA birlikte cildi güçlü şekilde tahriş edebilir.', tip_fr: 'Utilisez le BHA le matin et le rétinol le soir.', tip_en: 'Use BHA in the morning and retinol in the evening.', tip_tr: 'BHA\'yı sabah, retinolü akşam kullanın.' },
  'bha+retinol': { status: 'avoid', title_fr: 'À éviter absolument', title_en: 'Absolutely avoid', title_tr: 'Kesinlikle kaçının', explanation_fr: 'Le rétinol et le BHA combinés peuvent irriter fortement.', explanation_en: 'Retinol and BHA combined can strongly irritate skin.', explanation_tr: 'Retinol ve BHA birlikte cildi tahriş edebilir.', tip_fr: 'BHA le matin, rétinol le soir.', tip_en: 'BHA in the morning, retinol in the evening.', tip_tr: 'BHA sabah, retinol akşam.' },
  'vitamin c+spf': { status: 'ok', title_fr: 'Combinaison parfaite! ✨', title_en: 'Perfect combination! ✨', title_tr: 'Mükemmel kombinasyon! ✨', explanation_fr: 'La vitamine C booste l\'efficacité du SPF.', explanation_en: 'Vitamin C boosts SPF effectiveness.', explanation_tr: 'C vitamini, SPF\'nin etkinliğini artırır.', tip_fr: 'Appliquez la vitamine C en premier, puis le SPF.', tip_en: 'Apply vitamin C first, then SPF.', tip_tr: 'Önce C vitamini, sonra SPF uygulayın.' },
  'spf+vitamin c': { status: 'ok', title_fr: 'Combinaison parfaite! ✨', title_en: 'Perfect combination! ✨', title_tr: 'Mükemmel kombinasyon! ✨', explanation_fr: 'La vitamine C booste l\'efficacité du SPF.', explanation_en: 'Vitamin C boosts SPF effectiveness.', explanation_tr: 'C vitamini SPF etkinliğini artırır.', tip_fr: 'Vitamine C en premier, puis SPF.', tip_en: 'Vitamin C first, then SPF.', tip_tr: 'Önce C vitamini, sonra SPF.' },
  'niacinamide+hyaluronic acid': { status: 'ok', title_fr: 'Duo idéal! 💧', title_en: 'Ideal duo! 💧', title_tr: 'İdeal ikili! 💧', explanation_fr: 'La niacinamide et l\'acide hyaluronique hydratent et apaisent ensemble.', explanation_en: 'Niacinamide and hyaluronic acid together hydrate and soothe.', explanation_tr: 'Niacinamide ve hyalüronik asit birlikte nemlendirir ve yatıştırır.', tip_fr: 'Acide hyaluronique sur peau humide, puis niacinamide.', tip_en: 'Hyaluronic acid on damp skin, then niacinamide.', tip_tr: 'Hyalüronik asidi nemli cilde, sonra niacinamide uygulayın.' },
  'hyaluronic acid+niacinamide': { status: 'ok', title_fr: 'Duo idéal! 💧', title_en: 'Ideal duo! 💧', title_tr: 'İdeal ikili! 💧', explanation_fr: 'Hydratation et apaisement combinés.', explanation_en: 'Combined hydration and soothing.', explanation_tr: 'Birleşik nemlendirme ve yatıştırma.', tip_fr: 'Acide hyaluronique d\'abord.', tip_en: 'Hyaluronic acid first.', tip_tr: 'Önce hyalüronik asit.' },
  'retinol+hyaluronic acid': { status: 'ok', title_fr: 'Combinaison recommandée', title_en: 'Recommended combination', title_tr: 'Önerilen kombinasyon', explanation_fr: 'L\'acide hyaluronique contrebalance les effets asséchants du rétinol.', explanation_en: 'Hyaluronic acid counterbalances retinol\'s drying effects.', explanation_tr: 'Hyalüronik asit, retinolün kurutucu etkisini dengeler.', tip_fr: 'Appliquez l\'acide hyaluronique après le rétinol.', tip_en: 'Apply hyaluronic acid after retinol.', tip_tr: 'Retinolden sonra hyalüronik asit uygulayın.' },
  'hyaluronic acid+retinol': { status: 'ok', title_fr: 'Combinaison recommandée', title_en: 'Recommended combination', title_tr: 'Önerilen kombinasyon', explanation_fr: 'L\'acide hyaluronique contrebalance les effets du rétinol.', explanation_en: 'Hyaluronic acid counterbalances retinol.', explanation_tr: 'Hyalüronik asit retinolü dengeler.', tip_fr: 'Acide hyaluronique après rétinol.', tip_en: 'Hyaluronic acid after retinol.', tip_tr: 'Retinolden sonra hyalüronik asit.' },
  'niacinamide+retinol': { status: 'ok', title_fr: 'Excellent duo anti-âge! ✨', title_en: 'Excellent anti-aging duo! ✨', title_tr: 'Mükemmel yaşlanma karşıtı ikili! ✨', explanation_fr: 'La niacinamide réduit les irritations du rétinol.', explanation_en: 'Niacinamide reduces retinol irritation.', explanation_tr: 'Niacinamide, retinol tahrişini azaltır.', tip_fr: 'Niacinamide en premier, puis rétinol.', tip_en: 'Niacinamide first, then retinol.', tip_tr: 'Önce niacinamide, sonra retinol.' },
  'retinol+niacinamide': { status: 'ok', title_fr: 'Excellent duo anti-âge! ✨', title_en: 'Excellent anti-aging duo! ✨', title_tr: 'Mükemmel yaşlanma karşıtı ikili! ✨', explanation_fr: 'La niacinamide réduit les irritations du rétinol.', explanation_en: 'Niacinamide reduces retinol irritation.', explanation_tr: 'Niacinamide retinol tahrişini azaltır.', tip_fr: 'Niacinamide d\'abord.', tip_en: 'Niacinamide first.', tip_tr: 'Önce niacinamide.' },
  'vitamin c+retinol': { status: 'warning', title_fr: 'Mieux séparés', title_en: 'Better separated', title_tr: 'Ayrı kullanmak daha iyi', explanation_fr: 'pH différents, peuvent s\'inactiver mutuellement.', explanation_en: 'Different pH levels, can inactivate each other.', explanation_tr: 'Farklı pH seviyeleri, birbirini etkisiz kılabilir.', tip_fr: 'Vitamine C le matin, rétinol le soir.', tip_en: 'Vitamin C in the morning, retinol in the evening.', tip_tr: 'C vitamini sabah, retinol akşam.' },
  'retinol+vitamin c': { status: 'warning', title_fr: 'Mieux séparés', title_en: 'Better separated', title_tr: 'Ayrı kullanmak daha iyi', explanation_fr: 'pH différents, peuvent s\'inactiver.', explanation_en: 'Different pH levels.', explanation_tr: 'Farklı pH seviyeleri.', tip_fr: 'C le matin, rétinol le soir.', tip_en: 'C in the morning, retinol at night.', tip_tr: 'C sabah, retinol gece.' },
  'hyaluronic acid+spf': { status: 'ok', title_fr: 'Routine matin parfaite! ☀️', title_en: 'Perfect morning routine! ☀️', title_tr: 'Mükemmel sabah rutini! ☀️', explanation_fr: 'Base hydratante et protectrice idéale.', explanation_en: 'Ideal hydrating and protective base.', explanation_tr: 'İdeal nemlendirici ve koruyucu taban.', tip_fr: 'Acide hyaluronique sur peau humide, puis SPF.', tip_en: 'Hyaluronic acid on damp skin, then SPF.', tip_tr: 'Nemli cilde hyalüronik asit, sonra SPF.' },
  'spf+hyaluronic acid': { status: 'ok', title_fr: 'Routine matin parfaite! ☀️', title_en: 'Perfect morning routine! ☀️', title_tr: 'Mükemmel sabah rutini! ☀️', explanation_fr: 'Base hydratante et protectrice.', explanation_en: 'Hydrating and protective base.', explanation_tr: 'Nemlendirici ve koruyucu taban.', tip_fr: 'Hyaluronique d\'abord, SPF ensuite.', tip_en: 'Hyaluronic first, then SPF.', tip_tr: 'Önce hyalüronik, sonra SPF.' },
};

const INGREDIENTS_FR = ['Niacinamide', 'Vitamin C', 'Rétinol', 'AHA', 'BHA', 'Acide Hyaluronique', 'SPF', 'Caféine', 'Peptides', 'Céramides'];
const INGREDIENTS_EN = ['Niacinamide', 'Vitamin C', 'Retinol', 'AHA', 'BHA', 'Hyaluronic Acid', 'SPF', 'Caffeine', 'Peptides', 'Ceramides'];
const INGREDIENTS_TR = ['Niacinamide', 'Vitamin C', 'Retinol', 'AHA', 'BHA', 'Hyalüronik Asit', 'SPF', 'Kafein', 'Peptitler', 'Seramitler'];
const INGREDIENTS_KEY = ['niacinamide', 'vitamin c', 'retinol', 'aha', 'bha', 'hyaluronic acid', 'spf', 'caffeine', 'peptides', 'ceramides'];

const STATUS_COLORS = { ok: '#5B9B6B', warning: '#E67E22', avoid: '#C0392B' };
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

  const lbl = (fr: string, tr: string, en: string) => lang === 'fr' ? fr : lang === 'tr' ? tr : en;
  const INGREDIENTS = lang === 'tr' ? INGREDIENTS_TR : lang === 'fr' ? INGREDIENTS_FR : INGREDIENTS_EN;

  const checkCompatibility = (key1 = ingredient1Key, key2 = ingredient2Key) => {
    if (!key1 || !key2) return;
    setLoading(true);
    setTimeout(() => {
      const key = `${key1}+${key2}`;
      const found = COMBINATIONS[key];
      setResult(found || {
        status: 'ok',
        title_fr: 'Combinaison généralement sûre',
        title_en: 'Generally safe combination',
        title_tr: 'Genellikle güvenli kombinasyon',
        explanation_fr: `Aucune interaction négative connue entre ${ingredient1} et ${ingredient2}.`,
        explanation_en: `No known negative interactions between ${ingredient1} and ${ingredient2}.`,
        explanation_tr: `${ingredient1} ve ${ingredient2} arasında bilinen olumsuz etkileşim yok.`,
        tip_fr: 'Testez sur une petite zone et observez pendant 48h.',
        tip_en: 'Test on a small area and observe for 48 hours.',
        tip_tr: 'Küçük bir bölgede test edin ve 48 saat gözlemleyin.',
      });
      setLoading(false);
    }, 600);
  };

  const reset = () => {
    setIngredient1(''); setIngredient1Key('');
    setIngredient2(''); setIngredient2Key('');
    setResult(null); setStep(1);
  };

  const selectIngredient = (label: string, idx: number) => {
    const key = INGREDIENTS_KEY[idx];
    if (step === 1) { setIngredient1(label); setIngredient1Key(key); setStep(2); }
    else { if (key === ingredient1Key) return; setIngredient2(label); setIngredient2Key(key); }
  };

  const POPULAR = [
    { a: lbl('Vitamin C', 'Vitamin C', 'Vitamin C'), b: 'SPF', ka: 'vitamin c', kb: 'spf' },
    { a: 'Niacinamide', b: lbl('Rétinol', 'Retinol', 'Retinol'), ka: 'niacinamide', kb: 'retinol' },
    { a: lbl('Acide Hyaluronique', 'Hyalüronik Asit', 'Hyaluronic Acid'), b: 'SPF', ka: 'hyaluronic acid', kb: 'spf' },
    { a: lbl('Rétinol', 'Retinol', 'Retinol'), b: 'AHA', ka: 'retinol', kb: 'aha' },
  ];

  const getTitle = (r: CompatResult) => lang === 'tr' ? r.title_tr : lang === 'fr' ? r.title_fr : r.title_en;
  const getExplanation = (r: CompatResult) => lang === 'tr' ? r.explanation_tr : lang === 'fr' ? r.explanation_fr : r.explanation_en;
  const getTip = (r: CompatResult) => lang === 'tr' ? r.tip_tr : lang === 'fr' ? r.tip_fr : r.tip_en;

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
      <View style={s.header}>
        <Text style={s.title}>{t.compatibility.title}</Text>
        <Text style={s.sub}>{t.compatibility.sub}</Text>
      </View>

      {!result ? (
        <>
          <View style={s.selectionRow}>
            <View style={[s.selectionBox, ingredient1 ? s.selectionBoxFilled : null]}>
              {ingredient1
                ? <><Text style={s.selectionBoxLabel}>{t.compatibility.ingredient1}</Text><Text style={s.selectionBoxValue}>{ingredient1}</Text></>
                : <Text style={s.selectionBoxPlaceholder}>{t.compatibility.ingredient1}</Text>
              }
            </View>
            <Text style={s.plus}>+</Text>
            <View style={[s.selectionBox, ingredient2 ? s.selectionBoxFilled : null]}>
              {ingredient2
                ? <><Text style={s.selectionBoxLabel}>{t.compatibility.ingredient2}</Text><Text style={s.selectionBoxValue}>{ingredient2}</Text></>
                : <Text style={s.selectionBoxPlaceholder}>{t.compatibility.ingredient2}</Text>
              }
            </View>
          </View>

          <Text style={s.stepHint}>{step === 1 ? t.compatibility.step1 : t.compatibility.step2}</Text>

          <View style={s.ingredientGrid}>
            {INGREDIENTS.map((ing, idx) => (
              <TouchableOpacity
                key={ing}
                onPress={() => selectIngredient(ing, idx)}
                style={[
                  s.ingredientChip,
                  ingredient1Key === INGREDIENTS_KEY[idx] && s.ingredientChipSelected1,
                  ingredient2Key === INGREDIENTS_KEY[idx] && s.ingredientChipSelected2,
                  step === 2 && INGREDIENTS_KEY[idx] === ingredient1Key && s.ingredientChipDisabled,
                ]}
                disabled={step === 2 && INGREDIENTS_KEY[idx] === ingredient1Key}
              >
                <Text style={[s.ingredientChipText, (ingredient1Key === INGREDIENTS_KEY[idx] || ingredient2Key === INGREDIENTS_KEY[idx]) && s.ingredientChipTextSelected]}>{ing}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={s.orText}>{lbl('— ou saisissez manuellement —', '— veya manuel girin —', '— or enter manually —')}</Text>
          <View style={s.manualRow}>
            <TextInput style={[s.manualInput, { flex: 1 }]} placeholder={t.compatibility.ingredient1} placeholderTextColor={T.light} value={ingredient1} onChangeText={v => { setIngredient1(v); setIngredient1Key(v.toLowerCase()); }} autoCorrect={false} />
            <Text style={s.manualPlus}>+</Text>
            <TextInput style={[s.manualInput, { flex: 1 }]} placeholder={t.compatibility.ingredient2} placeholderTextColor={T.light} value={ingredient2} onChangeText={v => { setIngredient2(v); setIngredient2Key(v.toLowerCase()); }} autoCorrect={false} />
          </View>

          <TouchableOpacity
            style={[s.checkBtn, (!ingredient1 || !ingredient2) && s.checkBtnDisabled]}
            onPress={() => checkCompatibility()}
            disabled={!ingredient1 || !ingredient2 || loading}
          >
            {loading ? <ActivityIndicator color={T.white} /> : <Text style={s.checkBtnText}>{t.compatibility.check_btn}</Text>}
          </TouchableOpacity>

          <Text style={s.sectionLabel}>{t.compatibility.popular}</Text>
          {POPULAR.map((combo, i) => {
            const r = COMBINATIONS[`${combo.ka}+${combo.kb}`];
            return (
              <TouchableOpacity key={i} onPress={() => {
                setIngredient1(combo.a); setIngredient1Key(combo.ka);
                setIngredient2(combo.b); setIngredient2Key(combo.kb);
                setStep(2);
                const found = COMBINATIONS[`${combo.ka}+${combo.kb}`];
                if (found) setResult(found);
              }} style={s.comboCard}>
                <Text style={s.comboText}>{combo.a} + {combo.b}</Text>
                {r && <Text style={{ fontSize: 16 }}>{STATUS_ICONS[r.status]}</Text>}
              </TouchableOpacity>
            );
          })}
        </>
      ) : (
        <>
          <View style={[s.resultCard, { borderColor: STATUS_COLORS[result.status] }]}>
            <View style={s.resultHeader}>
              <Text style={s.resultIcon}>{STATUS_ICONS[result.status]}</Text>
              <View style={s.resultCombo}>
                <Text style={s.resultComboText}>{ingredient1}</Text>
                <Text style={s.resultComboPlus}>+</Text>
                <Text style={s.resultComboText}>{ingredient2}</Text>
              </View>
            </View>
            <View style={[s.resultStatus, { backgroundColor: STATUS_COLORS[result.status] + '15', borderColor: STATUS_COLORS[result.status] }]}>
              <Text style={[s.resultStatusText, { color: STATUS_COLORS[result.status] }]}>{getTitle(result)}</Text>
            </View>
            <Text style={s.resultExplanation}>{getExplanation(result)}</Text>
            <View style={s.tipBox}>
              <Text style={s.tipLabel}>💡 {lbl('Conseil', 'İpucu', 'Tip')}</Text>
              <Text style={s.tipText}>{getTip(result)}</Text>
            </View>
          </View>

          <TouchableOpacity style={s.resetBtn} onPress={reset}>
            <Text style={s.resetBtnText}>{t.compatibility.reset_btn}</Text>
          </TouchableOpacity>

          <Text style={s.sectionLabel}>{t.compatibility.popular}</Text>
          {POPULAR.map((combo, i) => {
            const r = COMBINATIONS[`${combo.ka}+${combo.kb}`];
            return (
              <TouchableOpacity key={i} onPress={() => {
                setIngredient1(combo.a); setIngredient1Key(combo.ka);
                setIngredient2(combo.b); setIngredient2Key(combo.kb);
                const found = COMBINATIONS[`${combo.ka}+${combo.kb}`];
                if (found) setResult(found);
              }} style={s.comboCard}>
                <Text style={s.comboText}>{combo.a} + {combo.b}</Text>
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

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  header: { paddingHorizontal: 22, paddingTop: 60, paddingBottom: 20 },
  title: { fontSize: 24, fontWeight: '300', color: T.dark, marginBottom: 4, letterSpacing: 0.5 },
  sub: { fontSize: 12, color: T.mid },
  selectionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 22, marginBottom: 16 },
  selectionBox: { flex: 1, backgroundColor: T.white, borderRadius: 14, padding: 14, borderWidth: 1.5, borderColor: T.light, minHeight: 60, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  selectionBoxFilled: { borderColor: T.accent },
  selectionBoxPlaceholder: { fontSize: 12, color: T.light },
  selectionBoxLabel: { fontSize: 8, color: T.accent, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 },
  selectionBoxValue: { fontSize: 13, fontWeight: '500', color: T.dark, textAlign: 'center' },
  plus: { fontSize: 20, color: T.accent },
  stepHint: { fontSize: 11, color: T.mid, textAlign: 'center', marginBottom: 14, marginHorizontal: 22 },
  ingredientGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginHorizontal: 22, marginBottom: 18 },
  ingredientChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 100, backgroundColor: T.white, borderWidth: 1, borderColor: T.light },
  ingredientChipSelected1: { backgroundColor: 'rgba(184,133,106,0.15)', borderColor: T.accent },
  ingredientChipSelected2: { backgroundColor: 'rgba(91,155,107,0.15)', borderColor: T.green },
  ingredientChipDisabled: { opacity: 0.4 },
  ingredientChipText: { fontSize: 11, color: T.mid },
  ingredientChipTextSelected: { color: T.dark, fontWeight: '500' },
  orText: { textAlign: 'center', fontSize: 10, color: T.light, marginBottom: 10 },
  manualRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 22, marginBottom: 14 },
  manualInput: { backgroundColor: T.white, borderRadius: 12, padding: 12, color: T.dark, fontSize: 12, borderWidth: 1, borderColor: T.light },
  manualPlus: { fontSize: 16, color: T.accent },
  checkBtn: { backgroundColor: T.accent, borderRadius: 100, padding: 15, alignItems: 'center', marginHorizontal: 22, marginBottom: 24 },
  checkBtnDisabled: { opacity: 0.4 },
  checkBtnText: { fontSize: 13, fontWeight: '500', color: T.white },
  resultCard: { backgroundColor: T.white, borderRadius: 20, padding: 20, marginHorizontal: 22, marginBottom: 14, borderWidth: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  resultIcon: { fontSize: 32 },
  resultCombo: { flex: 1 },
  resultComboText: { fontSize: 14, fontWeight: '500', color: T.dark },
  resultComboPlus: { fontSize: 11, color: T.mid, marginVertical: 2 },
  resultStatus: { borderRadius: 10, padding: 10, marginBottom: 12, borderWidth: 1 },
  resultStatusText: { fontSize: 13, fontWeight: '500', textAlign: 'center' },
  resultExplanation: { fontSize: 12, color: T.mid, lineHeight: 20, marginBottom: 14 },
  tipBox: { backgroundColor: T.bg2, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: T.light },
  tipLabel: { fontSize: 11, fontWeight: '500', color: T.accent, marginBottom: 5 },
  tipText: { fontSize: 12, color: T.mid, lineHeight: 18 },
  resetBtn: { borderWidth: 1, borderColor: T.light, borderRadius: 100, padding: 13, alignItems: 'center', marginHorizontal: 22, marginBottom: 22 },
  resetBtnText: { fontSize: 12, color: T.mid },
  sectionLabel: { fontSize: 9, color: T.mid, letterSpacing: 2, marginBottom: 10, marginHorizontal: 22, textTransform: 'uppercase' },
  comboCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: T.white, borderRadius: 12, padding: 14, marginHorizontal: 22, marginBottom: 8, borderWidth: 1, borderColor: T.light },
  comboText: { fontSize: 12, color: T.dark },
});