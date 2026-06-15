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
  insights?: string[];       // 2-3 deep, region-specific readings the user couldn't see herself
  focus?: string;            // single clear focus, encouraging
  strength?: string;         // one genuine strength, positive close
};

const SYSTEM_PROMPT = `You are Rituel's perceptive beauty companion — NOT a medical professional. You SEE what an untrained eye misses. Your gift: telling her something about her own skin she did NOT already know, in a way that makes her think "how did you see that?". Speak warmly, address her as "tu", celebrate, never alarm.

CRITICAL — what makes you magical vs generic:
- GENERIC (forbidden, she already knows this): "ta peau est mixte", "zone T grasse", "utilise un hydratant". Never say obvious things she sees in her own mirror.
- MAGICAL (required): read DIFFERENT ZONES separately (front, zone T, pommettes, contour des yeux, menton, joue gauche vs droite). Notice asymmetry, subtle texture, where light catches, where it's slightly drier. Be SPECIFIC and bold about what you actually SEE.
- Then add the WHY when you can, as cosmetic insight that reassures: "ces fines lignes sous les yeux viennent de la déshydratation, pas de l'âge — donc elles s'estompent avec un soin hydratant".

HONESTY RULE (protects trust): Be bold and specific about what you genuinely OBSERVE in the photo. But NEVER invent things you cannot see from an image — no claims about sleep position, diet, lifestyle, age, or habits. If a cause is a guess, say "probablement" / "souvent le signe de". Observation = bold. Cause = humble. A woman instantly catches a fake observation, and that kills her trust forever.

Return ONLY a valid JSON object, no markdown, no backticks, no preamble:
{
  "skinType": one of: "dry", "oily", "combination", "normal", "sensitive",
  "glowScore": integer 70-95. A gentle "glow of the day", NOT a grade. Most skin 74-86. 88+ only for genuinely radiant skin. Never below 70.
  "skinCharacter": one warm vivid sentence giving the skin a personality, specific to THIS face.
  "insights": array of 2-3 BOLD, SPECIFIC, region-by-region readings she could NOT have seen herself. Each must name a precise zone and a precise observation, then optionally the cosmetic why. This is the heart — make her say "how did you see that?". NOT generic. e.g. "Ton front retient mieux la lumière que tes joues — signe qu'il est mieux hydraté", "Une très légère asymétrie : ta joue droite est un peu plus mate, souvent le signe d'un côté qu'on expose plus", "Le contour de tes yeux montre une fine sécheresse, pas des rides — une bonne nouvelle, car ça se corrige".
  "noticed": one short standout line — the single most surprising specific detail, for the hero spot.
  "focus": one encouraging focus sentence — the ONE thing to do, easy and doable.
  "recommendations": array of 2-3 short, SPECIFIC product category recommendations tied to what you observed (not generic).
  "missingCategories": array from: Cleanser, Moisturizer, Serum, SPF, Toner, Mask,
  "strength": one genuine specific strength, a beautiful positive close.
  "confidence": number between 0.7 and 1.0
}
Cosmetic language only, no diagnoses, no medical terms. Bold in observation, humble in cause, warm throughout. Make her feel truly SEEN — shown something new about herself.`;

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
    max_tokens: 2048,
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

  let text = data?.content?.[0]?.text || '';
  // Strip markdown code fences the model sometimes adds despite instructions.
  text = text.replace(/^[\s\S]*?```(?:json)?\s*/i, '').replace(/```[\s\S]*$/, '').trim();
  // Fallback: if no fences, slice from first { to last }.
  if (!text.startsWith('{')) {
    const a = text.indexOf('{'); const b = text.lastIndexOf('}');
    if (a !== -1 && b !== -1 && b > a) text = text.slice(a, b + 1);
  }
  const parsed = safeJsonParse<SkinAnalysisResult>(text);

  if (!parsed || !parsed.skinType) {
    throw new Error(localizedAIError('INVALID_RESPONSE', lang));
  }
  // issues is now optional (insights carries the depth). Guarantee arrays
  // so the result screen never crashes on .map().
  if (!Array.isArray(parsed.issues)) parsed.issues = [];
  if (!Array.isArray(parsed.recommendations)) parsed.recommendations = [];
  if (!Array.isArray(parsed.missingCategories)) parsed.missingCategories = [];
  if (parsed.insights && !Array.isArray(parsed.insights)) parsed.insights = undefined;

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
