const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY || '';

export type ProductRecognitionResult = {
  name: string;
  brand: string;
  category: string;
  description: string;
  confidence: number;
};

const CATEGORIES_MAP: Record<string, string> = {
  cleanser: 'Nettoyant',
  'face wash': 'Nettoyant',
  'facial cleanser': 'Nettoyant',
  moisturizer: 'Hydratant',
  cream: 'Hydratant',
  lotion: 'Hydratant',
  serum: 'Sérum',
  sunscreen: 'SPF',
  spf: 'SPF',
  toner: 'Tonique',
  essence: 'Tonique',
  mask: 'Masque',
  makeup: 'Maquillage',
  foundation: 'Maquillage',
  lipstick: 'Maquillage',
  mascara: 'Maquillage',
  perfume: 'Parfum',
  fragrance: 'Parfum',
  'body lotion': 'Corps',
  'body cream': 'Corps',
  shampoo: 'Cheveux',
  conditioner: 'Cheveux',
  'hair mask': 'Cheveux',
};

function normalizeCategory(raw: string): string {
  if (!raw) return 'Hydratant';
  const lower = raw.toLowerCase().trim();
  for (const [key, value] of Object.entries(CATEGORIES_MAP)) {
    if (lower.includes(key)) return value;
  }
  // Capitalize first letter as fallback
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
}

const SYSTEM_PROMPT = `You are an expert cosmetic product identifier. Look at the photo and identify the beauty/skincare/cosmetic product shown.
Return ONLY a valid JSON object with no extra text, no markdown, no backticks.
The JSON must have exactly these fields:
{
  "name": exact product name visible on the packaging (e.g. "Toleriane Double Repair Moisturizer"),
  "brand": brand name visible on the packaging (e.g. "La Roche-Posay"),
  "category": one of: "Nettoyant", "Hydratant", "Sérum", "SPF", "Tonique", "Masque", "Maquillage", "Parfum", "Corps", "Cheveux",
  "description": one short sentence describing the product type (e.g. "Moisturizing cream for sensitive skin"),
  "confidence": number between 0.1 and 1.0 (how sure you are about the identification)
}
If you cannot clearly identify the product, return your best guess with a low confidence value.
If the image shows no product or is unreadable, return name "Unknown", brand "Unknown", confidence 0.1.`;

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
      ? 'Connexion trop lente. Vérifiez votre réseau.'
      : lang === 'tr'
      ? 'Bağlantı yavaş. İnternetinizi kontrol edin.'
      : 'Connection too slow. Check your network.';
  }
  if (msg === '502' || msg === '503' || msg === '504') {
    return lang === 'fr'
      ? 'Service temporairement indisponible. Réessayez dans quelques instants.'
      : lang === 'tr'
      ? 'Servis geçici olarak kullanılamıyor.'
      : 'Service temporarily unavailable.';
  }
  if (msg === '401' || msg === '403') {
    return lang === 'fr'
      ? 'Erreur de configuration. Contactez le support.'
      : lang === 'tr'
      ? 'Yapılandırma hatası.'
      : 'Configuration error.';
  }
  return lang === 'fr'
    ? 'Reconnaissance impossible. Assurez-vous que le produit est bien visible.'
    : lang === 'tr'
    ? 'Tanıma yapılamadı. Ürünün net göründüğünden emin olun.'
    : 'Recognition failed. Make sure the product is clearly visible.';
}

export async function recognizeProduct(
  base64Image: string,
  lang: 'fr' | 'en' | 'tr' = 'fr'
): Promise<ProductRecognitionResult> {
  const langInstruction = lang === 'fr'
    ? 'Write the description in French.'
    : lang === 'tr'
    ? 'Write the description in Turkish.'
    : 'Write the description in English.';

  const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');

  const body = JSON.stringify({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    system: SYSTEM_PROMPT + ' ' + langInstruction,
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
            text: 'Identify this beauty product and return the JSON result.',
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
    const parsed = JSON.parse(clean);
    return {
      name: parsed.name || 'Unknown',
      brand: parsed.brand || 'Unknown',
      category: normalizeCategory(parsed.category || 'Hydratant'),
      description: parsed.description || '',
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5,
    };
  } catch {
    throw new Error(
      lang === 'fr' ? 'Réponse invalide. Réessayez.'
      : lang === 'tr' ? 'Geçersiz yanıt. Tekrar deneyin.'
      : 'Invalid response. Please try again.'
    );
  }
}

/**
 * Hybrid enrichment: Claude ürün bulduktan sonra OpenBeautyFacts'te arama yapar
 * Bulunursa ek bilgi ekler (ingredients, resmi image)
 */
export async function enrichWithOpenBeautyFacts(
  product: ProductRecognitionResult
): Promise<ProductRecognitionResult & { image_url?: string; ingredients?: string }> {
  if (!product.name || product.name === 'Unknown') return product;

  try {
    const query = encodeURIComponent(`${product.brand} ${product.name}`.trim());
    const url = `https://world.openbeautyfacts.org/cgi/search.pl?search_terms=${query}&search_simple=1&json=1&page_size=3`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    const json = await res.json();

    if (json.products && json.products.length > 0) {
      const p = json.products[0];
      return {
        ...product,
        image_url: p.image_url || undefined,
        ingredients: p.ingredients_text_fr || p.ingredients_text || undefined,
      };
    }
  } catch {
    // OpenBeautyFacts bulamazsa sorun yok, Claude'un verisini kullan
  }
  return product;
}
