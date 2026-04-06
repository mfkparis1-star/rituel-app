import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTranslation } from '../../hooks/useTranslation';
import { supabase } from '../../lib/supabase';
import { getAwinLink } from '../../utils/awin';
import { analyzeSkin, getSkinTypeLabel, SkinAnalysisResult } from '../../utils/skinAnalysis';

const T = {
  bg: '#08080E', surface: '#11111A', border: '#1C1C2E',
  accent: '#C9A96E', rose: '#E87FAC', text: '#F5F0F8',
  textMid: '#B8B0C4', textSoft: '#6B6278',
  green: '#52DBA8', red: '#FF5272',
};

const AWIN_CATEGORIES = ['Serum', 'SPF', 'Mask', 'Toner', 'Moisturizer', 'Cleanser'];

type Step = 'intro' | 'analyzing' | 'result' | 'error';

export default function SkinAnalysisScreen() {
  const { t, lang } = useTranslation();
  const [step, setStep] = useState<Step>('intro');
  const [result, setResult] = useState<SkinAnalysisResult | null>(null);
  const [userProducts, setUserProducts] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const spinAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const copy = {
    title:       lang === 'fr' ? 'Analyse IA de votre peau' : lang === 'tr' ? 'AI Cilt Analiziniz' : 'AI Skin Analysis',
    subtitle:    lang === 'fr' ? 'Une photo suffit pour personnaliser votre routine' : lang === 'tr' ? 'Rutininizi kişiselleştirmek için bir fotoğraf yeterli' : 'One photo to personalize your routine',
    take_photo:  lang === 'fr' ? 'Prendre une photo' : lang === 'tr' ? 'Fotoğraf çek' : 'Take a photo',
    gallery:     lang === 'fr' ? 'Choisir depuis la galerie' : lang === 'tr' ? 'Galeriden seç' : 'Choose from gallery',
    back:        lang === 'fr' ? '← Retour' : lang === 'tr' ? '← Geri' : '← Back',
    analyzing:   lang === 'fr' ? 'Analyse en cours...' : lang === 'tr' ? 'Analiz ediliyor...' : 'Analyzing...',
    hint:        lang === 'fr' ? 'Notre IA examine votre peau' : lang === 'tr' ? "AI'mız cildinizi inceliyor" : 'Our AI is examining your skin',
    skin_type:   lang === 'fr' ? 'Type de peau' : lang === 'tr' ? 'Cilt tipi' : 'Skin type',
    detected:    lang === 'fr' ? 'Problèmes détectés' : lang === 'tr' ? 'Tespit edilenler' : 'Detected issues',
    recommends:  lang === 'fr' ? 'Recommandations' : lang === 'tr' ? 'Öneriler' : 'Recommendations',
    missing:     lang === 'fr' ? 'Produits manquants dans votre archive' : lang === 'tr' ? 'Arşivinizdeki eksik ürünler' : 'Missing from your archive',
    discover:    lang === 'fr' ? 'Découvrir →' : lang === 'tr' ? 'Keşfet →' : 'Discover →',
    save:        lang === 'fr' ? 'Enregistrer dans mon profil ✓' : lang === 'tr' ? 'Profilime kaydet ✓' : 'Save to my profile ✓',
    saved:       lang === 'fr' ? 'Profil mis à jour! ✓' : lang === 'tr' ? 'Profil güncellendi! ✓' : 'Profile updated! ✓',
    retry:       lang === 'fr' ? 'Réessayer' : lang === 'tr' ? 'Tekrar dene' : 'Try again',
    error_title: lang === 'fr' ? 'Analyse impossible' : lang === 'tr' ? 'Analiz yapılamadı' : 'Analysis failed',
    disclaimer:  lang === 'fr' ? 'Cette analyse est à titre informatif uniquement, non médicale.' : lang === 'tr' ? 'Bu analiz yalnızca bilgilendirme amaçlıdır, tıbbi tavsiye değildir.' : 'This analysis is for informational purposes only, not medical advice.',
    no_face:     lang === 'fr' ? 'Assurez-vous que votre visage est bien visible sur la photo.' : lang === 'tr' ? 'Lütfen fotoğrafta yüzünüzün net göründüğünden emin olun.' : 'Make sure your face is clearly visible in the photo.',
    tip_title:   lang === 'fr' ? 'Pour un meilleur résultat' : lang === 'tr' ? 'Daha iyi sonuç için' : 'For better results',
    tip1:        lang === 'fr' ? '☀️ Lumière naturelle' : lang === 'tr' ? '☀️ Doğal ışık' : '☀️ Natural light',
    tip2:        lang === 'fr' ? '🚫 Sans maquillage' : lang === 'tr' ? '🚫 Makyajsız' : '🚫 No makeup',
    tip3:        lang === 'fr' ? '📱 Visage centré' : lang === 'tr' ? '📱 Yüz ortada' : '📱 Face centered',
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        const uid = data.session.user.id;
        setUserId(uid);
        supabase.from('products').select('category').eq('user_id', uid).then(({ data: prods }) => {
          if (prods) setUserProducts([...new Set(prods.map((p: any) => p.category))]);
        });
      }
    });
  }, []);

  useEffect(() => {
    if (step === 'analyzing') {
      Animated.loop(
        Animated.timing(spinAnim, { toValue: 1, duration: 1200, useNativeDriver: true })
      ).start();
    }
    if (step === 'result') {
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    }
  }, [step]);

  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  const pickAndAnalyze = async (fromCamera: boolean) => {
    try {
      let imageResult;
      if (fromCamera) {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) { Alert.alert('', copy.no_face); return; }
        imageResult = await ImagePicker.launchCameraAsync({
          allowsEditing: true, aspect: [3, 4], quality: 0.7, base64: true,
        });
      } else {
        imageResult = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true, aspect: [3, 4], quality: 0.7, base64: true,
        });
      }

      if (imageResult.canceled || !imageResult.assets?.[0]) return;

      const asset = imageResult.assets[0];
      if (!asset.base64) { setErrorMsg(copy.no_face); setStep('error'); return; }

      setStep('analyzing');
      const base64 = `data:image/jpeg;base64,${asset.base64}`;
      const analysis = await analyzeSkin(base64, lang as 'fr' | 'en' | 'tr', userProducts);
      setResult(analysis);
      setStep('result');
    } catch (e: any) {
      setErrorMsg(e.message || 'Unknown error');
      setStep('error');
    }
  };

  const handleSave = async () => {
    if (!userId || !result) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').upsert({
      id: userId,
      skin_type: result.skinType,
      skin_issues: result.issues,
      skin_analyzed_at: new Date().toISOString(),
    });
    setSaving(false);
    if (error) { Alert.alert('Erreur', error.message); return; }
    Alert.alert('', copy.saved, [{ text: 'OK', onPress: () => router.back() }]);
  };

  const handleAwinPress = (category: string) => {
    const brandMap: Record<string, string> = {
      'Serum': 'Blissim', 'Moisturizer': 'Dr Pierre Ricaud', 'Cleanser': 'Diamond Smile',
      'SPF': 'Dr Pierre Ricaud', 'Mask': 'Laboratoires Uma', 'Toner': 'Blissim',
    };
    const brand = brandMap[category] || 'Blissim';
    const link = getAwinLink(brand);
    if (link) Linking.openURL(link);
  };

  if (step === 'intro') return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Text style={styles.backBtnText}>{copy.back}</Text>
      </TouchableOpacity>
      <View style={styles.header}>
        <Text style={styles.logoAccent}>✦</Text>
        <Text style={styles.title}>{copy.title}</Text>
        <Text style={styles.subtitle}>{copy.subtitle}</Text>
      </View>
      <View style={styles.tipsCard}>
        <Text style={styles.tipsTitle}>{copy.tip_title}</Text>
        <View style={styles.tipsRow}>
          <Text style={styles.tipItem}>{copy.tip1}</Text>
          <Text style={styles.tipItem}>{copy.tip2}</Text>
          <Text style={styles.tipItem}>{copy.tip3}</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.primaryBtn} onPress={() => pickAndAnalyze(true)}>
        <Text style={styles.primaryBtnText}>📷  {copy.take_photo}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.secondaryBtn} onPress={() => pickAndAnalyze(false)}>
        <Text style={styles.secondaryBtnText}>🖼  {copy.gallery}</Text>
      </TouchableOpacity>
      <Text style={styles.disclaimer}>{copy.disclaimer}</Text>
    </ScrollView>
  );

  if (step === 'analyzing') return (
    <View style={styles.centerContainer}>
      <Animated.View style={[styles.orbitOuter, { transform: [{ rotate: spin }] }]}>
        <View style={styles.orbitInner} />
      </Animated.View>
      <Text style={styles.analyzingText}>{copy.analyzing}</Text>
      <Text style={styles.analyzingHint}>{copy.hint}</Text>
    </View>
  );

  if (step === 'error') return (
    <View style={styles.centerContainer}>
      <Text style={styles.errorIcon}>⚠️</Text>
      <Text style={styles.errorTitle}>{copy.error_title}</Text>
      <Text style={styles.errorMsg}>{errorMsg}</Text>
      <TouchableOpacity style={styles.primaryBtn} onPress={() => setStep('intro')}>
        <Text style={styles.primaryBtnText}>{copy.retry}</Text>
      </TouchableOpacity>
    </View>
  );

  if (step === 'result' && result) return (
    <Animated.ScrollView style={[styles.container, { opacity: fadeAnim }]} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => setStep('intro')} style={styles.backBtn}>
        <Text style={styles.backBtnText}>{copy.back}</Text>
      </TouchableOpacity>
      <View style={styles.header}>
        <Text style={styles.logoAccent}>✦</Text>
        <Text style={styles.title}>{copy.title}</Text>
      </View>
      <View style={styles.resultCard}>
        <Text style={styles.resultSectionLabel}>{copy.skin_type}</Text>
        <View style={styles.skinTypeBadge}>
          <Text style={styles.skinTypeText}>{getSkinTypeLabel(result.skinType, lang as 'fr' | 'en' | 'tr')}</Text>
        </View>
      </View>
      <View style={styles.resultCard}>
        <Text style={styles.resultSectionLabel}>{copy.detected}</Text>
        <View style={styles.tagRow}>
          {result.issues.map((issue, i) => (
            <View key={i} style={styles.issueTag}>
              <Text style={styles.issueTagText}>{issue}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={styles.resultCard}>
        <Text style={styles.resultSectionLabel}>{copy.recommends}</Text>
        {result.recommendations.map((rec, i) => (
          <View key={i} style={styles.recRow}>
            <View style={styles.recDot} />
            <Text style={styles.recText}>{rec}</Text>
          </View>
        ))}
      </View>
      {result.missingCategories.length > 0 && (
        <View style={styles.resultCard}>
          <Text style={styles.resultSectionLabel}>{copy.missing}</Text>
          {result.missingCategories.map((cat, i) => (
            <TouchableOpacity key={i} style={styles.awinRow} onPress={() => handleAwinPress(cat)}>
              <Text style={styles.awinCat}>{cat}</Text>
              <TouchableOpacity style={styles.awinBtn} onPress={() => handleAwinPress(cat)}>
                <Text style={styles.awinBtnText}>{copy.discover}</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
      )}
      {userId && (
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#1A1208" /> : <Text style={styles.saveBtnText}>{copy.save}</Text>}
        </TouchableOpacity>
      )}
      <Text style={styles.disclaimer}>{copy.disclaimer}</Text>
    </Animated.ScrollView>
  );

  return null;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  content: { padding: 24, paddingTop: 60, paddingBottom: 40 },
  centerContainer: { flex: 1, backgroundColor: T.bg, alignItems: 'center', justifyContent: 'center', padding: 32 },
  backBtn: { marginBottom: 24 },
  backBtnText: { fontSize: 14, color: T.textSoft },
  header: { alignItems: 'center', marginBottom: 28 },
  logoAccent: { fontSize: 28, color: T.accent, marginBottom: 8 },
  title: { fontSize: 22, fontWeight: '700', color: T.text, textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, color: T.textSoft, textAlign: 'center', lineHeight: 20 },
  tipsCard: { backgroundColor: T.surface, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: T.border, marginBottom: 28 },
  tipsTitle: { fontSize: 11, color: T.textSoft, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 14, textAlign: 'center' },
  tipsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  tipItem: { fontSize: 12, color: T.textMid, textAlign: 'center' },
  primaryBtn: { backgroundColor: T.accent, borderRadius: 16, padding: 16, alignItems: 'center', marginBottom: 12 },
  primaryBtnText: { fontSize: 15, fontWeight: '700', color: '#1A1208' },
  secondaryBtn: { borderWidth: 1, borderColor: T.border, borderRadius: 16, padding: 16, alignItems: 'center', marginBottom: 24 },
  secondaryBtnText: { fontSize: 15, color: T.textMid },
  disclaimer: { fontSize: 11, color: T.textSoft, textAlign: 'center', lineHeight: 16, marginTop: 8 },
  orbitOuter: { width: 64, height: 64, borderRadius: 32, borderWidth: 2, borderColor: T.border, borderTopColor: T.accent, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  orbitInner: { width: 32, height: 32, borderRadius: 16, borderWidth: 1.5, borderColor: T.border, borderBottomColor: T.rose },
  analyzingText: { fontSize: 18, fontWeight: '600', color: T.text, marginBottom: 8 },
  analyzingHint: { fontSize: 13, color: T.textSoft },
  errorIcon: { fontSize: 44, marginBottom: 16 },
  errorTitle: { fontSize: 20, fontWeight: '700', color: T.text, marginBottom: 8 },
  errorMsg: { fontSize: 13, color: T.textSoft, textAlign: 'center', marginBottom: 24 },
  resultCard: { backgroundColor: T.surface, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: T.border, marginBottom: 12 },
  resultSectionLabel: { fontSize: 10, color: T.textSoft, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12 },
  skinTypeBadge: { backgroundColor: 'rgba(201,169,110,0.12)', borderRadius: 20, paddingHorizontal: 18, paddingVertical: 8, alignSelf: 'flex-start', borderWidth: 1, borderColor: 'rgba(201,169,110,0.25)' },
  skinTypeText: { fontSize: 16, fontWeight: '700', color: T.accent },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  issueTag: { backgroundColor: T.bg, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: T.border },
  issueTagText: { fontSize: 12, color: T.textMid },
  recRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  recDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: T.accent },
  recText: { fontSize: 13, color: T.text, flex: 1 },
  awinRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: T.border },
  awinCat: { fontSize: 14, color: T.text, fontWeight: '600' },
  awinBtn: { backgroundColor: 'rgba(201,169,110,0.12)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(201,169,110,0.25)' },
  awinBtnText: { fontSize: 12, color: T.accent, fontWeight: '600' },
  saveBtn: { backgroundColor: T.accent, borderRadius: 16, padding: 16, alignItems: 'center', marginTop: 8, marginBottom: 16 },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#1A1208' },
});