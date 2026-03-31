import { CameraView, useCameraPermissions } from 'expo-camera';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../lib/supabase';

const T = {
  bg: '#08080E', surface: '#11111A', border: '#1C1C2E',
  accent: '#C9A96E', rose: '#E87FAC', text: '#F5F0F8',
  textMid: '#B8B0C4', textSoft: '#6B6278',
};

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [saved, setSaved] = useState(false);

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
          name: p.product_name || 'Nom inconnu',
          brand: p.brands || 'Marque inconnue',
          category: p.categories_tags?.[0]?.replace('en:', '') || 'Hydratant',
          image_url: p.image_url || null,
          ingredients: p.ingredients_text_fr || p.ingredients_text || null,
        });
      } else {
        Alert.alert('Produit non trouvé', 'Ce produit n\'est pas dans notre base de données. Vous pouvez l\'ajouter manuellement.', [
          { text: 'OK', onPress: () => setScanned(false) }
        ]);
      }
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de scanner ce produit.');
      setScanned(false);
    } finally {
      setLoading(false);
    }
  };

  const saveToArchive = async () => {
    if (!user || !product) return;
    setSaved(true);

    const ICONS: Record<string, string> = {
      'Hydratant': '🧴', 'Nettoyant': '🫧', 'Sérum': '💧',
      'SPF': '☀️', 'Masque': '🌿', 'Corps': '🪷',
    };

    const { error } = await supabase.from('products').insert({
      user_id: user.id,
      name: product.name,
      brand: product.brand,
      category: 'Hydratant',
      status: 'active',
      price: 0,
      icon: '✨',
      notes: product.ingredients ? `Ingrédients: ${product.ingredients.slice(0, 100)}...` : '',
      image_url: product.image_url || null,
    });

    if (error) {
      Alert.alert('Erreur', error.message);
      setSaved(false);
    } else {
      Alert.alert('Ajouté! 🎉', `${product.name} a été ajouté à votre archive.`, [
        { text: 'Super!', onPress: () => { setProduct(null); setScanned(false); setSaved(false); } }
      ]);
    }
  };

  if (!permission) return <View style={styles.center}><ActivityIndicator color={T.accent} /></View>;

  if (!permission.granted) return (
    <View style={styles.center}>
      <Text style={styles.centerIcon}>📷</Text>
      <Text style={styles.centerTitle}>Accès caméra requis</Text>
      <Text style={styles.centerSub}>Pour scanner les codes-barres de vos produits</Text>
      <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
        <Text style={styles.permBtnText}>Autoriser la caméra</Text>
      </TouchableOpacity>
    </View>
  );

  if (product) return (
    <View style={styles.container}>
      <View style={styles.resultCard}>
        <Text style={styles.resultEmoji}>✨</Text>
        <Text style={styles.resultName}>{product.name}</Text>
        <Text style={styles.resultBrand}>{product.brand}</Text>
        {product.ingredients && (
          <Text style={styles.resultIngredients} numberOfLines={3}>
            {product.ingredients.slice(0, 150)}...
          </Text>
        )}

        <TouchableOpacity style={styles.saveBtn} onPress={saveToArchive} disabled={saved}>
          <Text style={styles.saveBtnText}>{saved ? 'Ajout...' : 'Ajouter à mon archive ✓'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.rescanBtn} onPress={() => { setProduct(null); setScanned(false); }}>
          <Text style={styles.rescanBtnText}>Scanner un autre produit</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Scanner 📷</Text>
        <Text style={styles.sub}>Scannez le code-barre de votre produit</Text>
      </View>

      <CameraView
        style={styles.camera}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarcode}
        barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'] }}
      >
        <View style={styles.overlay}>
          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
          {loading && <ActivityIndicator color={T.accent} size="large" style={{ marginTop: 20 }} />}
          {!loading && <Text style={styles.scanHint}>Placez le code-barre dans le cadre</Text>}
        </View>
      </CameraView>

      {scanned && !loading && (
        <TouchableOpacity style={styles.rescanBtn} onPress={() => setScanned(false)}>
          <Text style={styles.rescanBtnText}>Scanner à nouveau</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 16 },
  title: { fontSize: 26, fontWeight: '700', color: T.text, marginBottom: 4 },
  sub: { fontSize: 12, color: T.textSoft },
  camera: { flex: 1 },
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  scanFrame: { width: 250, height: 250, position: 'relative' },
  corner: { position: 'absolute', width: 30, height: 30, borderColor: T.accent, borderWidth: 3 },
  cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  scanHint: { color: '#fff', fontSize: 13, marginTop: 20, textAlign: 'center' },
  resultCard: { flex: 1, backgroundColor: T.surface, margin: 20, borderRadius: 24, padding: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: T.border },
  resultEmoji: { fontSize: 56, marginBottom: 16 },
  resultName: { fontSize: 20, fontWeight: '700', color: T.text, textAlign: 'center', marginBottom: 8 },
  resultBrand: { fontSize: 14, color: T.accent, marginBottom: 16 },
  resultIngredients: { fontSize: 11, color: T.textSoft, textAlign: 'center', lineHeight: 18, marginBottom: 24 },
  saveBtn: { backgroundColor: T.accent, borderRadius: 14, padding: 16, width: '100%', alignItems: 'center', marginBottom: 10 },
  saveBtnText: { fontSize: 14, fontWeight: '700', color: '#1A1208' },
  rescanBtn: { borderWidth: 1, borderColor: T.border, borderRadius: 14, padding: 14, width: '100%', alignItems: 'center', margin: 20 },
  rescanBtnText: { fontSize: 14, color: T.textSoft },
  center: { flex: 1, backgroundColor: T.bg, alignItems: 'center', justifyContent: 'center', padding: 40 },
  centerIcon: { fontSize: 56, marginBottom: 16 },
  centerTitle: { fontSize: 20, fontWeight: '700', color: T.text, marginBottom: 8 },
  centerSub: { fontSize: 13, color: T.textSoft, textAlign: 'center', marginBottom: 24 },
  permBtn: { backgroundColor: T.accent, borderRadius: 14, padding: 16, alignItems: 'center', width: '100%' },
  permBtnText: { fontSize: 14, fontWeight: '700', color: '#1A1208' },
});