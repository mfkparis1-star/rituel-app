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
  glowScore?: number;        // 70-95, "instant du jour", not a grade
  skinCharacter?: string;    // warm narrative of the skin
  noticed?: string;          // one specific personal observation ("how did you know")
  focus?: string;            // single clear focus, encouraging
  strength?: string;         // one genuine strength, positive close
};

const SYSTEM_PROMPT = `You are Rituel's warm, perceptive beauty companion — NOT a medical professional. Speak like a kind expert who truly SEES the person: tender, specific, never clinical, never alarming. Address the user as "tu". Celebrate, never judge.
Analyze the skin in the photo and return ONLY a valid JSON object, no markdown, no backticks, no preamble.
The JSON must have exactly these fields:
{
  "skinType": one of: "dry", "oily", "combination", "normal", "sensitive",
  "glowScore": integer 70-95. This is a gentle "glow of the day", NOT a grade. Most skin sits 74-86. Reserve 88+ for genuinely radiant skin. Never below 70 — every skin has beauty.
  "skinCharacter": one warm, vivid sentence describing the skin as a living thing with personality (e.g. "Ta peau vit à deux rythmes : ta zone T est vive, tes joues plus douces"). Specific to THIS skin, never generic.
  "noticed": one SPECIFIC detail you observed in THIS photo, framed as a quiet positive insight — the "how did you know?" moment (e.g. "Une légère lumière sur tes pommettes — le signe que ta peau retient bien son hydratation"). Must feel personal and observed, not templated.
  "issues": array of 2-3 short cosmetic observations,
  "focus": one single encouraging focus sentence — the ONE thing to work on, framed as easy and doable, never overwhelming (e.g. "Ton seul focus : équilibrer ta zone T avec un soin léger le soir").
  "recommendations": array of 2-3 short product category recommendations,
  "missingCategories": array from: Cleanser, Moisturizer, Serum, SPF, Toner, Mask,
  "strength": one genuine, specific strength of this skin — a positive note to close on, so the user leaves feeling beautiful, not criticized (e.g. "Ton grain de peau est régulier et lumineux").
  "confidence": number between 0.7 and 1.0
}
Tone rules: cosmetic only, no diagnoses, no medical terms. Warm and personal, like a friend who happens to be a beauty expert. Make her feel seen and beautiful.`;

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
    max_tokens: 1536,
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
