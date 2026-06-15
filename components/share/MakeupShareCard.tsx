/**
 * Makeup share card — a shareable "look recipe" for the chosen style.
 *
 * Renders inside ShareCardFrame (1080×1920, RITUEL header +
 * rituel.beauty footer). Shows the look name, the key colors as little
 * swatches, the personal note (why it suits her), and the products —
 * a personal, screenshot-worthy beauty card. No face image generated;
 * this is the recipe, beautifully framed.
 */
import { forwardRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { C } from '../../theme';
import ShareCardFrame from './ShareCardFrame';

// A small, warm palette to map common color words to swatches. Anything
// unknown falls back to a soft copper, so the card always looks intentional.
const COLOR_MAP: Record<string, string> = {
  bordeaux: '#6E2233', rouge: '#A6342E', rose: '#D98A9A', 'rose poudré': '#E4B3B3',
  corail: '#E8745B', pêche: '#F0A380', nude: '#C9A38A', taupe: '#8A7765',
  brun: '#5C4433', bronze: '#9C6B3F', or: '#C9A24B', 'or rosé': '#D7A98C',
  cuivre: '#B87333', prune: '#5E3A4C', mauve: '#9A7BA8', violet: '#6E4A8E',
  noir: '#2A2320', gris: '#8A8378', bleu: '#3E5A78', vert: '#4E6E55',
  champagne: '#E6D2A8', beige: '#D8C3A5', terracotta: '#B5613F', framboise: '#8E2F4C',
};

function swatch(name: string): string {
  const k = name.trim().toLowerCase();
  if (COLOR_MAP[k]) return COLOR_MAP[k];
  for (const key of Object.keys(COLOR_MAP)) {
    if (k.includes(key)) return COLOR_MAP[key];
  }
  return C.copper;
}

type Props = {
  kind: string;          // top label, e.g. "MON LOOK"
  lookName: string;
  occasion: string;
  colors?: string[];
  personalNote?: string;
  products?: string[];
  tagline: string;
};

const MakeupShareCard = forwardRef<View, Props>(function MakeupShareCard(
  { kind, lookName, occasion, colors, personalNote, products, tagline },
  ref
) {
  return (
    <ShareCardFrame ref={ref} kind={kind}>
      <View style={s.center}>
        <Text style={s.occasion}>{occasion}</Text>
        <Text style={s.name}>{lookName}</Text>

        {colors && colors.length > 0 && (
          <View style={s.swatches}>
            {colors.slice(0, 4).map((c, i) => (
              <View key={i} style={s.swatchItem}>
                <View style={[s.dot, { backgroundColor: swatch(c) }]} />
                <Text style={s.swatchLabel}>{c}</Text>
              </View>
            ))}
          </View>
        )}

        {personalNote ? <Text style={s.note}>{personalNote}</Text> : null}

        {products && products.length > 0 && (
          <Text style={s.products}>{products.slice(0, 6).join('  ·  ')}</Text>
        )}

        <Text style={s.tagline}>{tagline}</Text>
      </View>
    </ShareCardFrame>
  );
});

export default MakeupShareCard;

const s = StyleSheet.create({
  center: { alignItems: 'center' },
  occasion: { fontSize: 32, letterSpacing: 4, color: C.copper, textTransform: 'uppercase', marginBottom: 16 },
  name: { fontSize: 84, fontWeight: '300', color: C.espresso, fontFamily: 'Didot', textAlign: 'center', lineHeight: 92, marginBottom: 50 },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 28, marginBottom: 50 },
  swatchItem: { alignItems: 'center', width: 150 },
  dot: { width: 80, height: 80, borderRadius: 40, marginBottom: 12 },
  swatchLabel: { fontSize: 26, color: C.espresso, textAlign: 'center' },
  note: { fontSize: 34, fontStyle: 'italic', color: '#6B5245', textAlign: 'center', lineHeight: 46, marginBottom: 46, paddingHorizontal: 20 },
  products: { fontSize: 26, color: C.textSoft, textAlign: 'center', marginBottom: 50, lineHeight: 38 },
  tagline: { fontSize: 34, fontStyle: 'italic', color: '#9C8576', textAlign: 'center' },
});
