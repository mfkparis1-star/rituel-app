/**
 * Routine optimizer — analyze morning + evening routine and suggest
 * improvements + missing categories + product recommendations.
 *
 * Cosmetic guidance only, no medical claims.
 */
import {
  AIProxyError,
  callClaudeProxy,
  Lang,
  localizedAIError,
  safeJsonParse,
} from './aiProxy';

export type RoutineStep = {
  name: string;
  time: 'morning' | 'evening';
};

export type RoutineOptimizeResult = {
  improvements: string[];
  missingCategories: string[];
  recommendations: string[];
};

const SYSTEM_PROMPT = `You are an expert skincare advisor.
Return ONLY a valid JSON object, no markdown, no backticks, no preamble.
Shape:
{
  "improvements": array of 2-4 short suggestions for the existing routine,
  "missingCategories": array from: Cleanser, Moisturizer, Serum, SPF, Toner, Eye Cream, Mask, Exfoliant,
  "recommendations": array of 2-3 specific product type recommendations
}
Cosmetic language only. No medical claims.`;

export async function optimizeRoutine(
  steps: RoutineStep[],
  skinType: string,
  lang: Lang
): Promise<RoutineOptimizeResult> {
  const langInstruction =
    lang === 'fr'
      ? 'Write all text in French.'
      : lang === 'tr'
      ? 'Write all text in Turkish.'
      : 'Write all text in English.';

  const morning =
    steps.filter((s) => s.time === 'morning').map((s) => s.name).join(', ') || '(none)';
  const evening =
    steps.filter((s) => s.time === 'evening').map((s) => s.name).join(', ') || '(none)';

  const userText =
    'Skin type: ' + (skinType || 'unspecified') + '\n' +
    'Morning: ' + morning + '\n' +
    'Evening: ' + evening + '\n\n' +
    'Analyze and return the JSON.';

  const body = {
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 600,
    system: `${SYSTEM_PROMPT} ${langInstruction}`.trim(),
    messages: [{ role: 'user', content: userText }],
  };

  let data: any;
  try {
    data = await callClaudeProxy('routine_optimize', body, 25000);
  } catch (e: any) {
    const code = e instanceof AIProxyError ? e.code : 'UNKNOWN';
    throw new Error(localizedAIError(code, lang));
  }

  const text = data?.content?.[0]?.text || '';
  const parsed = safeJsonParse<RoutineOptimizeResult>(text);

  if (!parsed || !Array.isArray(parsed.improvements)) {
    throw new Error(localizedAIError('INVALID_RESPONSE', lang));
  }
  return parsed;
}
