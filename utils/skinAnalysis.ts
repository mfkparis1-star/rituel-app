/**
 * Skin Analysis — Claude Haiku via claude-proxy edge function.
 *
 * Returns structured JSON. Disclaimer: cosmetic guidance only,
 * not a medical diagnosis.
 */
import {
  AIProxyError,
  callClaudeProxy,
  Lang,
  localizedAIError,
  safeJsonParse,
} from './aiProxy';

export type SkinType = 'dry' | 'oily' | 'combination' | 'normal' | 'sensitive';

export type SkinAnalysisResult = {
  skinType: SkinType;
  issues: string[];
  recommendations: string[];
  missingCategories: string[];
  confidence: number;
};

const SYSTEM_PROMPT = `You are a cosmetic skincare assistant, NOT a medical professional.
Analyze the skin in the photo and return ONLY a valid JSON object,
no markdown, no backticks, no preamble.
The JSON must have exactly these fields:
{
  "skinType": one of: "dry", "oily", "combination", "normal", "sensitive",
  "issues": array of 2-4 short cosmetic observations (e.g. "T-zone oiliness", "mild dryness"),
  "recommendations": array of 2-3 short product category recommendations,
  "missingCategories": array of categories from: Cleanser, Moisturizer, Serum, SPF, Toner, Mask,
  "confidence": number between 0.7 and 1.0
}
Use cosmetic, non-medical language. No diagnoses.`;

export async function analyzeSkin(
  base64Image: string,
  lang: Lang,
  ownedCategories: string[] = []
): Promise<SkinAnalysisResult> {
  const langInstruction =
    lang === 'fr'
      ? 'Write all text fields in French.'
      : lang === 'tr'
      ? 'Write all text fields in Turkish.'
      : 'Write all text fields in English.';

  const ownedContext =
    ownedCategories.length > 0
      ? `User already has: ${ownedCategories.join(', ')}. Reflect this in missingCategories.`
      : '';

  const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');

  const body = {
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: `${SYSTEM_PROMPT} ${langInstruction} ${ownedContext}`.trim(),
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: 'image/jpeg', data: base64Data },
          },
          { type: 'text', text: 'Analyze the skin in this photo and return the JSON.' },
        ],
      },
    ],
  };

  let data: any;
  try {
    data = await callClaudeProxy('skin_analysis', body);
  } catch (e: any) {
    const code = e instanceof AIProxyError ? e.code : 'UNKNOWN';
    throw new Error(localizedAIError(code, lang));
  }

  const text = data?.content?.[0]?.text || '';
  const parsed = safeJsonParse<SkinAnalysisResult>(text);

  if (!parsed || !parsed.skinType || !Array.isArray(parsed.issues)) {
    throw new Error(localizedAIError('INVALID_RESPONSE', lang));
  }

  return parsed;
}

export function getSkinTypeLabel(skinType: string, lang: Lang): string {
  const labels: Record<string, Record<Lang, string>> = {
    dry:         { fr: 'Sèche',    en: 'Dry',         tr: 'Kuru'   },
    oily:        { fr: 'Grasse',   en: 'Oily',        tr: 'Yağlı'  },
    combination: { fr: 'Mixte',    en: 'Combination', tr: 'Karma'  },
    normal:      { fr: 'Normale',  en: 'Normal',      tr: 'Normal' },
    sensitive:   { fr: 'Sensible', en: 'Sensitive',   tr: 'Hassas' },
  };
  return labels[skinType]?.[lang] || skinType;
}
