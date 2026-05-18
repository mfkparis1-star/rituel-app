import { Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { C, R, Sh, Sp } from '../../theme';
import { formatPriceFR } from '../../utils/format';

/**
 * AffiliateProductCard — Phase 17 polish
 *
 * Full-width editorial card. Image left (104x104 rounded), content
 * right (brand uppercase copper, product name, soft reason, price).
 * Cream surface, copper accents, soft shadow, 24px radius. Brand
 * initial fallback when no image — never a flat beige rectangle.
 *
 * Tone: soft luxury beauty editorial. NOT shopping spam, NOT
 * influencer card. Each card feels like a curated note, not an ad.
 */

export type AffiliateProductCardData = {
  id: string;
  brand: string;
  name: string;
  price?: string;
  imageUrl?: string;
  affiliateUrl: string;
  reason?: string;
};

type Props = {
  product: AffiliateProductCardData;
  onPress?: () => void;
};

function brandInitials(brand: string): string {
  if (!brand) return '·';
  const words = brand.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '·';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export default function AffiliateProductCard({ product, onPress }: Props) {
  const handlePress = async () => {
    if (onPress) onPress();
    if (!product.affiliateUrl) return;
    try {
      const supported = await Linking.canOpenURL(product.affiliateUrl);
      if (supported) {
        await Linking.openURL(product.affiliateUrl);
      }
    } catch {
      // silent — never crash UX from a bad URL
    }
  };

  const priceFR = formatPriceFR(product.price);

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        s.card,
        Sh.soft,
        pressed && { opacity: 0.92, transform: [{ scale: 0.995 }] },
      ]}
    >
      <View style={s.imageBox}>
        {product.imageUrl ? (
          <Image source={{ uri: product.imageUrl }} style={s.image} resizeMode="cover" />
        ) : (
          <View style={s.imageFallback}>
            <Text style={s.imageFallbackTxt}>{brandInitials(product.brand)}</Text>
          </View>
        )}
      </View>

      <View style={s.content}>
        <Text style={s.brand} numberOfLines={1}>{product.brand}</Text>
        <Text style={s.name} numberOfLines={2}>{product.name}</Text>
        {product.reason ? (
          <Text style={s.reason} numberOfLines={2}>{product.reason}</Text>
        ) : null}
        <View style={s.footerRow}>
          {priceFR ? <Text style={s.price}>{priceFR}</Text> : <View />}
          <Text style={s.cta}>Découvrir ›</Text>
        </View>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EFE6D7',
    alignItems: 'center',
  },
  imageBox: {
    width: 96,
    height: 96,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#FBF6F1',
    marginRight: 14,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FBF6F1',
  },
  imageFallbackTxt: {
    fontSize: 22,
    fontWeight: '300',
    color: C.copper,
    letterSpacing: 2,
    fontStyle: 'italic',
  },
  content: {
    flex: 1,
    paddingVertical: 2,
  },
  brand: {
    fontSize: 10,
    fontWeight: '700',
    color: C.copper,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  name: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3A2E25',
    lineHeight: 19,
    marginBottom: 4,
  },
  reason: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#7A6555',
    lineHeight: 16,
    marginBottom: 8,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  price: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3A2E25',
    letterSpacing: 0.2,
  },
  cta: {
    fontSize: 11,
    fontWeight: '500',
    fontStyle: 'italic',
    color: C.copper,
    letterSpacing: 0.3,
  },
});
