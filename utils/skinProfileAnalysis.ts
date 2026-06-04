/**
 * Skin Profile Analysis — Quiz-based comprehensive analysis (Phase 3b).
 *
 * Takes the user's quiz answers (profiles.memory.skin_profile) and
 * generates a comprehensive AI interpretation via Claude Haiku.
 * NO photo required — text-only analysis based on self-reported
 * answers. This is distinct from utils/skinAnalysis.ts (photo-based).
 *
 * Result is saved to profiles.memory.skin_profile_analysis.
 *
 * Cosmetic guidance only — not medical, no diagnosis.
 */
import {
  AIProxyError,
  callClaudeProxy,
  Lang,
  localizedAIError,
  safeJsonParse,
} from './aiProxy';
import { SkinProfile, SkinProfileAnalysis } from './memory';

const SYSTEM_PROMPT = `You are a warm, observant skincare companion (NOT a medical professional).
You receive a user's self-reported skin profile from a 6-question quiz and produce a comprehensive but caring interpretation.

Return ONLY a valid JSON object — no markdown, no backticks, no preamble.
The JSON MUST have exactly these fields:
{
  "skinTypeCanonical": one of: "dry" | "oily" | "combination" | "normal" | "sensitive",
  "parameters": {
    "hydration":       {"level": "low" | "medium" | "high", "note": "one short sentence"},
    "luminosity":      {"level": "low" | "medium" | "high", "note": "one short sentence"},
    "sensitivity":     {"level": "low" | "medium" | "high", "note": "one short sentence"},
    "poreVisibility":  {"level": "low" | "medium" | "high", "note": "one short sentence"},
    "pigmentation":    {"level": "low" | "medium" | "high", "note": "one short sentence"}
  },
  "narrative": "3-4 short paragraphs (300-400 words total). Warm, observational tone. Reference the user's own answers. No diagnoses, no medical claims.",
  "recommendations": ["3 to 5 short concrete suggestions (one sentence each)"]
}

Tone rules:
- Sıcak, gözleme dayalı, yargılamayan. "Tu" değil "vous" (gentle, modern).
- No "you must" / "you should" — prefer "you might consider" / "you could explore".
- No medical terms (acne, dermatitis, eczema). Use cosmetic language (imperfections, redness, dryness).
- No brand mentions, no specific product names.
- Map quiz "skin_type" (sec/mixte/gras/normal/sensible/unknown) to canonical EN values internally.`;

function buildUserPrompt(profile: SkinProfile, lang: Lang): string {
  const lines: string[] = [];
  if (profile.skin_type) lines.push(`Self-reported skin type: ${profile.skin_type}`);
  if (profile.concerns && profile.concerns.length > 0) {
    lines.push(`Current concerns: ${profile.concerns.join(', ')}`);
  }
  if (profile.sensitivity) lines.push(`Sensitivity frequency: ${profile.sensitivity}`);
  if (profile.routine_level) lines.push(`Current routine level: ${profile.routine_level}`);
  if (profile.goal) lines.push(`Goal for this month: ${profile.goal}`);
  if (profile.self_note && profile.self_note.trim()) {
    lines.push(`Self note: "${profile.self_note.trim()}"`);
  }

  const langName = lang === 'fr' ? 'French' : lang === 'tr' ? 'Turkish' : 'English';
  lines.push('');
  lines.push(`Write ALL text fields (notes, narrative, recommendations) in ${langName}.`);
  lines.push('Return the JSON only.');
  return lines.join('\n');
}

export async function analyzeSkinFromQuiz(
  profile: SkinProfile,
  lang: Lang
): Promise<SkinProfileAnalysis> {
  const userPrompt = buildUserPrompt(profile, lang);

  const body = {
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1500,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [{ type: 'text', text: userPrompt }],
      },
    ],
  };

  let data: any;
  try {
    data = await callClaudeProxy('skin_profile_analysis', body);
  } catch (e: any) {
    const code = e instanceof AIProxyError ? e.code : 'UNKNOWN';
    throw new Error(localizedAIError(code, lang));
  }

  const text = data?.content?.[0]?.text || '';
  const parsed = safeJsonParse<Omit<SkinProfileAnalysis, 'createdAt'>>(text);

  if (
    !parsed ||
    !parsed.skinTypeCanonical ||
    !parsed.parameters ||
    !parsed.parameters.hydration ||
    !parsed.parameters.luminosity ||
    !parsed.parameters.sensitivity ||
    !parsed.parameters.poreVisibility ||
    !parsed.parameters.pigmentation ||
    typeof parsed.narrative !== 'string' ||
    !Array.isArray(parsed.recommendations)
  ) {
    throw new Error(localizedAIError('INVALID_RESPONSE', lang));
  }

  return {
    ...parsed,
    createdAt: new Date().toISOString(),
  };
}
