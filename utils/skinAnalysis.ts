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

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 2,
  timeoutMs = 30000
): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timer);
      if (response.ok) return response;
      if (response.status === 429 || response.status >= 500) {
        if (attempt < retries) {
          await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
          continue;
        }
      }
      throw new Error(`${response.status}`);
    } catch (err: any) {
      clearTimeout(timer);
      if (err.name === 'AbortError') {
        if (attempt < retries) continue;
        throw new Error('TIMEOUT');
      }
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }
      throw err;
    }
  }
  throw new Error('MAX_RETRY');
}

function getErrorMessage(err: any, lang: 'fr' | 'en' | 'tr'): string {
  const msg = err?.message || '';
  if (msg === 'TIMEOUT') {
    return lang === 'fr'
      ? 'La connexion a pris trop de temps. Vérifiez votre réseau et réessayez.'
      : lang === 'tr'
      ? 'Bağlantı zaman aşımına uğradı. İnternet bağlantınızı kontrol edip tekrar deneyin.'
      : 'Connection timed out. Check your network and try again.';
  }
  if (msg === '502' || msg === '503' || msg === '504') {
    return lang === 'fr'
      ? 'Le service est temporairement indisponible. Réessayez dans quelques instants.'
      : lang === 'tr'
      ? 'Servis geçici olarak kullanılamıyor. Birkaç saniye sonra tekrar deneyin.'
      : 'Service temporarily unavailable. Please try again in a moment.';
  }
  if (msg === '401' || msg === '403') {
    return lang === 'fr'
      ? 'Erreur de configuration. Contactez le support.'
      : lang === 'tr'
      ? 'Yapılandırma hatası. Destek ile iletişime geçin.'
      : 'Configuration error. Please contact support.';
  }
  return lang === 'fr'
    ? 'Analyse impossible. Assurez-vous que votre visage est bien visible et réessayez.'
    : lang === 'tr'
    ? 'Analiz yapılamadı. Yüzünüzün net göründüğünden emin olup tekrar deneyin.'
    : 'Analysis failed. Make sure your face is clearly visible and try again.';
}

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

  const body = JSON.stringify({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: SYSTEM_PROMPT + ' ' + langInstruction + ' ' + userProductsContext,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: 'image/jpeg', data: base64Data },
          },
          {
            type: 'text',
            text: 'Analyze the skin in this photo and return the JSON result.',
          },
        ],
      },
    ],
  });

  let response: Response;
  try {
    response = await fetchWithRetry(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
        'x-api-key': ANTHROPIC_API_KEY,
      },
      body,
    });
  } catch (err: any) {
    throw new Error(getErrorMessage(err, lang));
  }

  const data = await response.json();
  const text = data.content?.[0]?.text || '';

  try {
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean) as SkinAnalysisResult;
  } catch {
    throw new Error(
      lang === 'fr' ? 'Réponse invalide. Réessayez.'
      : lang === 'tr' ? 'Geçersiz yanıt. Tekrar deneyin.'
      : 'Invalid response. Please try again.'
    );
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

export async function compareSkinPhotos(
  base64Before: string,
  base64After: string,
  lang: 'fr' | 'en' | 'tr',
  weeksBefore: number,
  weeksAfter: number
): Promise<string> {
  const langInstruction = lang === 'fr'
    ? 'Réponds en français.'
    : lang === 'tr'
    ? 'Türkçe yanıt ver.'
    : 'Reply in English.';

  const body = JSON.stringify({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 400,
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64Before.replace(/^data:image\/\w+;base64,/, '') } },
        { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64After.replace(/^data:image\/\w+;base64,/, '') } },
        { type: 'text', text: `Compare these two skin photos taken ${weeksAfter - weeksBefore} weeks apart. The first is week ${weeksBefore}, the second is week ${weeksAfter}. Describe visible changes in skin condition, texture, tone, or any improvements or concerns. Be specific, encouraging and concise (3-4 sentences max). ${langInstruction}` },
      ],
    }],
  });

  let response: Response;
  try {
    response = await fetchWithRetry(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
        'x-api-key': ANTHROPIC_API_KEY,
      },
      body,
    });
  } catch (err: any) {
    throw new Error(getErrorMessage(err, lang));
  }

  const data = await response.json();
  return data.content?.[0]?.text || '';
}