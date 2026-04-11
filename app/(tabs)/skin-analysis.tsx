import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from '../../hooks/useTranslation';
import { supabase } from '../../lib/supabase';
import { getAwinLink } from '../../utils/awin';
import { analyzeSkin, getSkinTypeLabel, SkinAnalysisResult } from '../../utils/skinAnalysis';

const T = {
  bg: '#FDF8F5', bg2: '#F5EDE6', accent: '#B8856A', accent2: '#8C5E46',
  dark: '#1A1310', mid: '#6B5245', light: '#E8D5C8', white: '#FFFFFF',
  green: '#5B9B6B', red: '#C0392B', orange: '#E67E22',
};

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

  const lbl = (fr: string, tr: string, en: string) => lang === 'fr' ? fr : lang === 'tr' ? tr : en;

  const copy = {
    title:      lbl('Analyse IA de votre peau', 'AI Cilt Analiziniz', 'AI Skin Analysis'),
    subtitle:   lbl('Une photo suffit pour personnaliser votre routine', 'Rutininizi kişiselleştirmek için bir fotoğraf yeterli', 'One photo to personalize your routine'),
    take_photo: lbl('Prendre une photo', 'Fotoğraf çek', 'Take a photo'),
    gallery:    lbl('Choisir depuis la galerie', 'Galeriden seç', 'Choose from gallery'),
    back:       lbl('← Retour', '← Geri', '← Back'),
    analyzing:  lbl('Analyse en cours...', 'Analiz ediliyor...', 'Analyzing...'),
    hint:       lbl('Notre IA examine votre peau', "AI'mız cildinizi inceliyor", 'Our AI is examining your skin'),
    skin_type:  lbl('Type de peau', 'Cilt tipi', 'Skin type'),
    detected:   lbl('Problèmes détectés', 'Tespit edilenler', 'Detected issues'),
    recommends: lbl('Recommandations', 'Öneriler', 'Recommendations'),
    missing:    lbl('Produits manquants dans votre archive', 'Arşivinizdeki eksik ürünler', 'Missing from your archive'),
    discover:   lbl('Découvrir →', 'Keşfet →', 'Discover →'),
    save:       lbl('Enregistrer dans mon profil ✓', 'Profilime kaydet ✓', 'Save to my profile ✓'),
    saved:      lbl('Profil mis à jour! ✓', 'Profil güncellendi! ✓', 'Profile updated! ✓'),
    retry:      lbl('Réessayer', 'Tekrar dene', 'Try again'),
    error_title:lbl('Analyse impossible', 'Analiz yapılamadı', 'Analysis failed'),
    disclaimer: lbl('Cette analyse est à titre informatif uniquement, non médicale.', 'Bu analiz yalnızca bilgilendirme amaçlıdır, tıbbi tavsiye değildir.', 'This analysis is for informational purposes only, not medical advice.'),
    no_face:    lbl('Assurez-vous que votre visage est bien visible sur la photo.', 'Lütfen fotoğrafta yüzünüzün net göründüğünden emin olun.', 'Make sure your face is clearly visible in the photo.'),
    tip_title:  lbl('Pour un meilleur résultat', 'Daha iyi sonuç için', 'For better results'),
    tip1:       lbl('☀️ Lumière naturelle', '☀️ Doğal ışık', '☀️ Natural light'),
    tip2:       lbl('🚫 Sans maquillage', '🚫 Makyajsız', '🚫 No makeup'),
    tip3:       lbl('📱 Visage centré', '📱 Yüz ortada', '📱 Face centered'),
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
        imageResult = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [3, 4], quality: 0.7, base64: true });
      } else {
        imageResult = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [3, 4], quality: 0.7, base64: true });
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
      id: userId, skin_type: result.skinType,
      skin_issues: result.issues, skin_analyzed_at: new Date().toISOString(),
    });
    setSaving(false);
    if (error) { Alert.alert('Erreur', error.message); return; }
    Alert.alert('', copy.saved, [{ text: 'OK', onPress: () => router.back() }]);
  };

  const handleAwinPress = (category: string) => {
    const brandMap: Record<string, string> = {
      'Serum': 'Blissim', 'Moisturizer': 'Dr Pierre Ricaud', 'Cleanser': 'Diamond Smile',
      'SPF': 'Dr Pierre Ricaud', 'Mask': 'Uma', 'Toner': 'Blissim',
    };
    const link = getAwinLink(brandMap[category] || 'Blissim');
    if (link) Linking.openURL(link);
  };

  if (step === 'intro') return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
        <Text style={s.backBtnText}>{copy.back}</Text>
      </TouchableOpacity>
      <View style={s.header}>
        <Text style={s.logoAccent}>✦</Text>
        <Text style={s.title}>{copy.title}</Text>
        <Text style={s.subtitle}>{copy.subtitle}</Text>
      </View>
      <View style={s.tipsCard}>
        <Text style={s.tipsTitle}>{copy.tip_title}</Text>
        <View style={s.tipsRow}>
          <Text style={s.tipItem}>{copy.tip1}</Text>
          <Text style={s.tipItem}>{copy.tip2}</Text>
          <Text style={s.tipItem}>{copy.tip3}</Text>
        </View>
      </View>
      <TouchableOpacity style={s.primaryBtn} onPress={() => pickAndAnalyze(true)}>
        <Text style={s.primaryBtnText}>📷  {copy.take_photo}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={s.secondaryBtn} onPress={() => pickAndAnalyze(false)}>
        <Text style={s.secondaryBtnText}>🖼  {copy.gallery}</Text>
      </TouchableOpacity>
      <Text style={s.disclaimer}>{copy.disclaimer}</Text>
    </ScrollView>
  );

  if (step === 'analyzing') return (
    <View style={s.centerContainer}>
      <Animated.View style={[s.orbitOuter, { transform: [{ rotate: spin }] }]}>
        <View style={s.orbitInner} />
      </Animated.View>
      <Text style={s.analyzingText}>{copy.analyzing}</Text>
      <Text style={s.analyzingHint}>{copy.hint}</Text>
    </View>
  );

  if (step === 'error') return (
    <View style={s.centerContainer}>
      <Text style={s.errorIcon}>⚠️</Text>
      <Text style={s.errorTitle}>{copy.error_title}</Text>
      <Text style={s.errorMsg}>{errorMsg}</Text>
      <TouchableOpacity style={s.primaryBtn} onPress={() => setStep('intro')}>
        <Text style={s.primaryBtnText}>{copy.retry}</Text>
      </TouchableOpacity>
    </View>
  );

  if (step === 'result' && result) return (
    <Animated.ScrollView style={[s.container, { opacity: fadeAnim }]} contentContainerStyle={s.content}>
      <TouchableOpacity onPress={() => setStep('intro')} style={s.backBtn}>
        <Text style={s.backBtnText}>{copy.back}</Text>
      </TouchableOpacity>
      <View style={s.header}>
        <Text style={s.logoAccent}>✦</Text>
        <Text style={s.title}>{copy.title}</Text>
      </View>
      <View style={s.resultCard}>
        <Text style={s.resultLabel}>{copy.skin_type}</Text>
        <View style={s.skinTypeBadge}>
          <Text style={s.skinTypeText}>{getSkinTypeLabel(result.skinType, lang as 'fr' | 'en' | 'tr')}</Text>
        </View>
      </View>
      <View style={s.resultCard}>
        <Text style={s.resultLabel}>{copy.detected}</Text>
        <View style={s.tagRow}>
          {result.issues.map((issue, i) => (
            <View key={i} style={s.issueTag}>
              <Text style={s.issueTagText}>{issue}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={s.resultCard}>
        <Text style={s.resultLabel}>{copy.recommends}</Text>
        {result.recommendations.map((rec, i) => (
          <View key={i} style={s.recRow}>
            <View style={s.recDot} />
            <Text style={s.recText}>{rec}</Text>
          </View>
        ))}
      </View>
      {result.missingCategories.length > 0 && (
        <View style={s.resultCard}>
          <Text style={s.resultLabel}>{copy.missing}</Text>
          {result.missingCategories.map((cat, i) => (
            <TouchableOpacity key={i} style={s.awinRow} onPress={() => handleAwinPress(cat)}>
              <Text style={s.awinCat}>{cat}</Text>
              <View style={s.awinBtn}>
                <Text style={s.awinBtnText}>{copy.discover}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
      {userId && (
        <TouchableOpacity style={s.saveBtn} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color={T.white} /> : <Text style={s.saveBtnText}>{copy.save}</Text>}
        </TouchableOpacity>
      )}
      <Text style={s.disclaimer}>{copy.disclaimer}</Text>
    </Animated.ScrollView>
  );

  return null;
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  content: { padding: 22, paddingTop: 60, paddingBottom: 40 },
  centerContainer: { flex: 1, backgroundColor: T.bg, alignItems: 'center', justifyContent: 'center', padding: 32 },
  backBtn: { marginBottom: 20 },
  backBtnText: { fontSize: 13, color: T.mid },
  header: { alignItems: 'center', marginBottom: 24 },
  logoAccent: { fontSize: 22, color: T.accent, marginBottom: 8 },
  title: { fontSize: 22, fontWeight: '300', color: T.dark, textAlign: 'center', marginBottom: 6, letterSpacing: 0.3 },
  subtitle: { fontSize: 13, color: T.mid, textAlign: 'center', lineHeight: 20 },
  tipsCard: { backgroundColor: T.white, borderRadius: 18, padding: 18, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  tipsTitle: { fontSize: 9, color: T.mid, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 14, textAlign: 'center' },
  tipsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  tipItem: { fontSize: 12, color: T.dark, textAlign: 'center' },
  primaryBtn: { backgroundColor: T.accent, borderRadius: 100, padding: 16, alignItems: 'center', marginBottom: 12 },
  primaryBtnText: { fontSize: 14, fontWeight: '500', color: T.white },
  secondaryBtn: { borderWidth: 1, borderColor: T.light, borderRadius: 100, padding: 14, alignItems: 'center', marginBottom: 24, backgroundColor: T.white },
  secondaryBtnText: { fontSize: 14, color: T.mid },
  disclaimer: { fontSize: 10, color: T.light, textAlign: 'center', lineHeight: 16, marginTop: 8 },
  orbitOuter: { width: 64, height: 64, borderRadius: 32, borderWidth: 2, borderColor: T.light, borderTopColor: T.accent, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  orbitInner: { width: 32, height: 32, borderRadius: 16, borderWidth: 1.5, borderColor: T.light, borderBottomColor: T.accent },
  analyzingText: { fontSize: 17, fontWeight: '300', color: T.dark, marginBottom: 8 },
  analyzingHint: { fontSize: 13, color: T.mid },
  errorIcon: { fontSize: 44, marginBottom: 16 },
  errorTitle: { fontSize: 18, fontWeight: '300', color: T.dark, marginBottom: 8 },
  errorMsg: { fontSize: 13, color: T.mid, textAlign: 'center', marginBottom: 24 },
  resultCard: { backgroundColor: T.white, borderRadius: 18, padding: 18, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  resultLabel: { fontSize: 9, color: T.mid, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12 },
  skinTypeBadge: { backgroundColor: 'rgba(184,133,106,0.1)', borderRadius: 100, paddingHorizontal: 16, paddingVertical: 8, alignSelf: 'flex-start', borderWidth: 1, borderColor: 'rgba(184,133,106,0.2)' },
  skinTypeText: { fontSize: 15, fontWeight: '500', color: T.accent },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  issueTag: { backgroundColor: T.bg2, borderRadius: 100, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: T.light },
  issueTagText: { fontSize: 11, color: T.mid },
  recRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  recDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: T.accent },
  recText: { fontSize: 13, color: T.dark, flex: 1 },
  awinRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: T.bg2 },
  awinCat: { fontSize: 13, color: T.dark, fontWeight: '500' },
  awinBtn: { backgroundColor: T.bg2, borderRadius: 100, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1, borderColor: T.light },
  awinBtnText: { fontSize: 11, color: T.accent },
  saveBtn: { backgroundColor: T.accent, borderRadius: 100, padding: 16, alignItems: 'center', marginTop: 8, marginBottom: 16 },
  saveBtnText: { fontSize: 14, fontWeight: '500', color: T.white },
});