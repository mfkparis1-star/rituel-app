import { CameraView, useCameraPermissions } from 'expo-camera';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from '../../hooks/useTranslation';
import { supabase } from '../../lib/supabase';

const T = {
  bg: '#FDF8F5', bg2: '#F5EDE6', accent: '#B8856A',
  dark: '#1A1310', mid: '#6B5245', light: '#E8D5C8', white: '#FFFFFF',
};

export default function ScannerScreen() {
  const { lang } = useTranslation();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [saved, setSaved] = useState(false);
  const [mode, setMode] = useState<'camera' | 'gallery'>('camera');

  const lbl = (fr: string, tr: string, en: string) => lang === 'fr' ? fr : lang === 'tr' ? tr : en;

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user || null);
    });
  }, []);

  const handleBarcode = async ({ data }: { data: string }) => {
    if (scanned || loading) return;
    setScanned(true);
    setLoading(true);
    try {
      const res = await fetch(`https://world.openbeautyfacts.org/api/v0/product/${data}.json`);
      const json = await res.json();
      if (json.status === 1 && json.product) {
        const p = json.product;
        setProduct({
          barcode: data,
          name: p.product_name || lbl('Nom inconnu', 'Bilinmeyen isim', 'Unknown name'),
          brand: p.brands || lbl('Marque inconnue', 'Bilinmeyen marka', 'Unknown brand'),
          category: p.categories_tags?.[0]?.replace('en:', '') || 'Hydratant',
          image_url: p.image_url || null,
          ingredients: p.ingredients_text_fr || p.ingredients_text || null,
        });
      } else {
        Alert.alert(
          lbl('Produit non trouvé', 'Ürün bulunamadı', 'Product not found'),
          lbl('Ce produit n\'est pas dans notre base.', 'Bu ürün veritabanımızda yok.', 'This product is not in our database.'),
          [{ text: 'OK', onPress: () => setScanned(false) }]
        );
      }
    } catch {
      Alert.alert(lbl('Erreur', 'Hata', 'Error'), lbl('Impossible de scanner.', 'Taranamadı.', 'Could not scan.'));
      setScanned(false);
    } finally {
      setLoading(false);
    }
  };

  const saveToArchive = async () => {
    if (!user || !product) return;
    setSaved(true);
    const { error } = await supabase.from('products').insert({
      user_id: user.id,
      name: product.name,
      brand: product.brand,
      category: 'Hydratant',
      status: 'active',
      price: 0,
      icon: '○',
      notes: product.ingredients ? `Ingrédients: ${product.ingredients.slice(0, 100)}...` : '',
      image_url: product.image_url || null,
    });
    if (error) { Alert.alert('Erreur', error.message); setSaved(false); }
    else Alert.alert('', lbl('Produit ajouté à votre archive!', 'Ürün arşivinize eklendi!', 'Product added to your archive!'));
  };

  // PERMISSION NOT GRANTED
  if (!permission) return <View style={s.container} />;

  if (!permission.granted) return (
    <View style={s.container}>
      <View style={s.center}>
        <View style={s.permissionIcon}>
          <Text style={s.permissionIconText}>◎</Text>
        </View>
        <Text style={s.permissionTitle}>
          {permission.canAskAgain
            ? lbl('Accès caméra requis', 'Kamera izni gerekli', 'Camera access required')
            : lbl('Accès caméra refusé', 'Kamera izni reddedildi', 'Camera access denied')}
        </Text>
        <Text style={s.permissionSub}>
          {permission.canAskAgain
            ? lbl('Pour scanner un produit, l\'accès à la caméra est nécessaire.', 'Ürün taramak için kamera erişimi gerekli.', 'Camera access is needed to scan products.')
            : lbl('Veuillez autoriser dans les réglages.', 'Lütfen ayarlardan izin verin.', 'Please allow in your device settings.')}
        </Text>
        {permission.canAskAgain && (
          <TouchableOpacity style={s.primaryBtn} onPress={requestPermission}>
            <Text style={s.primaryBtnText}>{lbl('Autoriser', 'İzin ver', 'Allow')}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  // RESULT VIEW
  if (product) return (
    <View style={s.container}>
      <View style={s.resultPage}>
        <Text style={s.resultPageLabel}>{lbl('Produit trouvé', 'Ürün bulundu', 'Product found')}</Text>
        <Text style={s.resultName}>{product.name}</Text>
        <Text style={s.resultBrand}>{product.brand}</Text>

        {product.ingredients && (
          <View style={s.ingredientsBox}>
            <Text style={s.ingredientsLabel}>{lbl('Ingrédients', 'İçerikler', 'Ingredients')}</Text>
            <Text style={s.ingredientsText} numberOfLines={4}>{product.ingredients}</Text>
          </View>
        )}

        <TouchableOpacity style={s.primaryBtn} onPress={saveToArchive} disabled={saved}>
          <Text style={s.primaryBtnText}>
            {saved
              ? lbl('Ajouté ✓', 'Eklendi ✓', 'Added ✓')
              : lbl('Ajouter à mon archive', 'Arşivime ekle', 'Add to my archive')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.outlineBtn} onPress={() => { setProduct(null); setScanned(false); setSaved(false); }}>
          <Text style={s.outlineBtnText}>{lbl('Scanner un autre', 'Başka tara', 'Scan another')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // CAMERA VIEW
  return (
    <View style={s.container}>
      <CameraView
        style={s.camera}
        facing="back"
        onBarcodeScanned={handleBarcode}
        barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a'] }}
      >
        {/* Overlay */}
        <View style={s.overlay}>
          {/* Top bar */}
          <View style={s.topBar}>
            <Text style={s.topBarTitle}>{lbl('Scanner', 'Tara', 'Scanner')}</Text>
          </View>

          {/* Scan frame */}
          <View style={s.frameWrap}>
            <View style={s.frame}>
              <View style={[s.corner, s.tl]} />
              <View style={[s.corner, s.tr]} />
              <View style={[s.corner, s.bl]} />
              <View style={[s.corner, s.br]} />
              {loading && <ActivityIndicator color={T.accent} style={{ position: 'absolute' }} />}
            </View>
            <View style={s.hintBox}>
              <Text style={s.hintText}>
                {lbl('Placez le code-barres dans le cadre', 'Barkodu çerçeveye yerleştirin', 'Place the barcode in the frame')}
              </Text>
            </View>
          </View>

          {/* Mode tabs */}
          <View style={s.modeTabs}>
            <TouchableOpacity onPress={() => setMode('camera')} style={[s.modeTab, mode === 'camera' && s.modeTabActive]}>
              <Text style={[s.modeTabText, mode === 'camera' && s.modeTabTextActive]}>
                {lbl('Caméra', 'Kamera', 'Camera')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setMode('gallery')} style={[s.modeTab, mode === 'gallery' && s.modeTabActive]}>
              <Text style={[s.modeTabText, mode === 'gallery' && s.modeTabTextActive]}>
                {lbl('Galerie', 'Galeri', 'Gallery')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tips */}
          <View style={s.tipsBox}>
            <Text style={s.tipsTitle}>{lbl('Conseils', 'İpuçları', 'Tips')}</Text>
            <Text style={s.tipText}>— {lbl('Bonne luminosité, sans flash', 'İyi ışık, flaşsız', 'Good lighting, no flash')}</Text>
            <Text style={s.tipText}>— {lbl('Tenez le téléphone stable', 'Telefonu sabit tutun', 'Hold the phone steady')}</Text>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0E0B0A' },
  camera: { flex: 1 },

  overlay: { flex: 1, alignItems: 'center', justifyContent: 'space-between', paddingBottom: 100 },

  topBar: { width: '100%', paddingTop: 60, paddingHorizontal: 22, paddingBottom: 16 },
  topBarTitle: { fontSize: 18, fontWeight: '300', color: 'white', letterSpacing: 2 },

  frameWrap: { alignItems: 'center' },
  frame: { width: 240, height: 160, position: 'relative', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  corner: { position: 'absolute', width: 24, height: 24, borderColor: T.accent, borderStyle: 'solid', borderWidth: 0 },
  tl: { top: 0, left: 0, borderTopWidth: 2, borderLeftWidth: 2, borderTopLeftRadius: 4 },
  tr: { top: 0, right: 0, borderTopWidth: 2, borderRightWidth: 2, borderTopRightRadius: 4 },
  bl: { bottom: 0, left: 0, borderBottomWidth: 2, borderLeftWidth: 2, borderBottomLeftRadius: 4 },
  br: { bottom: 0, right: 0, borderBottomWidth: 2, borderRightWidth: 2, borderBottomRightRadius: 4 },
  hintBox: { backgroundColor: 'rgba(26,19,16,0.7)', borderRadius: 100, paddingHorizontal: 18, paddingVertical: 8 },
  hintText: { fontSize: 11, color: 'rgba(255,255,255,0.8)', letterSpacing: 0.3 },

  modeTabs: { flexDirection: 'row', gap: 10, backgroundColor: 'rgba(26,19,16,0.6)', borderRadius: 100, padding: 4 },
  modeTab: { paddingHorizontal: 20, paddingVertical: 9, borderRadius: 100 },
  modeTabActive: { backgroundColor: T.accent },
  modeTabText: { fontSize: 12, color: 'rgba(255,255,255,0.5)', letterSpacing: 0.5 },
  modeTabTextActive: { color: T.white },

  tipsBox: { backgroundColor: 'rgba(26,19,16,0.6)', borderRadius: 16, padding: 14, width: '85%', borderWidth: 1, borderColor: 'rgba(184,133,106,0.1)' },
  tipsTitle: { fontSize: 9, color: 'rgba(184,133,106,0.6)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 },
  tipText: { fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 4, letterSpacing: 0.3 },

  // PERMISSION
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  permissionIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: T.bg2, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  permissionIconText: { fontSize: 24, color: T.accent },
  permissionTitle: { fontSize: 18, fontWeight: '300', color: T.dark, marginBottom: 8, textAlign: 'center' },
  permissionSub: { fontSize: 12, color: T.mid, textAlign: 'center', lineHeight: 18, marginBottom: 24 },

  // RESULT
  resultPage: { flex: 1, backgroundColor: T.bg, padding: 28, justifyContent: 'center' },
  resultPageLabel: { fontSize: 9, color: T.mid, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 },
  resultName: { fontSize: 24, fontWeight: '300', color: T.dark, marginBottom: 6, letterSpacing: 0.3 },
  resultBrand: { fontSize: 14, color: T.accent, marginBottom: 20, letterSpacing: 0.5 },
  ingredientsBox: { backgroundColor: T.bg2, borderRadius: 14, padding: 14, marginBottom: 24, borderWidth: 1, borderColor: T.light },
  ingredientsLabel: { fontSize: 9, color: T.mid, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 6 },
  ingredientsText: { fontSize: 11, color: T.mid, lineHeight: 17 },

  primaryBtn: { backgroundColor: T.accent, borderRadius: 100, padding: 15, alignItems: 'center', marginBottom: 10 },
  primaryBtnText: { fontSize: 13, fontWeight: '500', color: T.white, letterSpacing: 0.5 },
  outlineBtn: { borderRadius: 100, padding: 13, alignItems: 'center', borderWidth: 1, borderColor: T.light },
  outlineBtnText: { fontSize: 12, color: T.mid },
});