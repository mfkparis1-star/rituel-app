import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { router, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTranslation } from '../hooks/useTranslation';
import { supabase } from '../lib/supabase';
import { enrichWithOpenBeautyFacts, recognizeProduct } from '../utils/productAI';

const T = {
  bg: '#FDF8F5', bg2: '#F5EDE6', accent: '#B8856A', accent2: '#8C5E46',
  dark: '#1A1310', mid: '#6B5245', light: '#E8D5C8', white: '#FFFFFF',
  green: '#5B9B6B', red: '#C0392B',
};

const CATEGORIES_FR = ['Nettoyant','Hydratant','Sérum','SPF','Tonique','Masque','Maquillage','Parfum','Corps','Cheveux'];
const CATEGORIES_EN = ['Cleanser','Moisturizer','Serum','SPF','Toner','Mask','Makeup','Perfume','Body','Hair'];
const CATEGORIES_TR = ['Temizleyici','Nemlendirici','Serum','SPF','Tonik','Maske','Makyaj','Parfüm','Vücut','Saç'];

type Step = 'menu' | 'ai-photo' | 'ai-result' | 'barcode' | 'search' | 'manual';

type AIProduct = {
  name: string;
  brand: string;
  category: string;
  description?: string;
  image_url?: string;
  ingredients?: string;
  confidence: number;
};

export default function AddProductScreen() {
  const { lang } = useTranslation();
  const [step, setStep] = useState<Step>('menu');
  const [user, setUser] = useState<any>(null);
  const [permission, requestPermission] = useCameraPermissions();

  // AI photo states
  const [aiImageUri, setAiImageUri] = useState<string | null>(null);
  const [aiImageBase64, setAiImageBase64] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AIProduct | null>(null);

  // Barcode states
  const [barcodeScanned, setBarcodeScanned] = useState(false);
  const [barcodeLoading, setBarcodeLoading] = useState(false);

  // Database search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Form states (used by AI result, barcode result, manual, search)
  const [brand, setBrand] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Hydratant');
  const [price, setPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [openedAt, setOpenedAt] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const CATEGORIES = lang === 'tr' ? CATEGORIES_TR : lang === 'fr' ? CATEGORIES_FR : CATEGORIES_EN;
  const lbl = (fr: string, tr: string, en: string) => lang === 'fr' ? fr : lang === 'tr' ? tr : en;

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user || null));
  }, []);

  // ========= AI PHOTO FLOW =========

  const pickImageFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      setAiImageUri(result.assets[0].uri);
      const base64 = result.assets[0].base64 ? `data:image/jpeg;base64,${result.assets[0].base64}` : null;
      setAiImageBase64(base64);
      if (base64) analyzeImage(base64);
    }
  };

  const takeAiPhoto = async () => {
    const cameraPerm = await ImagePicker.requestCameraPermissionsAsync();
    if (!cameraPerm.granted) {
      Alert.alert(lbl('Autorisation requise', 'İzin gerekli', 'Permission required'),
        lbl('Veuillez autoriser la caméra.', 'Kamera izni verin.', 'Please allow camera access.'));
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      setAiImageUri(result.assets[0].uri);
      const base64 = result.assets[0].base64 ? `data:image/jpeg;base64,${result.assets[0].base64}` : null;
      setAiImageBase64(base64);
      if (base64) analyzeImage(base64);
    }
  };

  const analyzeImage = async (base64: string) => {
    setAiLoading(true);
    setAiResult(null);
    try {
      const recognized = await recognizeProduct(base64, lang as any);
      // Enrich with OpenBeautyFacts in parallel
      const enriched = await enrichWithOpenBeautyFacts(recognized);
      setAiResult(enriched);

      // Pre-fill form
      setName(enriched.name);
      setBrand(enriched.brand);
      setCategory(enriched.category);
      setNotes(enriched.ingredients ? `${lbl('Ingrédients', 'İçerikler', 'Ingredients')}: ${enriched.ingredients.slice(0, 200)}` : (enriched.description || ''));
      setImageUrl(enriched.image_url || null);

      setStep('ai-result');
    } catch (e: any) {
      Alert.alert(lbl('Erreur', 'Hata', 'Error'), e?.message || '');
    } finally {
      setAiLoading(false);
    }
  };

  // ========= BARCODE FLOW =========

  const handleBarcode = async ({ data }: { data: string }) => {
    if (barcodeScanned || barcodeLoading) return;
    setBarcodeScanned(true);
    setBarcodeLoading(true);
    try {
      const res = await fetch(`https://world.openbeautyfacts.org/api/v0/product/${data}.json`);
      const json = await res.json();
      if (json.status === 1 && json.product) {
        const p = json.product;
        setName(p.product_name || '');
        setBrand(p.brands || '');
        setCategory('Hydratant');
        setImageUrl(p.image_url || null);
        setNotes(p.ingredients_text_fr || p.ingredients_text ? `${lbl('Ingrédients', 'İçerikler', 'Ingredients')}: ${(p.ingredients_text_fr || p.ingredients_text).slice(0, 200)}` : '');
        setStep('ai-result');
      } else {
        Alert.alert(
          lbl('Produit non trouvé', 'Ürün bulunamadı', 'Product not found'),
          lbl('Essayez avec la photo AI à la place.', 'Onun yerine AI foto deneyin.', 'Try AI photo recognition instead.'),
          [{ text: 'OK', onPress: () => setBarcodeScanned(false) }]
        );
      }
    } catch {
      Alert.alert(lbl('Erreur', 'Hata', 'Error'), '');
      setBarcodeScanned(false);
    } finally {
      setBarcodeLoading(false);
    }
  };

  // ========= DATABASE SEARCH FLOW =========

  const searchDatabase = async (q: string) => {
    setSearchQuery(q);
    if (q.length < 2) { setSearchResults([]); return; }
    setSearchLoading(true);
    const { data } = await supabase.from('beauty_products').select('*').or(`name.ilike.%${q}%,brand.ilike.%${q}%`).limit(10);
    if (data) setSearchResults(data);
    setSearchLoading(false);
  };

  const selectFromSearch = (p: any) => {
    setName(p.name);
    setBrand(p.brand);
    setCategory(p.category || 'Hydratant');
    setNotes(p.description || '');
    setImageUrl(null);
    setStep('ai-result');
  };

  // ========= SAVE FLOW =========

  const saveProduct = async () => {
    if (!brand.trim() || !name.trim()) {
      Alert.alert('', lbl('Marque et nom obligatoires', 'Marka ve isim zorunlu', 'Brand and name required'));
      return;
    }
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('products').insert({
      user_id: user.id,
      brand: brand.trim(),
      name: name.trim(),
      category,
      price: parseFloat(price) || 0,
      notes,
      icon: '○',
      status: 'active',
      image_url: imageUrl || null,
      opened_at: openedAt || null,
    });
    if (error) {
      Alert.alert('Erreur', error.message);
      setSaving(false);
    } else {
      router.back();
    }
  };

  // ========= RENDERERS =========

  const renderMenu = () => (
    <ScrollView contentContainerStyle={s.menuScroll} showsVerticalScrollIndicator={false}>
      <Text style={s.menuTitle}>{lbl('Nouveau produit', 'Yeni ürün', 'New product')}</Text>
      <Text style={s.menuSub}>{lbl('Choisissez comment ajouter', 'Nasıl ekleyeceğini seç', 'Choose how to add')}</Text>

      <TouchableOpacity style={[s.optionCard, s.optionCardHero]} onPress={() => setStep('ai-photo')}>
        <View style={s.optionIconBox}>
          <Ionicons name="sparkles" size={28} color={T.bg} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={s.badgeRow}>
            <Text style={s.optionTitleLight}>{lbl('Photo IA', 'AI Foto', 'AI Photo')}</Text>
            <View style={s.newBadge}><Text style={s.newBadgeText}>{lbl('NOUVEAU', 'YENİ', 'NEW')}</Text></View>
          </View>
          <Text style={s.optionSubLight}>
            {lbl('Photographiez un produit, on le reconnaît', 'Ürünü çek, tanıyalım', 'Snap a product, we recognize it')}
          </Text>
        </View>
        <Text style={s.optionArrowLight}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity style={s.optionCard} onPress={() => {
        if (!permission?.granted) requestPermission();
        setStep('barcode');
        setBarcodeScanned(false);
      }}>
        <View style={s.optionIconBoxLight}>
          <Ionicons name="barcode" size={26} color={T.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.optionTitle}>{lbl('Code-barres', 'Barkod', 'Barcode')}</Text>
          <Text style={s.optionSub}>{lbl('Scannez le code sur l\'emballage', 'Ambalajdaki kodu tara', 'Scan the package code')}</Text>
        </View>
        <Text style={s.optionArrow}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity style={s.optionCard} onPress={() => setStep('search')}>
        <View style={s.optionIconBoxLight}>
          <Ionicons name="search" size={24} color={T.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.optionTitle}>{lbl('Base de données', 'Veritabanı', 'Database')}</Text>
          <Text style={s.optionSub}>{lbl('Cherchez par nom ou marque', 'İsim veya markayla ara', 'Search by name or brand')}</Text>
        </View>
        <Text style={s.optionArrow}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity style={s.optionCard} onPress={() => {
        setName(''); setBrand(''); setCategory('Hydratant');
        setPrice(''); setNotes(''); setOpenedAt(''); setImageUrl(null);
        setStep('ai-result');
      }}>
        <View style={s.optionIconBoxLight}>
          <Ionicons name="create-outline" size={24} color={T.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.optionTitle}>{lbl('Manuel', 'Manuel', 'Manual')}</Text>
          <Text style={s.optionSub}>{lbl('Saisissez tout vous-même', 'Her şeyi kendin yaz', 'Type everything yourself')}</Text>
        </View>
        <Text style={s.optionArrow}>›</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );

  const renderAIPhoto = () => (
    <ScrollView contentContainerStyle={s.aiScroll} showsVerticalScrollIndicator={false}>
      <Text style={s.flowTitle}>{lbl('Photo IA', 'AI Foto', 'AI Photo')}</Text>
      <Text style={s.flowSub}>
        {lbl(
          'Prenez ou choisissez une photo du produit. L\'IA reconnaît le nom, la marque et la catégorie.',
          'Ürünün fotoğrafını çek veya seç. AI ismi, markayı ve kategoriyi tanıyacak.',
          'Take or choose a photo of the product. AI will recognize name, brand, and category.'
        )}
      </Text>

      {aiImageUri && (
        <Image source={{ uri: aiImageUri }} style={s.previewImg} />
      )}

      {aiLoading ? (
        <View style={s.loadingBox}>
          <ActivityIndicator color={T.accent} size="large" />
          <Text style={s.loadingText}>{lbl('Analyse en cours...', 'Analiz ediliyor...', 'Analyzing...')}</Text>
          <Text style={s.loadingHint}>{lbl('Cela peut prendre quelques secondes', 'Birkaç saniye sürebilir', 'This may take a few seconds')}</Text>
        </View>
      ) : (
        <>
          <TouchableOpacity style={s.primaryBtn} onPress={takeAiPhoto}>
            <Ionicons name="camera" size={20} color={T.white} />
            <Text style={s.primaryBtnText}>{lbl('Prendre une photo', 'Fotoğraf çek', 'Take a photo')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.outlineBtn} onPress={pickImageFromGallery}>
            <Ionicons name="images-outline" size={20} color={T.accent} />
            <Text style={s.outlineBtnText}>{lbl('Depuis la galerie', 'Galeriden seç', 'From gallery')}</Text>
          </TouchableOpacity>
        </>
      )}

      <View style={s.tipsBox}>
        <Text style={s.tipsTitle}>{lbl('Conseils', 'İpuçları', 'Tips')}</Text>
        <Text style={s.tipText}>• {lbl('Étiquette bien visible', 'Etiket net görünsün', 'Label clearly visible')}</Text>
        <Text style={s.tipText}>• {lbl('Bon éclairage, sans flash', 'İyi ışık, flaşsız', 'Good light, no flash')}</Text>
        <Text style={s.tipText}>• {lbl('Un seul produit par photo', 'Fotoğrafta tek ürün', 'One product per photo')}</Text>
      </View>
    </ScrollView>
  );

  const renderBarcode = () => {
    if (!permission) return <View style={s.container} />;
    if (!permission.granted) {
      return (
        <View style={s.permissionBox}>
          <Ionicons name="camera-outline" size={48} color={T.accent} />
          <Text style={s.permissionTitle}>
            {lbl('Accès caméra requis', 'Kamera izni gerekli', 'Camera access required')}
          </Text>
          <TouchableOpacity style={s.primaryBtn} onPress={requestPermission}>
            <Text style={s.primaryBtnText}>{lbl('Autoriser', 'İzin ver', 'Allow')}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={s.scannerContainer}>
        <CameraView
          style={s.camera}
          facing="back"
          onBarcodeScanned={handleBarcode}
          barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'] }}
        >
          <View style={s.scannerOverlay}>
            <View style={s.frame}>
              <View style={[s.corner, s.tl]} />
              <View style={[s.corner, s.tr]} />
              <View style={[s.corner, s.bl]} />
              <View style={[s.corner, s.br]} />
              {barcodeLoading && <ActivityIndicator color={T.accent} style={{ position: 'absolute' }} />}
            </View>
            <View style={s.scannerHint}>
              <Text style={s.scannerHintText}>
                {lbl('Placez le code-barres dans le cadre', 'Barkodu çerçeveye yerleştir', 'Place the barcode in the frame')}
              </Text>
            </View>
          </View>
        </CameraView>
      </View>
    );
  };

  const renderSearch = () => (
    <ScrollView contentContainerStyle={s.aiScroll} showsVerticalScrollIndicator={false}>
      <Text style={s.flowTitle}>{lbl('Base de données', 'Veritabanı', 'Database')}</Text>
      <Text style={s.flowSub}>
        {lbl('Cherchez par nom ou marque', 'İsim veya markayla ara', 'Search by name or brand')}
      </Text>

      <TextInput
        style={s.searchInput}
        placeholder={lbl('ex: CeraVe, La Roche-Posay...', 'örn: CeraVe, Avène...', 'e.g. CeraVe, Neutrogena...')}
        placeholderTextColor={T.mid}
        value={searchQuery}
        onChangeText={searchDatabase}
        autoFocus
        autoCorrect={false}
      />

      {searchLoading && <ActivityIndicator color={T.accent} style={{ marginTop: 20 }} />}

      {searchResults.map(p => (
        <TouchableOpacity key={p.id} style={s.searchResult} onPress={() => selectFromSearch(p)}>
          <View style={s.searchThumb}>
            <Text style={s.searchThumbText}>{(p.name || '?')[0]}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.searchName} numberOfLines={1}>{p.name}</Text>
            <Text style={s.searchBrand}>{p.brand} · {p.category}</Text>
          </View>
        </TouchableOpacity>
      ))}

      {!searchLoading && searchQuery.length >= 2 && searchResults.length === 0 && (
        <Text style={s.searchEmpty}>{lbl('Aucun résultat', 'Sonuç yok', 'No results')}</Text>
      )}
    </ScrollView>
  );

  const renderForm = () => (
    <ScrollView contentContainerStyle={s.formScroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      {aiResult && aiImageUri && (
        <View style={s.aiBanner}>
          <Image source={{ uri: aiImageUri }} style={s.aiBannerImg} />
          <View style={{ flex: 1 }}>
            <Text style={s.aiBannerLabel}>
              {aiResult.confidence >= 0.7
                ? lbl('✨ Reconnu par IA', '✨ AI tanıdı', '✨ Recognized by AI')
                : lbl('✨ Suggestion IA', '✨ AI önerisi', '✨ AI suggestion')}
            </Text>
            <Text style={s.aiBannerHint}>
              {lbl('Vérifiez et corrigez si besoin', 'Kontrol et ve gerekirse düzelt', 'Check and edit if needed')}
            </Text>
          </View>
        </View>
      )}

      {imageUrl && !aiImageUri && (
        <Image source={{ uri: imageUrl }} style={s.formImage} />
      )}

      <Text style={s.label}>{lbl('Marque', 'Marka', 'Brand')}</Text>
      <TextInput style={s.input} placeholder="ex: La Roche-Posay" placeholderTextColor={T.light} value={brand} onChangeText={setBrand} autoCorrect={false} />

      <Text style={s.label}>{lbl('Nom du produit', 'Ürün adı', 'Product name')}</Text>
      <TextInput style={s.input} placeholder="ex: Toleriane Double Repair" placeholderTextColor={T.light} value={name} onChangeText={setName} autoCorrect={false} />

      <Text style={s.label}>{lbl('Catégorie', 'Kategori', 'Category')}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
        {CATEGORIES.map(c => (
          <TouchableOpacity key={c} onPress={() => setCategory(c)} style={[s.chip, category === c && s.chipActive]}>
            <Text style={[s.chipText, category === c && s.chipTextActive]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={s.label}>{lbl("Date d'ouverture (YYYY-MM-DD)", 'Açılış tarihi (YYYY-AA-GG)', 'Opening date (YYYY-MM-DD)')}</Text>
      <TextInput style={s.input} placeholder="2026-04-19" placeholderTextColor={T.light} value={openedAt} onChangeText={setOpenedAt} autoCorrect={false} />

      <Text style={s.label}>{lbl('Prix (€)', 'Fiyat (€)', 'Price (€)')}</Text>
      <TextInput style={s.input} placeholder="18.50" placeholderTextColor={T.light} value={price} onChangeText={setPrice} keyboardType="numeric" />

      <Text style={s.label}>{lbl('Notes', 'Notlar', 'Notes')}</Text>
      <TextInput style={[s.input, { height: 80 }]} placeholder={lbl('Ingrédients, votre avis...', 'İçerikler, notların...', 'Ingredients, your notes...')} placeholderTextColor={T.light} value={notes} onChangeText={setNotes} multiline />

      <TouchableOpacity style={s.saveBtn} onPress={saveProduct} disabled={saving}>
        {saving ? <ActivityIndicator color={T.white} /> : (
          <>
            <Ionicons name="checkmark-circle" size={20} color={T.white} />
            <Text style={s.saveBtnText}>{lbl('Ajouter à mon archive', 'Arşivime ekle', 'Add to my archive')}</Text>
          </>
        )}
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );

  const handleBack = () => {
    if (step === 'menu') {
      router.back();
    } else if (step === 'ai-result') {
      // Reset AI state when going back
      setAiResult(null);
      setAiImageUri(null);
      setAiImageBase64(null);
      setStep('menu');
    } else {
      setStep('menu');
    }
  };

  const headerTitle =
    step === 'menu' ? lbl('Ajouter', 'Ekle', 'Add') :
    step === 'ai-photo' ? lbl('Photo IA', 'AI Foto', 'AI Photo') :
    step === 'ai-result' ? lbl('Confirmer', 'Onayla', 'Confirm') :
    step === 'barcode' ? lbl('Scanner', 'Tara', 'Scan') :
    step === 'search' ? lbl('Rechercher', 'Ara', 'Search') :
    lbl('Manuel', 'Manuel', 'Manual');

  const isDarkHeader = step === 'barcode';

  return (
    <>
      <Stack.Screen options={{ headerShown: false, presentation: 'modal' }} />
      <StatusBar barStyle={isDarkHeader ? 'light-content' : 'dark-content'} backgroundColor={isDarkHeader ? '#0E0B0A' : T.bg} />
      <SafeAreaView style={[s.safe, isDarkHeader && { backgroundColor: '#0E0B0A' }]}>
        <View style={[s.header, isDarkHeader && s.headerDark]}>
          <TouchableOpacity onPress={handleBack} style={s.headerBtn}>
            <Ionicons name={step === 'menu' ? 'close' : 'chevron-back'} size={22} color={isDarkHeader ? T.white : T.dark} />
          </TouchableOpacity>
          <Text style={[s.headerTitle, isDarkHeader && { color: T.white }]}>{headerTitle}</Text>
          <View style={s.headerBtn} />
        </View>

        {step === 'menu' && renderMenu()}
        {step === 'ai-photo' && renderAIPhoto()}
        {step === 'ai-result' && renderForm()}
        {step === 'barcode' && renderBarcode()}
        {step === 'search' && renderSearch()}
      </SafeAreaView>
    </>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: T.bg },
  container: { flex: 1, backgroundColor: T.bg },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 0 : 20, paddingBottom: 12, backgroundColor: T.bg },
  headerDark: { backgroundColor: '#0E0B0A' },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 15, fontWeight: '600', color: T.dark, letterSpacing: 0.3 },

  // Menu
  menuScroll: { padding: 22, paddingTop: 20 },
  menuTitle: { fontSize: 28, fontWeight: '700', color: T.dark, marginBottom: 6 },
  menuSub: { fontSize: 13, color: T.mid, marginBottom: 24 },

  optionCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: T.white, borderRadius: 18, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: T.light },
  optionCardHero: { backgroundColor: T.dark, borderColor: T.dark },
  optionIconBox: { width: 54, height: 54, borderRadius: 18, backgroundColor: T.accent, alignItems: 'center', justifyContent: 'center' },
  optionIconBoxLight: { width: 54, height: 54, borderRadius: 18, backgroundColor: T.bg2, alignItems: 'center', justifyContent: 'center' },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  newBadge: { backgroundColor: T.accent, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  newBadgeText: { fontSize: 9, color: T.white, fontWeight: '700', letterSpacing: 0.6 },
  optionTitle: { fontSize: 16, fontWeight: '700', color: T.dark, marginBottom: 2 },
  optionTitleLight: { fontSize: 16, fontWeight: '700', color: T.bg },
  optionSub: { fontSize: 12, color: T.mid, lineHeight: 16 },
  optionSubLight: { fontSize: 12, color: '#C9B5A8', lineHeight: 16 },
  optionArrow: { fontSize: 22, color: T.light, fontWeight: '300' },
  optionArrowLight: { fontSize: 22, color: T.bg, fontWeight: '300' },

  // AI Photo flow
  aiScroll: { padding: 22 },
  flowTitle: { fontSize: 24, fontWeight: '700', color: T.dark, marginBottom: 6 },
  flowSub: { fontSize: 13, color: T.mid, marginBottom: 20, lineHeight: 18 },

  previewImg: { width: '100%' as any, height: 280, borderRadius: 20, marginBottom: 16, backgroundColor: T.bg2 },

  loadingBox: { alignItems: 'center', padding: 32, backgroundColor: T.white, borderRadius: 18, marginBottom: 16, borderWidth: 1, borderColor: T.light },
  loadingText: { fontSize: 14, color: T.dark, marginTop: 12, fontWeight: '600' },
  loadingHint: { fontSize: 11, color: T.mid, marginTop: 4 },

  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: T.accent, borderRadius: 100, padding: 16, marginBottom: 10, shadowColor: T.accent, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 3 },
  primaryBtnText: { fontSize: 14, fontWeight: '700', color: T.white, letterSpacing: 0.3 },

  outlineBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 100, padding: 14, borderWidth: 1.5, borderColor: T.light, marginBottom: 10 },
  outlineBtnText: { fontSize: 13, fontWeight: '600', color: T.accent },

  tipsBox: { backgroundColor: T.bg2, borderRadius: 14, padding: 14, marginTop: 14, borderWidth: 1, borderColor: T.light },
  tipsTitle: { fontSize: 10, color: T.accent2, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8, fontWeight: '700' },
  tipText: { fontSize: 12, color: T.mid, marginBottom: 5, lineHeight: 16 },

  // Barcode scanner
  scannerContainer: { flex: 1, backgroundColor: '#0E0B0A' },
  camera: { flex: 1 },
  scannerOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  frame: { width: 260, height: 170, position: 'relative', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  corner: { position: 'absolute', width: 28, height: 28, borderColor: T.accent, borderWidth: 0 },
  tl: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 4 },
  tr: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 4 },
  bl: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 4 },
  br: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 4 },
  scannerHint: { backgroundColor: 'rgba(26,19,16,0.7)', borderRadius: 100, paddingHorizontal: 20, paddingVertical: 10 },
  scannerHintText: { fontSize: 12, color: T.white, letterSpacing: 0.3 },

  // Search
  searchInput: { backgroundColor: T.white, borderRadius: 14, padding: 14, fontSize: 14, color: T.dark, borderWidth: 1, borderColor: T.light, marginBottom: 16 },
  searchResult: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: T.white, borderRadius: 14, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: T.light },
  searchThumb: { width: 44, height: 44, borderRadius: 12, backgroundColor: T.bg2, alignItems: 'center', justifyContent: 'center' },
  searchThumbText: { fontSize: 18, color: T.accent, fontWeight: '600' },
  searchName: { fontSize: 14, color: T.dark, fontWeight: '600', marginBottom: 2 },
  searchBrand: { fontSize: 11, color: T.mid },
  searchEmpty: { fontSize: 12, color: T.mid, textAlign: 'center', padding: 20 },

  // Form (ai-result)
  formScroll: { padding: 22 },
  aiBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: T.dark, borderRadius: 16, padding: 12, marginBottom: 20 },
  aiBannerImg: { width: 56, height: 56, borderRadius: 12, backgroundColor: T.bg2 },
  aiBannerLabel: { fontSize: 13, fontWeight: '700', color: T.bg, marginBottom: 3 },
  aiBannerHint: { fontSize: 11, color: '#C9B5A8' },
  formImage: { width: 100, height: 100, borderRadius: 16, marginBottom: 16, alignSelf: 'center', backgroundColor: T.bg2 },
  label: { fontSize: 10, color: T.mid, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 6, fontWeight: '700' },
  input: { backgroundColor: T.white, borderRadius: 12, padding: 13, color: T.dark, fontSize: 14, borderWidth: 1, borderColor: T.light, marginBottom: 14 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 100, backgroundColor: T.white, marginRight: 8, borderWidth: 1, borderColor: T.light },
  chipActive: { backgroundColor: T.accent, borderColor: T.accent },
  chipText: { fontSize: 11, color: T.mid, fontWeight: '600' },
  chipTextActive: { color: T.white },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: T.accent, borderRadius: 100, padding: 16, marginTop: 10, shadowColor: T.accent, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 3 },
  saveBtnText: { fontSize: 14, fontWeight: '700', color: T.white, letterSpacing: 0.3 },

  // Permission
  permissionBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 14, backgroundColor: T.bg },
  permissionTitle: { fontSize: 16, fontWeight: '600', color: T.dark, textAlign: 'center', marginBottom: 8 },
});
