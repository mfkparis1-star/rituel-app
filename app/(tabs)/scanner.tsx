import { CameraView, useCameraPermissions } from 'expo-camera';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../lib/supabase';

const T = {
  bg: '#08080E', surface: '#11111A', border: '#1C1C2E',
  accent: '#C9A96E', text: '#F5F0F8', textSoft: '#6B6278',
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
        Alert.alert('Produit non trouvé', 'Ce produit n\'est pas dans notre base de données.', [
          { text: 'OK', onPress: () => setScanned(false) }
        ]);
      }
    } catch {
      Alert.alert('Erreur', 'Impossible de scanner ce produit.');
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
      icon: '✨',
      notes: product.ingredients ? `Ingrédients: ${product.ingredients.slice(0, 100)}...` : '',
      image_url: product.image_url || null,
    });
    if (error) { Alert.alert('Erreur', error.message); setSaved(false); }
    else { Alert.alert('✓', 'Produit ajouté à votre archive!'); }
  };

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionBox}>
          <Text style={styles.permissionIcon}>📷</Text>
          <Text style={styles.permissionTitle}>
            {permission.canAskAgain
              ? 'Accès à la caméra requis'
              : 'Accès à la caméra refusé'}
          </Text>
          <Text style={styles.permissionSub}>
            {permission.canAskAgain
              ? 'Pour scanner un produit, l\'accès à la caméra est nécessaire.'
              : 'Veuillez autoriser l\'accès dans les réglages de votre appareil.'}
          </Text>
          {permission.canAskAgain && (
            <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
              <Text style={styles.permissionBtnText}>Continuer</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  if (product) {
    return (
      <View style={styles.container}>
        <View style={styles.resultBox}>
          <Text style={styles.resultName}>{product.name}</Text>
          <Text style={styles.resultBrand}>{product.brand}</Text>
          {product.ingredients && (
            <Text style={styles.resultIngredients} numberOfLines={3}>{product.ingredients}</Text>
          )}
          <TouchableOpacity style={styles.saveBtn} onPress={saveToArchive} disabled={saved}>
            <Text style={styles.saveBtnText}>{saved ? '✓ Ajouté' : 'Ajouter à mon archive'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.retryBtn} onPress={() => { setProduct(null); setScanned(false); setSaved(false); }}>
            <Text style={styles.retryBtnText}>Scanner un autre produit</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing="back" onBarcodeScanned={handleBarcode} barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a'] }}>
        <View style={styles.overlay}>
          <View style={styles.scanFrame} />
          <Text style={styles.scanHint}>Placez le code-barres dans le cadre</Text>
          {loading && <ActivityIndicator color={T.accent} style={{ marginTop: 16 }} />}
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  camera: { flex: 1 },
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scanFrame: { width: 260, height: 160, borderWidth: 2, borderColor: T.accent, borderRadius: 12, marginBottom: 20 },
  scanHint: { fontSize: 14, color: '#fff', textAlign: 'center', backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  permissionBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  permissionIcon: { fontSize: 48, marginBottom: 16 },
  permissionTitle: { fontSize: 18, fontWeight: '700', color: T.text, marginBottom: 10, textAlign: 'center' },
  permissionSub: { fontSize: 13, color: T.textSoft, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  permissionBtn: { backgroundColor: T.accent, borderRadius: 14, paddingHorizontal: 32, paddingVertical: 14 },
  permissionBtnText: { fontSize: 15, fontWeight: '700', color: '#1A1208' },
  resultBox: { flex: 1, padding: 32, justifyContent: 'center' },
  resultName: { fontSize: 22, fontWeight: '700', color: T.text, marginBottom: 8 },
  resultBrand: { fontSize: 15, color: T.accent, marginBottom: 16 },
  resultIngredients: { fontSize: 12, color: T.textSoft, lineHeight: 18, marginBottom: 24 },
  saveBtn: { backgroundColor: T.accent, borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 10 },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#1A1208' },
  retryBtn: { borderWidth: 1, borderColor: T.border, borderRadius: 14, padding: 14, alignItems: 'center' },
  retryBtnText: { fontSize: 14, color: T.textSoft },
});