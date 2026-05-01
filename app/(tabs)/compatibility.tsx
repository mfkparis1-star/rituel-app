import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import PillButton from '../../components/ui/PillButton';
import PremiumCard from '../../components/ui/PremiumCard';
import { C, R, Sh, Sp, Type } from '../../theme';

type Compat = 'compatible' | 'caution' | 'avoid' | null;

function BackArrow({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M19 12H5" />
      <Path d="M12 19l-7-7 7-7" />
    </Svg>
  );
}

export default function CompatibilityScreen() {
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [result, setResult] = useState<Compat>(null);
  const [reason, setReason] = useState<string>('');

  const check = () => {
    if (!a.trim() || !b.trim()) return;
    // Phase 14: real AI check via edge function
    setResult('caution');
    setReason(
      'Combinaison à utiliser avec précaution. Espacez l\'application matin et soir pour limiter les irritations.'
    );
  };

  const reset = () => {
    setA('');
    setB('');
    setResult(null);
    setReason('');
  };

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.topBar}>
          <Pressable onPress={() => router.back()} style={s.backBtn} hitSlop={8}>
            <BackArrow color={C.espresso} />
          </Pressable>
        </View>

        <View style={s.header}>
          <Text style={s.title}>Compatibilité ingrédients</Text>
          <Text style={s.subtitle}>
            Vérifiez si deux actifs peuvent être utilisés ensemble.
          </Text>
        </View>

        <PremiumCard variant="white" style={s.inputCard}>
          <Text style={s.fieldLabel}>INGRÉDIENT 1</Text>
          <TextInput
            style={s.input}
            placeholder="ex: Rétinol"
            placeholderTextColor={C.textSoft}
            value={a}
            onChangeText={setA}
            autoCorrect={false}
          />
        </PremiumCard>

        <PremiumCard variant="white" style={s.inputCard}>
          <Text style={s.fieldLabel}>INGRÉDIENT 2</Text>
          <TextInput
            style={s.input}
            placeholder="ex: Vitamine C"
            placeholderTextColor={C.textSoft}
            value={b}
            onChangeText={setB}
            autoCorrect={false}
          />
        </PremiumCard>

        <PillButton
          label="Vérifier la compatibilité"
          variant="primary"
          fullWidth
          onPress={check}
          disabled={!a.trim() || !b.trim()}
          style={{ marginTop: Sp.sm }}
        />

        {result && (
          <View style={[s.resultCard, Sh.soft, resultStyle(result)]}>
            <Text style={[s.resultLabel, resultLabelStyle(result)]}>
              {resultText(result)}
            </Text>
            <Text style={s.resultPair}>
              {a} + {b}
            </Text>
            <Text style={s.resultReason}>{reason}</Text>
            <PillButton
              label="Nouvelle vérification"
              variant="ghost"
              size="sm"
              onPress={reset}
              style={{ marginTop: Sp.sm }}
            />
          </View>
        )}

        <Text style={s.disclaimer}>
          Conseils cosmétiques généraux. Pour une recommandation adaptée,
          consultez un professionnel.
        </Text>

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
});
