const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY || '';

export type SkinAnalysisResult = {
  skinType: 'dry' | 'oily' | 'combination' | 'normal' | 'sensitive';
  issues: string[];
  recommendations: string[];
  missingCategories: string[];
  confidence: number;
};

const SYSTEM_PROMPT = `You are a professional beauty and skincare expert. Analyze the skin in the photo provided.
Return ONLY a valid JSON object with no extra text, no markdown, no backticks.
The JSON must have exactly these fields:
{
  "skinType": one of: "dry", "oily", "combination", "normal", "sensitive",
  "issues": array of 2-4 short strings (e.g. "T-zone oiliness", "enlarged pores", "mild dryness"),
  "recommendations": array of 2-3 short product category recommendations (e.g. "Hydrating serum", "Gentle cleanser"),
  "missingCategories": array of product categories the person might be missing (from: Cleanser, Moisturizer, Serum, SPF, Toner, Mask),
  "confidence": number between 0.7 and 1.0
}
Keep all text concise and professional. Do not include medical diagnoses.`;

export async function analyzeSkin(
  base64Image: string,
  lang: 'fr' | 'en' | 'tr',
  userProducts: string[]
): Promise<SkinAnalysisResult> {
  const langInstruction = lang === 'fr'
    ? 'Write all issues and recommendations in French.'
    : lang === 'tr'
    ? 'Write all issues and recommendations in Turkish.'
    : 'Write all issues and recommendations in English.';

  const userProductsContext = userProducts.length > 0
    ? `The user already has these product categories in their archive: ${userProducts.join(', ')}. Reflect this in missingCategories.`
    : '';

  const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
      'x-api-key': ANTHROPIC_API_KEY,
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: SYSTEM_PROMPT + ' ' + langInstruction + ' ' + userProductsContext,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: base64Data,
              },
            },
            {
              type: 'text',
              text: 'Analyze the skin in this photo and return the JSON result.',
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data.content?.[0]?.text || '';

  try {
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean) as SkinAnalysisResult;
  } catch {
    throw new Error('Failed to parse skin analysis response');
  }
}

export function getSkinTypeLabel(skinType: string, lang: 'fr' | 'en' | 'tr'): string {
  const labels: Record<string, Record<string, string>> = {
    dry:         { fr: 'Sèche',    en: 'Dry',         tr: 'Kuru'   },
    oily:        { fr: 'Grasse',   en: 'Oily',        tr: 'Yağlı'  },
    combination: { fr: 'Mixte',    en: 'Combination', tr: 'Karma'  },
    normal:      { fr: 'Normale',  en: 'Normal',      tr: 'Normal' },
    sensitive:   { fr: 'Sensible', en: 'Sensitive',   tr: 'Hassas' },
  };
  return labels[skinType]?.[lang] || skinType;
}