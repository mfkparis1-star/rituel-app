/**
 * Compatibility share card (Phase 16E E2).
 *
 * Renders inside ShareCardFrame at 1080×1920. Shows the two products
 * being compared, a large status verdict, and a short explanation.
 */
import { forwardRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { C } from '../../theme';
import ShareCardFrame from './ShareCardFrame';

export type CompatStatus = 'compatible' | 'caution' | 'avoid';

type Props = {
  status: CompatStatus;
  productA: string;
  productB: string;
  title: string;
  explanation: string;
};

const STATUS_COPY: Record<CompatStatus, { label: string; color: string }> = {
  compatible: { label: 'COMPATIBLE',  color: '#3F7D63' },
  caution:    { label: 'PRUDENCE',    color: '#B07A2A' },
  avoid:      { label: 'À ÉVITER',    color: '#9B3A2E' },
};

const CompatibilityShareCard = forwardRef<View, Props>(function CompatibilityShareCard(
  { status, productA, productB, title, explanation },
  ref
) {
  const copy = STATUS_COPY[status];
  return (
    <ShareCardFrame ref={ref} kind="COMPATIBILITÉ">
      <View style={s.center}>
        <Text style={[s.statusLabel, { color: copy.color }]}>{copy.label}</Text>

        <View style={s.pairBox}>
          <Text style={s.product}>{productA}</Text>
          <Text style={s.plus}>+</Text>
          <Text style={s.product}>{productB}</Text>
        </View>

        <Text style={s.title}>{title}</Text>
        <Text style={s.explanation}>{explanation}</Text>

        <Text style={s.disclaimer}>
          Ce conseil ne remplace pas l\u2019avis d\u2019un dermatologue.
        </Text>
      </View>
    </ShareCardFrame>
  );
});

export default CompatibilityShareCard;

const s = StyleSheet.create({
  center: { alignItems: 'center' },
  statusLabel: {
    fontSize: 64,
    fontWeight: '700',
    letterSpacing: 6,
    marginBottom: 96,
  },
  pairBox: {
    alignItems: 'center',
    marginBottom: 80,
  },
  product: {
    fontSize: 44,
    color: C.espresso,
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 56,
  },
  plus: {
    fontSize: 36,
    color: C.copper,
    marginVertical: 16,
    fontWeight: '300',
  },
  title: {
    fontSize: 38,
    color: C.espresso,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 48,
  },
  explanation: {
    fontSize: 28,
    color: C.text,
    textAlign: 'center',
    lineHeight: 40,
    paddingHorizontal: 24,
    marginBottom: 80,
  },
  disclaimer: {
    fontSize: 18,
    color: C.textSoft,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
