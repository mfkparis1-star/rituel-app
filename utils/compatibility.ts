/**
 * Compatibility — rule-based cosmetic ingredient pairing guide.
 *
 * NOT a medical resource. Cosmetic guidance only.
 * Rules based on commonly known skincare interactions.
 *
 * No AI, no edge function, no Supabase. Pure lookup.
 */

export type CompatStatus = 'ok' | 'warning' | 'avoid';

export type CompatResult = {
  status: CompatStatus;
  title: string;
  explanation: string;
  tip: string;
};

export type Lang = 'fr' | 'en' | 'tr';

export const INGREDIENT_KEYS = [
  'niacinamide',
  'vitamin c',
  'retinol',
  'aha',
  'bha',
  'hyaluronic acid',
  'spf',
  'caffeine',
  'peptides',
  'ceramides',
] as const;

export type IngredientKey = typeof INGREDIENT_KEYS[number];

export const INGREDIENT_LABELS: Record<Lang, string[]> = {
  fr: ['Niacinamide', 'Vitamine C', 'Rétinol', 'AHA', 'BHA', 'Acide Hyaluronique', 'SPF', 'Caféine', 'Peptides', 'Céramides'],
  en: ['Niacinamide', 'Vitamin C', 'Retinol', 'AHA', 'BHA', 'Hyaluronic Acid', 'SPF', 'Caffeine', 'Peptides', 'Ceramides'],
  tr: ['Niacinamide', 'Vitamin C', 'Retinol', 'AHA', 'BHA', 'Hyalüronik Asit', 'SPF', 'Kafein', 'Peptitler', 'Seramitler'],
};

export function getIngredientLabel(key: IngredientKey, lang: Lang): string {
  const idx = INGREDIENT_KEYS.indexOf(key);
  if (idx < 0) return key;
  return INGREDIENT_LABELS[lang][idx];
}

type LocalizedRule = {
  status: CompatStatus;
  fr: { title: string; explanation: string; tip: string };
  en: { title: string; explanation: string; tip: string };
  tr: { title: string; explanation: string; tip: string };
};

const COMBINATIONS: Record<string, LocalizedRule> = {
  'niacinamide+vitamin c': {
    status: 'warning',
    fr: { title: 'À utiliser séparément', explanation: 'La niacinamide et la vitamine C peuvent se neutraliser mutuellement.', tip: 'Utilisez la vitamine C le matin et la niacinamide le soir.' },
    en: { title: 'Use separately', explanation: 'Niacinamide and vitamin C can neutralize each other.', tip: 'Use vitamin C in the morning and niacinamide in the evening.' },
    tr: { title: 'Ayrı ayrı kullanın', explanation: 'Niacinamide ve C vitamini birbirini nötrleştirebilir.', tip: "C vitaminini sabah, niacinamide'i akşam kullanın." },
  },
  'retinol+aha': {
    status: 'avoid',
    fr: { title: 'À éviter ensemble', explanation: 'La combinaison rétinol + AHA peut provoquer des irritations sévères.', tip: 'Alternez les soirs : rétinol un soir, AHA le suivant.' },
    en: { title: 'Avoid together', explanation: 'Retinol + AHA can cause severe irritation.', tip: 'Alternate evenings: retinol one night, AHA the next.' },
    tr: { title: 'Birlikte kullanmayın', explanation: 'Retinol + AHA kombinasyonu ciddi tahriş yapabilir.', tip: 'Gece gece değiştirin: bir gece retinol, ertesi gece AHA.' },
  },
  'retinol+bha': {
    status: 'avoid',
    fr: { title: 'À éviter ensemble', explanation: 'Le rétinol et le BHA combinés peuvent fortement irriter.', tip: 'Utilisez le BHA le matin et le rétinol le soir.' },
    en: { title: 'Avoid together', explanation: 'Retinol and BHA combined can strongly irritate skin.', tip: 'Use BHA in the morning and retinol in the evening.' },
    tr: { title: 'Birlikte kullanmayın', explanation: 'Retinol ve BHA birlikte cildi güçlü şekilde tahriş edebilir.', tip: "BHA'yı sabah, retinolü akşam kullanın." },
  },
  'vitamin c+spf': {
    status: 'ok',
    fr: { title: 'Combinaison parfaite', explanation: "La vitamine C booste l'efficacité du SPF contre les UV.", tip: 'Appliquez la vitamine C en premier, puis le SPF.' },
    en: { title: 'Perfect combination', explanation: 'Vitamin C boosts SPF effectiveness against UV.', tip: 'Apply vitamin C first, then SPF.' },
    tr: { title: 'Mükemmel kombinasyon', explanation: "C vitamini, SPF'nin UV'ye karşı etkinliğini artırır.", tip: 'Önce C vitamini, sonra SPF uygulayın.' },
  },
  'hyaluronic acid+spf': {
    status: 'ok',
    fr: { title: 'Combinaison sûre', explanation: "L'acide hyaluronique hydrate, le SPF protège.", tip: "Acide hyaluronique d'abord, puis SPF en couche finale." },
    en: { title: 'Safe combination', explanation: 'Hyaluronic acid hydrates, SPF protects.', tip: 'Hyaluronic acid first, then SPF as final layer.' },
    tr: { title: 'Güvenli kombinasyon', explanation: 'Hyalüronik asit nemlendirir, SPF korur.', tip: 'Önce hyalüronik asit, sonra son katman olarak SPF.' },
  },
  'niacinamide+retinol': {
    status: 'ok',
    fr: { title: 'Combinaison bénéfique', explanation: "La niacinamide aide à réduire l'irritation potentielle du rétinol.", tip: 'Niacinamide en sérum avant le rétinol pour calmer la peau.' },
    en: { title: 'Beneficial combination', explanation: 'Niacinamide helps reduce potential retinol irritation.', tip: 'Niacinamide serum before retinol to soothe the skin.' },
    tr: { title: 'Faydalı kombinasyon', explanation: 'Niacinamide, retinolün olası tahriş etkisini azaltır.', tip: 'Cildi yatıştırmak için retinolden önce niacinamide serumu kullanın.' },
  },
  'aha+bha': {
    status: 'warning',
    fr: { title: 'Utilisation prudente', explanation: 'AHA et BHA ensemble peuvent sur-exfolier la peau.', tip: 'Alternez les jours et hydratez bien.' },
    en: { title: 'Use cautiously', explanation: 'AHA and BHA together can over-exfoliate the skin.', tip: 'Alternate days and moisturize well.' },
    tr: { title: 'Dikkatli kullanın', explanation: 'AHA ve BHA birlikte cildi aşırı eksfoliye edebilir.', tip: 'Gün aşırı kullanın ve iyi nemlendirin.' },
  },
  'peptides+vitamin c': {
    status: 'warning',
    fr: { title: 'Préfère séparément', explanation: 'La vitamine C peut altérer certains peptides.', tip: 'Vitamine C le matin, peptides le soir.' },
    en: { title: 'Prefer separately', explanation: 'Vitamin C can alter some peptides.', tip: 'Vitamin C in the morning, peptides in the evening.' },
    tr: { title: 'Ayrı kullanmayı tercih edin', explanation: 'C vitamini bazı peptitleri bozabilir.', tip: 'C vitamini sabah, peptitler akşam.' },
  },
  'ceramides+retinol': {
    status: 'ok',
    fr: { title: 'Combinaison apaisante', explanation: "Les céramides renforcent la barrière cutanée pendant l'usage du rétinol.", tip: "Appliquez les céramides après le rétinol pour sceller l'hydratation." },
    en: { title: 'Soothing combination', explanation: 'Ceramides strengthen the skin barrier during retinol use.', tip: 'Apply ceramides after retinol to seal hydration.' },
    tr: { title: 'Yatıştırıcı kombinasyon', explanation: 'Seramitler, retinol kullanımı sırasında cilt bariyerini güçlendirir.', tip: 'Nemi kilitlemek için retinolden sonra seramit uygulayın.' },
  },
  'caffeine+vitamin c': {
    status: 'ok',
    fr: { title: 'Boost matinal', explanation: 'Caféine et vitamine C dynamisent et illuminent le teint.', tip: 'Idéal pour les contours yeux le matin.' },
    en: { title: 'Morning boost', explanation: 'Caffeine and vitamin C energize and brighten the complexion.', tip: 'Ideal for eye area in the morning.' },
    tr: { title: 'Sabah enerjisi', explanation: 'Kafein ve C vitamini cildi canlandırır ve aydınlatır.', tip: 'Sabah göz çevresi için ideal.' },
  },
};

const FALLBACK: Record<Lang, { title: string; explanation: string; tip: string }> = {
  fr: { title: 'Combinaison généralement compatible', explanation: 'Aucune interaction négative connue entre ces deux ingrédients.', tip: "Testez sur une petite zone pendant 48h avant l'usage régulier." },
  en: { title: 'Generally compatible', explanation: 'No known negative interactions between these two ingredients.', tip: 'Patch test on a small area for 48 hours before regular use.' },
  tr: { title: 'Genellikle uyumlu', explanation: 'Bu iki içerik arasında bilinen olumsuz etkileşim yok.', tip: 'Düzenli kullanımdan önce 48 saat boyunca küçük bir alanda test edin.' },
};

/**
 * checkPair — symmetric lookup. Order of arguments does not matter.
 * Returns localized CompatResult. Unknown pairs fall back to "generally compatible".
 */
export function checkPair(
  key1: IngredientKey,
  key2: IngredientKey,
  lang: Lang
): CompatResult {
  const direct = `${key1}+${key2}`;
  const reverse = `${key2}+${key1}`;
  const rule = COMBINATIONS[direct] ?? COMBINATIONS[reverse];
  if (rule) {
    const loc = rule[lang];
    return { status: rule.status, title: loc.title, explanation: loc.explanation, tip: loc.tip };
  }
  const fb = FALLBACK[lang];
  return { status: 'ok', title: fb.title, explanation: fb.explanation, tip: fb.tip };
}
