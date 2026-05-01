import { Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { C, R, Sh, Sp } from '../../theme';

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
  variant?: 'horizontal' | 'vertical';
  onPress?: () => void;
};

export default function AffiliateProductCard({
  product,
  variant = 'vertical',
  onPress,
}: Props) {
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

  const isHorizontal = variant === 'horizontal';

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        s.card,
        Sh.soft,
        isHorizontal ? s.horizontal : s.vertical,
        pressed && { opacity: 0.85 },
      ]}
    >
      <View style={[s.imageBox, isHorizontal ? s.imageHorizontal : s.imageVertical]}>
        {product.imageUrl ? (
          <Image source={{ uri: product.imageUrl }} style={s.image} resizeMode="cover" />
        ) : (
          <View style={s.imagePlaceholder} />
        )}
      </View>
      <View style={s.content}>
        <Text style={s.brand} numberOfLines={1}>{product.brand}</Text>
        <Text style={s.name} numberOfLines={2}>{product.name}</Text>
        {product.reason && (
          <Text style={s.reason} numberOfLines={2}>{product.reason}</Text>
        )}
        {product.price && <Text style={s.price}>{product.price}</Text>}
        {isHorizontal && (
          <Text style={s.cta}>Voir le produit ›</Text>
        )}
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: C.white,
    borderRadius: R.md,
    overflow: 'hidden',
  },
  vertical: {
    width: 160,
    marginRight: Sp.sm,
  },
  horizontal: {
    flexDirection: 'row',
    marginBottom: Sp.sm,
    padding: Sp.sm,
    alignItems: 'center',
  },
  imageBox: {
    backgroundColor: C.cream,
    overflow: 'hidden',
  },
  imageVertical: { width: '100%', height: 140 },
  imageHorizontal: {
    width: 64,
    height: 64,
    borderRadius: R.sm,
    marginRight: Sp.md,
  },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: C.cream,
  },
  content: { padding: Sp.sm, flex: 1 },
  brand: {
    fontSize: 10,
    fontWeight: '600',
    color: C.copper,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  name: {
    fontSize: 13,
    fontWeight: '500',
    color: C.text,
    lineHeight: 18,
    marginBottom: Sp.xxs,
  },
  reason: {
    fontSize: 11,
    color: C.textMid,
    lineHeight: 15,
    marginBottom: Sp.xxs,
  },
  price: {
    fontSize: 12,
    fontWeight: '600',
    color: C.espresso,
    marginTop: 2,
  },
  cta: {
    fontSize: 11,
    fontWeight: '600',
    color: C.copper,
    marginTop: 6,
  },
});
