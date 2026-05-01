/**
 * Product AI — recognize a product photo and suggest category/metadata.
 *
 * Used by archive add-product flow. Safe fallback returns null shape
 * so caller can keep manual entry path open.
 */
import {
  AIProxyError,
  callClaudeProxy,
  Lang,
  localizedAIError,
  safeJsonParse,
} from './aiProxy';

export type ProductCategory =
  | 'Cleanser'
  | 'Moisturizer'
  | 'Serum'
  | 'SPF'
  | 'Toner'
  | 'Mask'
  | 'Exfoliant'
  | 'Eye Cream'
  | 'Other';

export type ProductRecognition = {
  brand: string | null;
  name: string | null;
  category: ProductCategory;
  description: string;
  confidence: number;
};

const SYSTEM_PROMPT = `You are a skincare product identifier.
Return ONLY a valid JSON object, no markdown, no backticks, no preamble.
Shape:
{
  "brand": brand name or null,
  "name": product name or null,
  "category": one of: "Cleanser", "Moisturizer", "Serum", "SPF", "Toner", "Mask", "Exfoliant", "Eye Cream", "Other",
  "description": short cosmetic description (1-2 sentences),
  "confidence": number 0.0 to 1.0
}
If you cannot identify it, return brand:null, name:null and category:"Other".`;

export async function recognizeProduct(
  base64Image: string,
  lang: Lang
): Promise<ProductRecognition> {
  const langInstruction =
    lang === 'fr'
      ? 'Description in French.'
      : lang === 'tr'
      ? 'Description in Turkish.'
      : 'Description in English.';

  const data64 = base64Image.replace(/^data:image\/\w+;base64,/, '');

  const body = {
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 600,
    system: `${SYSTEM_PROMPT} ${langInstruction}`.trim(),
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: 'image/jpeg', data: data64 },
          },
          { type: 'text', text: 'Identify this product and return JSON only.' },
        ],
      },
    ],
  };

  let resp: any;
  try {
    resp = await callClaudeProxy('product', body, 25000);
  } catch (e: any) {
    const code = e instanceof AIProxyError ? e.code : 'UNKNOWN';
    throw new Error(localizedAIError(code, lang));
  }

  const text = resp?.content?.[0]?.text || '';
  const parsed = safeJsonParse<ProductRecognition>(text);

  if (!parsed) {
    throw new Error(localizedAIError('INVALID_RESPONSE', lang));
  }

  // Safe fallbacks if the model returns malformed shape
  return {
    brand: parsed.brand ?? null,
    name: parsed.name ?? null,
    category: (parsed.category as ProductCategory) || 'Other',
    description: parsed.description || '',
    confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.7,
  };
}
