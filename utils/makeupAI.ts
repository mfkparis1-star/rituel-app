/**
 * Makeup AI — generate makeup look suggestions for an occasion.
 * Optional selfie for personalization.
 */
import {
  AIProxyError,
  callClaudeProxy,
  Lang,
  localizedAIError,
  safeJsonParse,
} from './aiProxy';

export type MakeupStyle = {
  name: string;
  description: string;
  steps: string[];
  productsNeeded: string[];
  missingCategories: string[];
  personalNote?: string;   // why this look suits THIS face (read from photo)
  colors?: string[];        // 2-4 key color names for the look
};

export type MakeupResult = {
  styles: MakeupStyle[];
};

export const MAKEUP_OCCASIONS = [
  { id: 'birthday',    labels: { fr: 'Anniversaire',         en: 'Birthday',         tr: 'Doğum günü'        } },
  { id: 'girls_night', labels: { fr: 'Soirée entre filles',  en: 'Girls night',      tr: 'Kızlar gecesi'     } },
  { id: 'dinner',      labels: { fr: 'Dîner',                en: 'Dinner',           tr: 'Akşam yemeği'      } },
  { id: 'masquerade',  labels: { fr: 'Bal masqué',           en: 'Masquerade',       tr: 'Maskeli balo'      } },
  { id: 'work',        labels: { fr: 'Réunion pro',          en: 'Work meeting',     tr: 'İş toplantısı'     } },
  { id: 'wedding',     labels: { fr: 'Mariage',              en: 'Wedding',          tr: 'Düğün'             } },
  { id: 'daily',       labels: { fr: 'Quotidien',            en: 'Daily',            tr: 'Günlük'            } },
] as const;

export type OccasionId = typeof MAKEUP_OCCASIONS[number]['id'];

const SYSTEM_PROMPT = `You are a professional makeup artist with a gift for reading a face.
Return ONLY valid JSON. Do NOT wrap it in markdown code fences. No backticks, no preamble, no trailing text — just the raw JSON object starting with { and ending with }.
When a photo is provided, READ the face: skin tone/undertone, eye color, hair color, face shape. Make each look genuinely tailored — choose colors that flatter THIS person specifically, and explain why in personalNote (e.g. "un bordeaux chaud qui fait ressortir tes yeux verts"). Be specific and bold about what suits her; never generic.
Generate 3 distinct makeup looks for the requested occasion.
Shape:
{
  "styles": [
    {
      "name": "short name",
      "description": "1-2 sentence vibe",
      "steps": [array of 5-8 short sequential steps],
      "productsNeeded": [from: Foundation, Concealer, Powder, Blush, Bronzer, Highlighter, Eyeshadow, Eyeliner, Mascara, Brow Pencil, Lipstick, Lip Gloss, Setting Spray, Primer],
      "missingCategories": [subset of productsNeeded the user does NOT have],
      "colors": [2-4 key color names used in this look, e.g. "bordeaux", "or rosé", "taupe"],
      "personalNote": "one warm sentence on why this look flatters THIS person (only if a photo was given; else a short why it fits the occasion)"
    },
    ...3 total
  ]
}`;

export async function generateMakeupLooks(
  occasion: OccasionId,
  selfieBase64: string | null,
  ownedCategories: string[],
  lang: Lang
): Promise<MakeupResult> {
  const occ = MAKEUP_OCCASIONS.find((o) => o.id === occasion);
  const occLabel = occ?.labels[lang] ?? occasion;

  const langInstruction =
    lang === 'fr'
      ? 'Write all text fields in French.'
      : lang === 'tr'
      ? 'Write all text fields in Turkish.'
      : 'Write all text fields in English.';

  const ownedContext =
    ownedCategories.length > 0
      ? `User archive: ${ownedCategories.join(', ')}. Mark anything outside this list as missingCategories.`
      : 'User archive is empty. List all required categories as missing.';

  const userContent: any[] = [];
  if (selfieBase64) {
    const data = selfieBase64.replace(/^data:image\/\w+;base64,/, '');
    userContent.push({
      type: 'image',
      source: { type: 'base64', media_type: 'image/jpeg', data },
    });
    userContent.push({
      type: 'text',
      text: `Generate 3 makeup looks for: ${occLabel}. Read this face carefully — skin tone, eye color, hair, face shape — and tailor every look to flatter this specific person. Fill personalNote with the reason each look suits them.`,
    });
  } else {
    userContent.push({
      type: 'text',
      text: `Generate 3 makeup looks for: ${occLabel}.`,
    });
  }

  const body = {
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    system: `${SYSTEM_PROMPT} ${langInstruction} ${ownedContext}`.trim(),
    messages: [{ role: 'user', content: userContent }],
  };

  let data: any;
  try {
    data = await callClaudeProxy('makeup', body, 35000);
  } catch (e: any) {
    const code = e instanceof AIProxyError ? e.code : 'UNKNOWN';
    throw new Error(localizedAIError(code, lang));
  }

  let text = data?.content?.[0]?.text || '';
  text = text.replace(/^[\s\S]*?```(?:json)?\s*/i, '').replace(/```[\s\S]*$/, '').trim();
  if (!text.startsWith('{')) {
    const a = text.indexOf('{'); const b = text.lastIndexOf('}');
    if (a !== -1 && b !== -1 && b > a) text = text.slice(a, b + 1);
  }
  const parsed = safeJsonParse<MakeupResult>(text);

  if (!parsed || !Array.isArray(parsed.styles) || parsed.styles.length === 0) {
    throw new Error(localizedAIError('INVALID_RESPONSE', lang));
  }
  return parsed;
}
