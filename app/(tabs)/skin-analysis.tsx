import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import PillButton from '../../components/ui/PillButton';
import PremiumCard from '../../components/ui/PremiumCard';
import { C, R, Sh, Sp, Type } from '../../theme';
import { analyzeSkin, getSkinTypeLabel } from '../../utils/skinAnalysis';

type Step = 'intro' | 'analyzing' | 'result' | 'error';

type SkinResult = {
  skinType: string;
  issues: string[];
  recommendations: string[];
  missingCategories?: string[];
};

const TIPS = ['Lumière naturelle', 'Sans maquillage', 'Visage centré'];

function BackArrow({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M19 12H5" />
      <Path d="M12 19l-7-7 7-7" />
    </Svg>
  );
}

function Sparkle({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 2v6M12 16v6M2 12h6M16 12h6" />
      <Path d="M5 5l3 3M16 16l3 3M5 19l3-3M16 8l3-3" />
    </Svg>
  );
}

export default function SkinAnalysisScreen() {
  const [step, setStep] = useState<Step>('intro');
  const [result, setResult] = useState<SkinResult | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const spinAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (step === 'analyzing') {
      Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 2200,
          useNativeDriver: true,
        })
      ).start();
    } else {
      spinAnim.setValue(0);
    }
  }, [step]);

  useEffect(() => {
    if (step === 'result') {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [step]);

  const pickFromCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission requise', 'Veuillez autoriser l\'accès à la caméra.');
      return;
    }
    const r = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });
    if (!r.canceled && r.assets?.[0]?.base64) {
      runAnalysis(r.assets[0].base64);
    }
  };

  const pickFromGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission requise', 'Veuillez autoriser l\'accès aux photos.');
      return;
    }
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });
    if (!r.canceled && r.assets?.[0]?.base64) {
      runAnalysis(r.assets[0].base64);
    }
  };

  const runAnalysis = async (base64: string) => {
    setStep('analyzing');
    setPreviewImage(`data:image/jpeg;base64,${base64}`);
    setErrorMsg('');
    try {
      const parsed = await analyzeSkin(base64, 'fr');
      setResult({
        skinType: getSkinTypeLabel(parsed.skinType, 'fr'),
        issues: parsed.issues,
        recommendations: parsed.recommendations,
        missingCategories: parsed.missingCategories,
      });
      setStep('result');
    } catch (e: any) {
      const msg = e?.message || 'Une erreur est survenue. Réessayez.';
      setErrorMsg(msg);
      setStep('error');
    }
  };

  const reset = () => {
    setStep('intro');
    setResult(null);
    setPreviewImage(null);
    setErrorMsg('');
  };

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // ---------- INTRO ----------
  if (step === 'intro') {
    return (
      <SafeAreaView style={s.root} edges={['top']}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          <View style={s.topBar}>
            <Pressable onPress={() => router.replace('/(tabs)/ai-studio' as any)} style={s.backBtn} hitSlop={8}>
              <BackArrow color={C.espresso} />
            </Pressable>
          </View>

          <View style={s.heroBlock}>
            <View style={s.sparkleBox}>
              <Sparkle color={C.copper} />
            </View>
            <Text style={s.title}>Analyse IA de votre peau</Text>
            <Text style={s.subtitle}>
              Une photo suffit pour personnaliser votre routine
            </Text>
          </View>

          <PremiumCard variant="white" style={s.tipsCard}>
            <Text style={s.tipsLabel}>POUR UN MEILLEUR RÉSULTAT</Text>
            {TIPS.map((tip) => (
              <View key={tip} style={s.tipRow}>
                <View style={s.tipDot} />
                <Text style={s.tipText}>{tip}</Text>
              </View>
            ))}
          </PremiumCard>

          <View style={s.actions}>
            <PillButton
              label="Prendre une photo"
              variant="primary"
              fullWidth
              onPress={pickFromCamera}
            />
            <View style={{ height: Sp.sm }} />
            <PillButton
              label="Choisir depuis la galerie"
              variant="outline"
              fullWidth
              onPress={pickFromGallery}
            />
          </View>

          <Text style={s.disclaimer}>
            Cette analyse est à titre informatif uniquement, non médicale.
          </Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ---------- ANALYZING ----------
  if (step === 'analyzing') {
    return (
      <SafeAreaView style={s.root} edges={['top']}>
        <View style={s.centerWrap}>
          <Animated.View style={[s.spinner, { transform: [{ rotate: spin }] }]} />
          <Text style={s.loadingTitle}>Analyse en cours…</Text>
          <Text style={s.loadingSub}>Notre IA examine votre peau</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ---------- ERROR ----------
  if (step === 'error') {
    return (
      <SafeAreaView style={s.root} edges={['top']}>
        <View style={s.centerWrap}>
          <Text style={s.errorTitle}>Analyse impossible</Text>
          <Text style={s.errorMsg}>{errorMsg}</Text>
          <PillButton label="Réessayer" variant="primary" onPress={reset} />
        </View>
      </SafeAreaView>
    );
  }

  // ---------- RESULT ----------
  if (step === 'result' && result) {
    return (
      <SafeAreaView style={s.root} edges={['top']}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          <View style={s.topBar}>
            <Pressable onPress={reset} style={s.backBtn} hitSlop={8}>
              <BackArrow color={C.espresso} />
            </Pressable>
          </View>

          <Animated.View style={{ opacity: fadeAnim }}>
            {previewImage && (
              <View style={s.previewWrap}>
                <Image source={{ uri: previewImage }} style={s.preview} />
              </View>
            )}

            <View style={s.skinTypeBadge}>
              <Text style={s.skinTypeBadgeTxt}>Peau {result.skinType}</Text>
            </View>

            <Text style={s.sectionTitle}>Problèmes détectés</Text>
            {result.issues.map((issue, i) => (
              <View key={i} style={s.issueRow}>
                <View style={s.bullet} />
                <Text style={s.issueText}>{issue}</Text>
              </View>
            ))}

            <Text style={s.sectionTitle}>Recommandations</Text>
            {result.recommendations.map((rec, i) => (
              <PremiumCard key={i} variant="white" style={s.recoCard}>
                <Text style={s.recoText}>{rec}</Text>
              </PremiumCard>
            ))}

            {result.missingCategories && result.missingCategories.length > 0 && (
              <>
                <Text style={s.sectionTitle}>Produits manquants</Text>
                {result.missingCategories.map((cat, i) => (
                  <View key={i} style={s.missingRow}>
                    <Text style={s.missingCat}>{cat}</Text>
                  </View>
                ))}
              </>
            )}

            <PillButton
              label="Nouvelle analyse"
              variant="ghost"
              fullWidth
              onPress={reset}
              style={{ marginTop: Sp.lg }}
            />
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return null;
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.appBg },
  scroll: { paddingHorizontal: Sp.lg, paddingTop: Sp.sm, paddingBottom: Sp.huge },
  topBar: { flexDirection: 'row', alignItems: 'center', marginBottom: Sp.md },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Sh.soft,
  },
  heroBlock: {
    alignItems: 'center',
    marginTop: Sp.lg,
    marginBottom: Sp.xl,
  },
  sparkleBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.cream,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Sp.md,
  },
  title: {
    ...Type.h1,
    textAlign: 'center',
    marginBottom: Sp.xs,
    paddingHorizontal: Sp.md,
  },
  subtitle: {
    ...Type.body,
    color: C.textMid,
    textAlign: 'center',
    paddingHorizontal: Sp.md,
  },
  tipsCard: {
    marginBottom: Sp.xl,
  },
  tipsLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: C.copper,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: Sp.md,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Sp.sm,
  },
  tipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.copper,
    marginRight: Sp.sm,
  },
  tipText: {
    fontSize: 14,
    color: C.text,
  },
  actions: {
    marginBottom: Sp.lg,
  },
  disclaimer: {
    fontSize: 11,
    color: C.textSoft,
    textAlign: 'center',
    lineHeight: 17,
    marginTop: Sp.md,
    paddingHorizontal: Sp.md,
  },
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Sp.lg,
  },
  spinner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: C.cream,
    borderTopColor: C.copper,
    marginBottom: Sp.lg,
  },
  loadingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: C.text,
    marginBottom: 4,
  },
  loadingSub: {
    fontSize: 13,
    color: C.textMid,
  },
  errorTitle: {
    ...Type.h2,
    marginBottom: Sp.xs,
  },
  errorMsg: {
    fontSize: 14,
    color: C.textMid,
    textAlign: 'center',
    marginBottom: Sp.lg,
    paddingHorizontal: Sp.lg,
  },
  previewWrap: {
    alignItems: 'center',
    marginBottom: Sp.lg,
  },
  preview: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    borderColor: C.white,
  },
  skinTypeBadge: {
    alignSelf: 'center',
    backgroundColor: C.espresso,
    paddingHorizontal: Sp.md,
    paddingVertical: 6,
    borderRadius: R.full,
    marginBottom: Sp.lg,
  },
  skinTypeBadgeTxt: {
    color: C.white,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  sectionTitle: {
    ...Type.h3,
    marginTop: Sp.md,
    marginBottom: Sp.sm,
  },
  issueRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Sp.xs,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.copper,
    marginTop: 8,
    marginRight: Sp.sm,
  },
  issueText: {
    fontSize: 14,
    color: C.text,
    flex: 1,
  },
  recoCard: {
    marginBottom: Sp.xs,
  },
  recoText: {
    fontSize: 14,
    color: C.text,
  },
  missingRow: {
    backgroundColor: C.cream,
    borderRadius: R.sm,
    padding: Sp.sm,
    marginBottom: Sp.xs,
  },
  missingCat: {
    fontSize: 13,
    fontWeight: '600',
    color: C.espresso,
  },
});
