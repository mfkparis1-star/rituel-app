/**
 * Luxury editorial frame used by Phase 16E shareable cards.
 *
 * Fixed 1080×1920 aspect (Instagram Stories). Cream background, soft
 * copper border, espresso text, tiny disclaimer footer. The actual
 * content lives in children; this component owns the chrome (header
 * branding, footer, padding, ratio).
 *
 * Capture target: pass a ref via `viewRef` and call captureAndShare
 * from utils/shareCard.ts.
 */
import { forwardRef, ReactNode } from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { C, R, Sp } from '../../theme';

type Props = {
  kind: string;          // top label, e.g. "COMPATIBILITÉ"
  children: ReactNode;
  style?: ViewStyle;
};

const ShareCardFrame = forwardRef<View, Props>(function ShareCardFrame(
  { kind, children, style },
  ref
) {
  return (
    <View ref={ref} collapsable={false} style={[s.frame, style]}>
      <View style={s.header}>
        <Text style={s.brand}>RITUEL</Text>
        <View style={s.divider} />
        <Text style={s.kind}>{kind}</Text>
      </View>

      <View style={s.body}>{children}</View>

      <View style={s.footer}>
        <Text style={s.footerTxt}>Créé avec Rituel · rituel.beauty</Text>
      </View>
    </View>
  );
});

export default ShareCardFrame;

const s = StyleSheet.create({
  frame: {
    width: 1080,
    height: 1920,
    backgroundColor: C.cream,
    paddingHorizontal: 96,
    paddingTop: 120,
    paddingBottom: 96,
    borderRadius: R.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: 80,
  },
  brand: {
    fontSize: 56,
    letterSpacing: 12,
    color: C.espresso,
    fontWeight: '300',
  },
  divider: {
    width: 80,
    height: 2,
    backgroundColor: C.copper,
    marginTop: 28,
    marginBottom: 28,
  },
  kind: {
    fontSize: 22,
    letterSpacing: 8,
    color: C.copper,
    fontWeight: '600',
  },
  body: {
    flex: 1,
    justifyContent: 'center',
  },
  footer: {
    alignItems: 'center',
    paddingTop: 40,
  },
  footerTxt: {
    fontSize: 22,
    color: C.textMid,
    letterSpacing: 2,
    fontStyle: 'italic',
  },
});
