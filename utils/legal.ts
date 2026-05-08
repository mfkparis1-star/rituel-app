/**
 * Legal disclaimer copy used across AI flows.
 *
 * Two distinct disclaimers:
 * - AI_DISCLAIMER: shown when output comes from an AI model (skin-analysis, makeup, routine optimize)
 * - COSMETIC_DISCLAIMER: shown on any cosmetic guidance (all 4 AI flows + compatibility)
 *
 * Compatibility uses ONLY COSMETIC_DISCLAIMER (rule-based, not AI).
 * Skin-analysis, makeup, routine optimize use BOTH (AI + cosmetic).
 *
 * 3 languages exported (fr/en/tr). App is currently FR-first;
 * components use .fr until a global locale hook ships in a later phase.
 *
 * Copy is intentionally hardcoded (not run through translate.ts) because
 * legal text must stay deterministic across runs.
 */

export type Lang = 'fr' | 'en' | 'tr';

export const AI_DISCLAIMER: Record<Lang, string> = {
  fr: 'Recommandations générées par IA. Elles peuvent contenir des imprécisions et ne remplacent pas un avis professionnel.',
  en: 'AI-generated recommendations. They may contain inaccuracies and do not replace professional advice.',
  tr: 'AI tarafından oluşturulan önerilerdir. Hatalar içerebilir ve profesyonel görüşün yerini tutmaz.',
};

export const COSMETIC_DISCLAIMER: Record<Lang, string> = {
  fr: 'Information cosmétique générale. Pour tout problème cutané persistant, consultez un dermatologue.',
  en: 'General cosmetic information. For any persistent skin concern, consult a dermatologist.',
  tr: 'Genel kozmetik bilgilendirmedir. Kalıcı bir cilt problemi için dermatoloğa danış.',
};
