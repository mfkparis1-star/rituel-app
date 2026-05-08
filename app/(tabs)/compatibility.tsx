import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import PillButton from '../../components/ui/PillButton';
import PremiumCard from '../../components/ui/PremiumCard';
import { C, R, Sh, Sp, Type } from '../../theme';
import {
  checkPair,
  CompatStatus,
  IngredientKey,
  INGREDIENT_KEYS,
  INGREDIENT_LABELS,
} from '../../utils/compatibility';
import { COSMETIC_DISCLAIMER } from '../../utils/legal';

type Compat = 'compatible' | 'caution' | 'avoid' | null;

function statusToCompat(s: CompatStatus): Compat {
  if (s === 'ok') return 'compatible';
  if (s === 'warning') return 'caution';
  return 'avoid';
}

function BackArrow({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M19 12H5" />
      <Path d="M12 19l-7-7 7-7" />
    </Svg>
  );
}

export default function CompatibilityScreen() {
  const [pickStep, setPickStep] = useState<1 | 2>(1);
  const [key1, setKey1] = useState<IngredientKey | null>(null);
  const [key2, setKey2] = useState<IngredientKey | null>(null);
  const [result, setResult] = useState<Compat>(null);
  const [resultTitle, setResultTitle] = useState<string>('');
  const [resultExplanation, setResultExplanation] = useState<string>('');
  const [resultTip, setResultTip] = useState<string>('');

  const labels = INGREDIENT_LABELS.fr;

  const labelOf = (k: IngredientKey | null): string => {
    if (!k) return '';
    const idx = INGREDIENT_KEYS.indexOf(k);
    return idx >= 0 ? labels[idx] : '';
  };

  const selectIngredient = (k: IngredientKey) => {
    if (pickStep === 1) {
      setKey1(k);
      setPickStep(2);
      return;
    }
    if (k === key1) return; // can't pick same as ingredient 1
    setKey2(k);
    runCheck(key1!, k);
  };

  const runCheck = (k1: IngredientKey, k2: IngredientKey) => {
    const r = checkPair(k1, k2, 'fr');
    setResult(statusToCompat(r.status));
    setResultTitle(r.title);
    setResultExplanation(r.explanation);
    setResultTip(r.tip);
  };

  const reset = () => {
    setPickStep(1);
    setKey1(null);
    setKey2(null);
    setResult(null);
    setResultTitle('');
    setResultExplanation('');
    setResultTip('');
  };

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.topBar}>
          <Pressable onPress={() => router.replace('/(tabs)/ai-studio' as any)} style={s.backBtn} hitSlop={8}>
            <BackArrow color={C.espresso} />
          </Pressable>
        </View>

        <View style={s.header}>
          <Text style={s.title}>Compatibilité ingrédients</Text>
          <Text style={s.subtitle}>
            Vérifiez si deux actifs peuvent être utilisés ensemble.
          </Text>
        </View>

        {!result && (
          <>
            <View style={s.selectionRow}>
              <View style={[s.selectionBox, key1 && s.selectionBoxFilled]}>
                <Text style={s.selectionBoxLabel}>INGRÉDIENT 1</Text>
                <Text style={key1 ? s.selectionBoxValue : s.selectionBoxPlaceholder}>
                  {key1 ? labelOf(key1) : 'À choisir'}
                </Text>
              </View>
              <Text style={s.plus}>+</Text>
              <View style={[s.selectionBox, key2 && s.selectionBoxFilled]}>
                <Text style={s.selectionBoxLabel}>INGRÉDIENT 2</Text>
                <Text style={key2 ? s.selectionBoxValue : s.selectionBoxPlaceholder}>
                  {key2 ? labelOf(key2) : 'À choisir'}
                </Text>
              </View>
            </View>

            <Text style={s.stepHint}>
              {pickStep === 1
                ? 'Choisissez le premier ingrédient'
                : 'Choisissez le second ingrédient'}
            </Text>

            <View style={s.chipsBox}>
              {INGREDIENT_KEYS.map((k, idx) => {
                const isFirst = key1 === k;
                const isDisabled = pickStep === 2 && isFirst;
                const active = isFirst;
                return (
                  <Pressable
                    key={k}
                    onPress={() => !isDisabled && selectIngredient(k)}
                    disabled={isDisabled}
                    style={[
                      s.chip,
                      active && s.chipActive,
                      isDisabled && s.chipDisabled,
                    ]}
                  >
                    <Text
                      style={[
                        s.chipTxt,
                        active && s.chipTxtActive,
                        isDisabled && s.chipTxtDisabled,
                      ]}
                    >
                      {labels[idx]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {(key1 || key2) && (
              <Pressable onPress={reset} style={s.resetLinkBtn}>
                <Text style={s.resetLinkTxt}>Recommencer</Text>
              </Pressable>
            )}
          </>
        )}

        {result && (
          <View style={[s.resultCard, Sh.soft, resultStyle(result)]}>
            <Text style={[s.resultLabel, resultLabelStyle(result)]}>
              {resultText(result)}
            </Text>
            <Text style={s.resultPair}>
              {labelOf(key1)} + {labelOf(key2)}
            </Text>
            <Text style={s.resultTitle}>{resultTitle}</Text>
            <Text style={s.resultReason}>{resultExplanation}</Text>
            <View style={s.tipBox}>
              <Text style={s.tipLabel}>CONSEIL</Text>
              <Text style={s.tipTxt}>{resultTip}</Text>
            </View>
            <PillButton
              label="Nouvelle vérification"
              variant="ghost"
              size="sm"
              onPress={reset}
              style={{ marginTop: Sp.sm }}
            />
          </View>
        )}

        <Text style={s.disclaimer}>{COSMETIC_DISCLAIMER.fr}</Text>

        <View style={{ height: Sp.huge }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function resultText(r: Compat): string {
  if (r === 'compatible') return 'COMPATIBLE';
  if (r === 'caution') return 'À UTILISER AVEC PRÉCAUTION';
  if (r === 'avoid') return 'À ÉVITER ENSEMBLE';
  return '';
}

function resultStyle(r: Compat) {
  if (r === 'compatible') return { borderLeftWidth: 4, borderLeftColor: C.green };
  if (r === 'caution') return { borderLeftWidth: 4, borderLeftColor: C.orange };
  if (r === 'avoid') return { borderLeftWidth: 4, borderLeftColor: C.red };
  return {};
}

function resultLabelStyle(r: Compat) {
  if (r === 'compatible') return { color: C.green };
  if (r === 'caution') return { color: C.orange };
  if (r === 'avoid') return { color: C.red };
  return {};
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.appBg },
  scroll: { paddingHorizontal: Sp.lg, paddingTop: Sp.sm, paddingBottom: Sp.xl },
  topBar: { flexDirection: 'row', alignItems: 'center', marginBottom: Sp.md },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: C.white, alignItems: 'center', justifyContent: 'center',
    ...Sh.soft,
  },
  header: { marginBottom: Sp.lg, marginTop: Sp.sm },
  title: { ...Type.h1, marginBottom: 4 },
  subtitle: { ...Type.body, color: C.textMid },
  inputCard: { marginBottom: Sp.sm },
  fieldLabel: {
    fontSize: 10, fontWeight: '700', color: C.copper,
    letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: Sp.xs,
  },
  input: {
    backgroundColor: C.cream,
    borderRadius: R.sm,
    paddingHorizontal: Sp.md,
    paddingVertical: 12,
    fontSize: 14,
    color: C.text,
  },
  resultCard: {
    backgroundColor: C.white,
    borderRadius: R.lg,
    padding: Sp.lg,
    marginTop: Sp.lg,
  },
  resultLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.6,
    marginBottom: Sp.xs,
  },
  resultPair: {
    fontSize: 18,
    fontWeight: '600',
    color: C.text,
    marginBottom: Sp.sm,
  },
  resultReason: {
    fontSize: 14,
    color: C.textMid,
    lineHeight: 21,
  },
  disclaimer: {
    fontSize: 11,
    color: C.textSoft,
    textAlign: 'center',
    lineHeight: 17,
    marginTop: Sp.xl,
    paddingHorizontal: Sp.md,
  },
  selectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Sp.md,
  },
  selectionBox: {
    flex: 1,
    backgroundColor: C.white,
    borderRadius: R.md,
    padding: Sp.md,
    minHeight: 64,
    borderWidth: 1,
    borderColor: C.border,
    ...Sh.soft,
  },
  selectionBoxFilled: {
    borderColor: C.copper,
  },
  selectionBoxLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: C.copper,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  selectionBoxValue: {
    fontSize: 14,
    fontWeight: '600',
    color: C.text,
  },
  selectionBoxPlaceholder: {
    fontSize: 14,
    color: C.textSoft,
  },
  plus: {
    fontSize: 22,
    fontWeight: '700',
    color: C.copper,
    marginHorizontal: Sp.sm,
  },
  stepHint: {
    fontSize: 12,
    color: C.textMid,
    textAlign: 'center',
    marginBottom: Sp.md,
  },
  chipsBox: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Sp.md,
  },
  chip: {
    backgroundColor: C.white,
    borderRadius: R.full,
    paddingHorizontal: Sp.md,
    paddingVertical: 10,
    marginRight: Sp.xs,
    marginBottom: Sp.xs,
    borderWidth: 1,
    borderColor: C.border,
  },
  chipActive: {
    backgroundColor: C.espresso,
    borderColor: C.espresso,
  },
  chipDisabled: {
    opacity: 0.4,
  },
  chipTxt: {
    fontSize: 13,
    fontWeight: '500',
    color: C.text,
  },
  chipTxtActive: {
    color: C.white,
  },
  chipTxtDisabled: {
    color: C.textSoft,
  },
  resetLinkBtn: {
    alignSelf: 'center',
    paddingVertical: Sp.xs,
    paddingHorizontal: Sp.md,
  },
  resetLinkTxt: {
    fontSize: 12,
    color: C.copper,
    fontWeight: '500',
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: C.text,
    marginBottom: Sp.xs,
  },
  tipBox: {
    backgroundColor: C.cream,
    borderRadius: R.md,
    padding: Sp.md,
    marginTop: Sp.sm,
  },
  tipLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: C.copper,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  tipTxt: {
    fontSize: 13,
    color: C.text,
    lineHeight: 19,
  },
});
