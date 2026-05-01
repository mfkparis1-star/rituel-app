/**
 * Affiliate recommendations — Phase 13 light scoring engine.
 *
 * Reads from Supabase `affiliate_products` table when available, with a
 * safe static fallback so screens never break if the table is empty
 * or unreachable.
 *
 * Scoring:
 * - +1000  product matches a missing category (highest priority)
 * - +100   product matches user skin type
 * - +50    product matches a user concern
 *
 * Returns top N products, deduplicated by URL so the same offer never
 * appears twice when multiple brands list it.
 */
import { supabase } from '../lib/supabase';

export type AffiliateProduct = {
  id: string;
  brand: string;
  name: string;
  category: string;
  affiliateUrl: string;
  imageUrl?: string;
  price?: string;
  reason?: string;
  skinTypes?: string[];
  concerns?: string[];
};

export type RecommendContext = {
  skinType?: string;
  concerns?: string[];
  missingCategories?: string[];
  ownedProductIds?: string[];
};

const FALLBACK_PRODUCTS: AffiliateProduct[] = [
  {
    id: 'fb-1',
    brand: 'Caudalie',
    name: 'Vinoperfect Sérum éclat anti-taches',
    category: 'Serum',
    affiliateUrl: '',
    price: '49 €',
    reason: 'Pour une peau lumineuse',
    skinTypes: ['normal', 'dry', 'combination'],
    concerns: ['dark_spots', 'dullness'],
  },
  {
    id: 'fb-2',
    brand: 'La Roche-Posay',
    name: 'Toleriane Double Repair',
    category: 'Moisturizer',
    affiliateUrl: '',
    price: '18 €',
    reason: 'Hydratation quotidienne',
    skinTypes: ['dry', 'sensitive', 'normal'],
    concerns: ['dryness', 'sensitivity'],
  },
  {
    id: 'fb-3',
    brand: 'Avène',
    name: 'Cleanance crème nettoyante',
    category: 'Cleanser',
    affiliateUrl: '',
    price: '14 €',
    reason: 'Pour peau mixte',
    skinTypes: ['oily', 'combination'],
    concerns: ['acne', 'oiliness'],
  },
  {
    id: 'fb-4',
    brand: 'Bioderma',
    name: 'Photoderm SPF 50+',
    category: 'SPF',
    affiliateUrl: '',
    price: '22 €',
    reason: 'Protection solaire quotidienne',
    skinTypes: ['normal', 'oily', 'combination', 'dry', 'sensitive'],
    concerns: ['sun_damage', 'aging'],
  },
];

export function isValidAffiliateUrl(url: string | undefined): boolean {
  if (!url) return false;
  if (!url.startsWith('https://')) return false;
  if (url.includes('placeholder') || url.includes('example.com')) return false;
  return true;
}

function scoreProduct(p: AffiliateProduct, ctx: RecommendContext): number {
  let score = 0;
  if (ctx.missingCategories?.includes(p.category)) score += 1000;
  if (ctx.skinType && p.skinTypes?.includes(ctx.skinType)) score += 100;
  if (ctx.concerns?.some((c) => p.concerns?.includes(c))) score += 50;
  return score;
}

export async function getAffiliateRecommendations(
  ctx: RecommendContext,
  limit: number = 3
): Promise<AffiliateProduct[]> {
  let products: AffiliateProduct[] = [];

  try {
    const { data } = await supabase
      .from('affiliate_products')
      .select('*')
      .eq('active', true);

    if (Array.isArray(data) && data.length > 0) {
      products = data.map((row: any) => ({
        id: row.id,
        brand: row.brand,
        name: row.name,
        category: row.category,
        affiliateUrl: row.affiliate_url,
        imageUrl: row.image_url,
        price: row.price,
        reason: row.reason,
        skinTypes: row.skin_types,
        concerns: row.concerns,
      }));
    }
  } catch {
    // silent — fallback below
  }

  if (products.length === 0) {
    products = FALLBACK_PRODUCTS;
  }

  const ownedSet = new Set(ctx.ownedProductIds ?? []);
  const seenUrls = new Set<string>();

  const ranked = products
    .filter((p) => !ownedSet.has(p.id))
    .map((p) => ({ p, score: scoreProduct(p, ctx) }))
    .sort((a, b) => b.score - a.score)
    .filter(({ p }) => {
      if (!p.affiliateUrl) return true; // fallback placeholder allowed
      if (seenUrls.has(p.affiliateUrl)) return false;
      seenUrls.add(p.affiliateUrl);
      return true;
    })
    .slice(0, limit)
    .map(({ p }) => p);

  return ranked;
}
