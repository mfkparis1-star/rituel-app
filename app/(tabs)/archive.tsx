import * as ImagePicker from 'expo-image-picker';
import { router, useFocusEffect } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Image, Linking, Modal, PanResponder, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { useTranslation } from '../../hooks/useTranslation';
import { supabase } from '../../lib/supabase';
import { getAwinLink } from '../../utils/awin';

const T = {
  bg: '#FDF8F5', bg2: '#F5EDE6', accent: '#B8856A', accent2: '#8C5E46',
  dark: '#1A1310', mid: '#6B5245', light: '#E8D5C8', white: '#FFFFFF',
  green: '#5B9B6B', red: '#C0392B', orange: '#E67E22',
};

const CATEGORIES_FR = ['Nettoyant','Hydratant','Sérum','SPF','Tonique','Masque','Maquillage','Parfum','Corps','Cheveux'];
const CATEGORIES_EN = ['Cleanser','Moisturizer','Serum','SPF','Toner','Mask','Makeup','Perfume','Body','Hair'];
const CATEGORIES_TR = ['Temizleyici','Nemlendirici','Serum','SPF','Tonik','Maske','Makyaj','Parfüm','Vücut','Saç'];

const STATUSES_FR = [
  { id: 'active', label: 'En cours', color: T.green },
  { id: 'finished', label: 'Terminé', color: T.accent },
  { id: 'stocked', label: 'En stock', color: '#5BC4F8' },
];
const STATUSES_EN = [
  { id: 'active', label: 'Active', color: T.green },
  { id: 'finished', label: 'Finished', color: T.accent },
  { id: 'stocked', label: 'In stock', color: '#5BC4F8' },
];
const STATUSES_TR = [
  { id: 'active', label: 'Aktif', color: T.green },
  { id: 'finished', label: 'Bitti', color: T.accent },
  { id: 'stocked', label: 'Stokta', color: '#5BC4F8' },
];

const PAO_MONTHS: Record<string, number> = {
  'Nettoyant': 12, 'Cleanser': 12, 'Temizleyici': 12,
  'Hydratant': 12, 'Moisturizer': 12, 'Nemlendirici': 12,
  'Sérum': 6, 'Serum': 6,
  'SPF': 12,
  'Tonique': 12, 'Toner': 12, 'Tonik': 12,
  'Masque': 6, 'Mask': 6, 'Maske': 6,
  'Maquillage': 6, 'Makeup': 6, 'Makyaj': 6,
  'Parfum': 36, 'Perfume': 36,
  'Corps': 18, 'Body': 18, 'Vücut': 18,
  'Cheveux': 12, 'Hair': 12, 'Saç': 12,
};

type Product = {
  id: string; brand: string; name: string; category: string;
  status: string; price: number; icon: string; notes: string;
  image_url?: string; created_at: string; opened_at?: string;
};

type BeautyProduct = {
  id: string; brand: string; name: string; category: string; description: string;
};

function getPAOStatus(product: Product) {
  if (!product.opened_at || product.status !== 'active') return null;
  const opened = new Date(product.opened_at);
  const paoMonths = PAO_MONTHS[product.category] || 12;
  const expiry = new Date(opened);
  expiry.setMonth(expiry.getMonth() + paoMonths);
  const daysLeft = Math.ceil((expiry.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  if (daysLeft < 0) return { label: 'Expiré', color: T.red, daysLeft };
  if (daysLeft <= 30) return { label: `J-${daysLeft}`, color: T.orange, daysLeft };
  if (daysLeft <= 60) return { label: `J-${daysLeft}`, color: '#E6B800', daysLeft };
  return { label: `J-${daysLeft}`, color: T.green, daysLeft };
}

function DBSearch({ onSelect, lang }: { onSelect: (p: BeautyProduct) => void; lang: string }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<BeautyProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const search = async (q: string) => {
    setQuery(q);
    if (q.length < 2) { setResults([]); return; }
    setLoading(true);
    const { data } = await supabase.from('beauty_products').select('*').or(`name.ilike.%${q}%,brand.ilike.%${q}%`).limit(8);
    if (data) setResults(data);
    setLoading(false);
  };

  const placeholder = lang === 'fr' ? 'Chercher dans notre base beauté' : lang === 'tr' ? 'Güzellik veritabanında ara' : 'Search our beauty database';

  return (
    <View style={{ marginBottom: 14 }}>
      <TouchableOpacity onPress={() => setOpen(!open)} style={ms.dbToggle}>
        <Text style={ms.dbToggleText}>{placeholder}</Text>
      </TouchableOpacity>
      {open && (
        <View style={ms.dbBox}>
          <TextInput
            style={ms.dbInput}
            placeholder={lang === 'fr' ? 'ex: Avène, CeraVe...' : lang === 'tr' ? 'örn: Avène, CeraVe...' : 'ex: CeraVe, Neutrogena...'}
            placeholderTextColor={T.mid}
            value={query}
            onChangeText={search}
            autoCorrect={false}
          />
          {loading && <ActivityIndicator color={T.accent} style={{ marginVertical: 8 }} />}
          {results.map(p => (
            <TouchableOpacity key={p.id} onPress={() => { onSelect(p); setOpen(false); setQuery(''); setResults([]); }} style={ms.dbResult}>
              <View style={ms.dbThumb}><Text style={{ fontSize: 16, color: T.accent }}>{(p.name || '?')[0]}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={ms.dbName} numberOfLines={1}>{p.name}</Text>
                <Text style={ms.dbBrand}>{p.brand} · {p.category}</Text>
              </View>
            </TouchableOpacity>
          ))}
          {!loading && query.length >= 2 && results.length === 0 && (
            <Text style={ms.dbEmpty}>{lang === 'fr' ? 'Aucun résultat' : lang === 'tr' ? 'Sonuç yok' : 'No results'}</Text>
          )}
        </View>
      )}
    </View>
  );
}

export default function ArchiveScreen() {
  const { t, lang } = useTranslation();
  const CATEGORIES = lang === 'tr' ? CATEGORIES_TR : lang === 'fr' ? CATEGORIES_FR : CATEGORIES_EN;
  const STATUSES = lang === 'tr' ? STATUSES_TR : lang === 'fr' ? STATUSES_FR : STATUSES_EN;

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [brand, setBrand] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState(CATEGORIES[1]);
  const [price, setPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('active');
  const [openedAt, setOpenedAt] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const panResponder = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) =>
      Math.abs(g.dx) > 50 && Math.abs(g.dx) > Math.abs(g.dy) * 3 && Math.abs(g.vx) > 0.3,
    onPanResponderRelease: (_, g) => {
      if (g.dx < -120 && Math.abs(g.vx) > 0.3) router.push('/(tabs)/community' as any);
      if (g.dx > 120 && Math.abs(g.vx) > 0.3) router.push('/' as any);
    },
  })).current;

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user;
      setUser(u || null);
      if (u) loadProducts(u.id);
      else setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user;
      setUser(u || null);
      if (u) loadProducts(u.id);
      else setLoading(false);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  // Refresh list every time we return to this screen
  useFocusEffect(() => {
    if (user) loadProducts(user.id);
  });

  const loadProducts = async (userId: string) => {
    const { data, error } = await supabase.from('products').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (error) console.warn('loadProducts error:', error.message);
    else if (data) setProducts(data);
    setLoading(false);
  };

  const resetForm = () => {
    setBrand(''); setName(''); setCategory(CATEGORIES[1]);
    setPrice(''); setNotes(''); setStatus('active');
    setOpenedAt(''); setImageUri(null); setImageBase64(null);
  };

  const openEdit = (p: Product) => {
    setSelectedProduct(p); setBrand(p.brand); setName(p.name);
    setCategory(p.category); setPrice(p.price?.toString() || '');
    setNotes(p.notes || ''); setStatus(p.status);
    setOpenedAt(p.opened_at || '');
    setImageUri(p.image_url || null); setImageBase64(null); setShowEditModal(true);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.6, base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setImageBase64(result.assets[0].base64 ? `data:image/jpeg;base64,${result.assets[0].base64}` : null);
    }
  };

  const uploadImage = async (base64OrUrl: string, userId: string): Promise<string | null> => {
    if (base64OrUrl.startsWith('http')) return base64OrUrl;
    try {
      setUploading(true);
      const fileName = `${userId}/${Date.now()}.jpg`;
      const base64Data = base64OrUrl.replace(/^data:image\/\w+;base64,/, '');
      const byteArray = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      const { error } = await supabase.storage.from('product-images').upload(fileName, byteArray, { contentType: 'image/jpeg' });
      if (error) { console.warn('uploadImage error:', error.message); return null; }
      const { data } = supabase.storage.from('product-images').getPublicUrl(fileName);
      return data.publicUrl;
    } catch (e) { console.warn('uploadImage exception:', e); return null; }
    finally { setUploading(false); }
  };

  const addProduct = async () => {
    if (!brand || !name) {
      Alert.alert('', lang === 'fr' ? 'Marque et nom sont obligatoires' : lang === 'tr' ? 'Marka ve isim zorunlu' : 'Brand and name are required');
      return;
    }
    if (!user) return;
    setSaving(true);
    let imageUrl = null;
    if (imageBase64) imageUrl = await uploadImage(imageBase64, user.id);
    const { error } = await supabase.from('products').insert({
      user_id: user.id, brand, name, category,
      price: parseFloat(price) || 0, notes,
      icon: '○', status, image_url: imageUrl,
      opened_at: openedAt || null,
    });
    if (error) Alert.alert('Erreur', error.message);
    else { setShowAddModal(false); resetForm(); loadProducts(user.id); }
    setSaving(false);
  };

  const updateProduct = async () => {
    if (!selectedProduct || !user) return;
    setSaving(true);
    let imageUrl = selectedProduct.image_url || null;
    if (imageBase64) imageUrl = await uploadImage(imageBase64, user.id);
    else if (imageUri && imageUri.startsWith('http')) imageUrl = imageUri;
    const { error } = await supabase.from('products').update({
      brand, name, category, price: parseFloat(price) || 0,
      notes, status, icon: '○', image_url: imageUrl,
      opened_at: openedAt || null,
    }).eq('id', selectedProduct.id);
    if (error) Alert.alert('Erreur', error.message);
    else { setShowEditModal(false); resetForm(); loadProducts(user.id); }
    setSaving(false);
  };

  const deleteProduct = (id: string) => {
    Alert.alert(
      lang === 'fr' ? 'Supprimer ?' : lang === 'tr' ? 'Sil?' : 'Delete?',
      lang === 'fr' ? 'Cette action est irréversible.' : lang === 'tr' ? 'Bu işlem geri alınamaz.' : 'This cannot be undone.',
      [
        { text: lang === 'fr' ? 'Annuler' : lang === 'tr' ? 'İptal' : 'Cancel', style: 'cancel' },
        {
          text: lang === 'fr' ? 'Supprimer' : lang === 'tr' ? 'Sil' : 'Delete',
          style: 'destructive',
          onPress: async () => {
            await supabase.from('products').delete().eq('id', id);
            if (user) loadProducts(user.id);
          }
        },
      ]
    );
  };

  const filteredProducts = products
    .filter(p => filterStatus === 'all' || p.status === filterStatus)
    .filter(p => search === '' || p.name.toLowerCase().includes(search.toLowerCase()) || p.brand.toLowerCase().includes(search.toLowerCase()));

  const total = products.reduce((s, p) => s + (p.price || 0), 0).toFixed(2);
  const getStatusColor = (s: string) => STATUSES.find(x => x.id === s)?.color || T.mid;
  const getStatusLabel = (s: string) => STATUSES.find(x => x.id === s)?.label || s;
  const expiringCount = products.filter(p => { const pao = getPAOStatus(p); return pao && pao.daysLeft <= 30; }).length;

  const paoMonthsLabel = (cat: string) => {
    const m = PAO_MONTHS[cat] || 12;
    return lang === 'fr' ? `PAO: ${m} mois` : lang === 'tr' ? `PAO: ${m} ay` : `PAO: ${m} months`;
  };

  const filterLabel = (id: string) => {
    if (id === 'all') return lang === 'fr' ? 'Tous' : lang === 'tr' ? 'Tümü' : 'All';
    return getStatusLabel(id);
  };

  if (!user) return (
    <View style={styles.center}>
      <Text style={styles.centerTitle}>{t.archive.login_required}</Text>
      <Text style={styles.centerSub}>{t.archive.login_sub}</Text>
    </View>
  );

  const ProductForm = ({ isEdit }: { isEdit: boolean }) => (
    <ScrollView style={ms.scroll} keyboardShouldPersistTaps="handled">
      <View style={ms.content}>
        <View style={ms.handle} />
        <Text style={ms.title}>{isEdit ? t.archive.edit_product : t.archive.new_product}</Text>
        <DBSearch onSelect={(p) => { setName(p.name); setBrand(p.brand); setCategory(p.category || CATEGORIES[1]); }} lang={lang} />
        <TouchableOpacity onPress={pickImage} style={ms.photoPicker}>
          {imageUri
            ? <Image source={{ uri: imageUri }} style={ms.photoPreview} />
            : <View style={ms.photoPlaceholder}>
                <Text style={ms.photoPlaceholderLabel}>{lang === 'fr' ? 'Ajouter une photo' : lang === 'tr' ? 'Fotoğraf ekle' : 'Add photo'}</Text>
              </View>
          }
        </TouchableOpacity>
        <Text style={ms.label}>{t.archive.brand}</Text>
        <TextInput style={ms.input} placeholder="ex: La Roche-Posay" placeholderTextColor={T.light} value={brand} onChangeText={setBrand} autoCorrect={false} />
        <Text style={ms.label}>{t.archive.product_name}</Text>
        <TextInput style={ms.input} placeholder="ex: Toleriane Double Repair" placeholderTextColor={T.light} value={name} onChangeText={setName} autoCorrect={false} />
        <Text style={ms.label}>{t.archive.category}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
          {CATEGORIES.map(c => (
            <TouchableOpacity key={c} onPress={() => setCategory(c)} style={[ms.chip, category === c && ms.chipActive]}>
              <Text style={[ms.chipText, category === c && ms.chipTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <Text style={ms.label}>{t.archive.status}</Text>
        <View style={ms.statusRow}>
          {STATUSES.map(s => (
            <TouchableOpacity key={s.id} onPress={() => setStatus(s.id)} style={[ms.statusChip, status === s.id && { backgroundColor: s.color + '20', borderColor: s.color }]}>
              <View style={[ms.statusDot, { backgroundColor: status === s.id ? s.color : T.light }]} />
              <Text style={[ms.statusText, status === s.id && { color: s.color }]}>{s.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={ms.label}>{lang === 'fr' ? "Date d'ouverture" : lang === 'tr' ? 'Açılış tarihi' : 'Opening date'}</Text>
        <Text style={ms.hint}>{paoMonthsLabel(category)}</Text>
        <TextInput style={ms.input} placeholder="YYYY-MM-DD" placeholderTextColor={T.light} value={openedAt} onChangeText={setOpenedAt} autoCorrect={false} />
        <Text style={ms.label}>{t.archive.price}</Text>
        <TextInput style={ms.input} placeholder="ex: 18.50" placeholderTextColor={T.light} value={price} onChangeText={setPrice} keyboardType="numeric" />
        <Text style={ms.label}>{t.archive.notes}</Text>
        <TextInput style={[ms.input, { height: 70 }]} placeholder={lang === 'fr' ? 'Votre avis...' : lang === 'tr' ? 'Notunuz...' : 'Your notes...'} placeholderTextColor={T.light} value={notes} onChangeText={setNotes} multiline />
        <View style={ms.btns}>
          <TouchableOpacity style={ms.cancelBtn} onPress={() => isEdit ? setShowEditModal(false) : setShowAddModal(false)}>
            <Text style={ms.cancelText}>{t.archive.cancel}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={ms.saveBtn} onPress={isEdit ? updateProduct : addProduct} disabled={saving || uploading}>
            <Text style={ms.saveText}>{uploading ? '...' : saving ? '...' : isEdit ? t.archive.save : t.archive.add}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <ScrollView {...panResponder.panHandlers} style={styles.container} showsVerticalScrollIndicator={false}>

      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{t.archive.title}</Text>
          <Text style={styles.sub}>
            {products.length} {lang === 'fr' ? 'produits' : lang === 'tr' ? 'ürün' : 'products'} · €{total}
          </Text>
        </View>
        <TouchableOpacity style={styles.addCircle} onPress={() => router.push('/add-product' as any)}>
          <Text style={styles.addCircleText}>+</Text>
        </TouchableOpacity>
      </View>

      {expiringCount > 0 && (
        <View style={styles.expiryAlert}>
          <Text style={styles.expiryAlertText}>
            {expiringCount} {lang === 'fr' ? `produit${expiringCount > 1 ? 's' : ''} expire bientôt` : lang === 'tr' ? 'ürün yakında bitiyor' : `product${expiringCount > 1 ? 's' : ''} expiring soon`}
          </Text>
        </View>
      )}

      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>⌕</Text>
        <TextInput
          style={styles.searchInput}
          placeholder={t.archive.search}
          placeholderTextColor={T.light}
          value={search}
          onChangeText={setSearch}
          autoCorrect={false}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        {['all', 'active', 'finished', 'stocked'].map(id => (
          <TouchableOpacity key={id} onPress={() => setFilterStatus(id)} style={[styles.filterChip, filterStatus === id && styles.filterChipActive]}>
            <Text style={[styles.filterChipText, filterStatus === id && styles.filterChipTextActive]}>{filterLabel(id)}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.limitCard}>
        <View style={styles.limitRow}>
          <Text style={styles.limitLabel}>{t.archive.free_limit}</Text>
          <Text style={styles.limitVal}>{products.length}/30</Text>
        </View>
        <View style={styles.barBg}>
          <View style={[styles.barFill, { width: `${Math.min((products.length / 30) * 100, 100)}%` as any }]} />
        </View>
        <Text style={styles.limitHint}>{t.archive.premium_hint}</Text>
      </View>

      {loading
        ? <ActivityIndicator color={T.accent} style={{ marginTop: 40 }} />
        : filteredProducts.length === 0
          ? <View style={styles.empty}>
              <Text style={styles.emptyTitle}>{search ? (lang === 'fr' ? 'Aucun résultat' : lang === 'tr' ? 'Sonuç yok' : 'No results') : t.archive.empty_title}</Text>
              <Text style={styles.emptySub}>{search ? `"${search}"` : t.archive.empty_sub}</Text>
            </View>
          : filteredProducts.map(p => {
              const pao = getPAOStatus(p);
              const awinLink = getAwinLink(p.brand);

              const renderRightActions = (progress: Animated.AnimatedInterpolation<number>) => {
                const trans = progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [80, 0],
                });
                return (
                  <Animated.View style={[styles.deleteAction, { transform: [{ translateX: trans }] }]}>
                    <TouchableOpacity
                      style={styles.deleteActionBtn}
                      onPress={() => deleteProduct(p.id)}
                    >
                      <Text style={styles.deleteActionText}>
                        {lang === 'fr' ? 'Supprimer' : lang === 'tr' ? 'Sil' : 'Delete'}
                      </Text>
                    </TouchableOpacity>
                  </Animated.View>
                );
              };

              return (
                <Swipeable
                  key={p.id}
                  renderRightActions={renderRightActions}
                  rightThreshold={40}
                  overshootRight={false}
                >
                  <TouchableOpacity onPress={() => openEdit(p)} style={styles.card}>
                    {p.image_url
                      ? <Image source={{ uri: p.image_url }} style={styles.cardImage} />
                      : <View style={styles.cardThumb}><Text style={styles.cardThumbText}>{(p.name || '?')[0].toUpperCase()}</Text></View>
                    }
                    <View style={styles.cardInfo}>
                      <Text style={styles.cardBrand}>{p.brand}</Text>
                      <Text style={styles.cardName}>{p.name}</Text>
                      <View style={styles.cardMeta}>
                        <View style={[styles.statusDot, { backgroundColor: getStatusColor(p.status) }]} />
                        <Text style={[styles.cardStatus, { color: getStatusColor(p.status) }]}>{getStatusLabel(p.status)}</Text>
                        {pao && <Text style={[styles.paoLabel, { color: pao.color }]}>{pao.label}</Text>}
                      </View>
                    </View>
                    <View style={styles.cardRight}>
                      <Text style={styles.cardPrice}>€{p.price}</Text>
                      {p.status === 'finished' && awinLink && (
                        <TouchableOpacity
                          onPress={(e: any) => { e.stopPropagation?.(); Linking.openURL(awinLink); }}
                          style={styles.rebuyBtn}
                        >
                          <Text style={styles.rebuyText}>↺</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </TouchableOpacity>
                </Swipeable>
              );
            })
      }

      <TouchableOpacity style={styles.addDashed} onPress={() => router.push('/add-product' as any)}>
        <Text style={styles.addDashedText}>{t.archive.add_product}</Text>
      </TouchableOpacity>

      <View style={{ height: 32 }} />

      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={ms.overlay}><ProductForm isEdit={false} /></View>
      </Modal>

      <Modal visible={showEditModal} animationType="slide" transparent>
        <View style={ms.overlay}><ProductForm isEdit={true} /></View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 22, paddingTop: 60, paddingBottom: 16 },
  title: { fontSize: 24, fontWeight: '300', color: T.dark, letterSpacing: 0.5 },
  sub: { fontSize: 11, color: T.mid, marginTop: 2 },
  addCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: T.accent, alignItems: 'center', justifyContent: 'center' },
  addCircleText: { fontSize: 20, color: T.white, fontWeight: '300', lineHeight: 22 },
  expiryAlert: { marginHorizontal: 22, marginBottom: 12, backgroundColor: 'rgba(192,57,43,0.08)', borderRadius: 12, padding: 10, borderWidth: 1, borderColor: 'rgba(192,57,43,0.2)' },
  expiryAlertText: { fontSize: 12, color: T.red, textAlign: 'center', letterSpacing: 0.3 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: T.white, borderRadius: 12, marginHorizontal: 22, marginBottom: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: T.light },
  searchIcon: { fontSize: 16, color: T.light, marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 13, color: T.dark },
  filterScroll: { paddingLeft: 22, marginBottom: 12 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 100, backgroundColor: T.white, marginRight: 8, borderWidth: 1, borderColor: T.light },
  filterChipActive: { backgroundColor: T.dark, borderColor: T.dark },
  filterChipText: { fontSize: 10, color: T.mid, letterSpacing: 0.5 },
  filterChipTextActive: { color: 'rgba(184,133,106,0.9)' },
  limitCard: { marginHorizontal: 22, marginBottom: 14, backgroundColor: T.white, borderRadius: 14, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  limitRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 7 },
  limitLabel: { fontSize: 10, color: T.mid },
  limitVal: { fontSize: 10, color: T.accent, fontWeight: '500' },
  barBg: { height: 3, backgroundColor: T.bg2, borderRadius: 2, marginBottom: 6 },
  barFill: { height: 3, backgroundColor: T.accent, borderRadius: 2 },
  limitHint: { fontSize: 9, color: T.light },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: T.white, marginHorizontal: 22, marginBottom: 9, padding: 13, gap: 12, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  cardImage: { width: 48, height: 48, borderRadius: 12 },
  cardThumb: { width: 48, height: 48, borderRadius: 12, backgroundColor: T.bg2, alignItems: 'center', justifyContent: 'center' },
  cardThumbText: { fontSize: 18, color: T.accent, fontWeight: '300' },
  cardInfo: { flex: 1, minWidth: 0 },
  cardBrand: { fontSize: 8, color: T.mid, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 },
  cardName: { fontSize: 13, color: T.dark, fontWeight: '500', marginBottom: 4 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 5, height: 5, borderRadius: 3 },
  cardStatus: { fontSize: 9, letterSpacing: 0.3 },
  paoLabel: { fontSize: 9, letterSpacing: 0.3, marginLeft: 4 },
  cardRight: { alignItems: 'flex-end', gap: 8 },
  cardPrice: { fontSize: 13, color: T.accent, fontWeight: '500' },
  rebuyBtn: { width: 28, height: 28, borderRadius: 8, backgroundColor: T.bg2, borderWidth: 1, borderColor: T.light, alignItems: 'center', justifyContent: 'center' },
  rebuyText: { fontSize: 14, color: T.accent },
  deleteAction: { justifyContent: 'center', marginBottom: 9 },
  deleteActionBtn: { backgroundColor: T.red, justifyContent: 'center', alignItems: 'center', width: 80, height: '100%' as any, borderTopRightRadius: 16, borderBottomRightRadius: 16 },
  deleteActionText: { color: T.white, fontSize: 11, fontWeight: '600', letterSpacing: 0.3 },
  addDashed: { borderWidth: 1.5, borderColor: T.light, borderStyle: 'dashed', borderRadius: 16, marginHorizontal: 22, padding: 16, alignItems: 'center', marginTop: 4 },
  addDashedText: { fontSize: 13, color: T.mid },
  empty: { alignItems: 'center', paddingTop: 60, paddingBottom: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '300', color: T.dark, marginBottom: 6 },
  emptySub: { fontSize: 12, color: T.mid },
  center: { flex: 1, backgroundColor: T.bg, alignItems: 'center', justifyContent: 'center', padding: 40 },
  centerTitle: { fontSize: 18, fontWeight: '300', color: T.dark, marginBottom: 8 },
  centerSub: { fontSize: 13, color: T.mid, textAlign: 'center' },
});

const ms = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(26,19,16,0.6)', justifyContent: 'flex-end' },
  scroll: { maxHeight: '92%' as any },
  content: { backgroundColor: T.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 48 },
  handle: { width: 36, height: 4, backgroundColor: T.light, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  title: { fontSize: 20, fontWeight: '300', color: T.dark, marginBottom: 20, letterSpacing: 0.5 },
  label: { fontSize: 9, color: T.mid, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 6 },
  hint: { fontSize: 9, color: T.accent, marginBottom: 6 },
  input: { backgroundColor: T.white, borderRadius: 12, padding: 13, color: T.dark, fontSize: 13, borderWidth: 1, borderColor: T.light, marginBottom: 14 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100, backgroundColor: T.white, marginRight: 8, borderWidth: 1, borderColor: T.light },
  chipActive: { backgroundColor: T.dark, borderColor: T.dark },
  chipText: { fontSize: 10, color: T.mid },
  chipTextActive: { color: 'rgba(184,133,106,0.9)' },
  statusRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  statusChip: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, padding: 9, borderRadius: 10, borderWidth: 1, borderColor: T.light, backgroundColor: T.white },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, color: T.mid },
  photoPicker: { marginBottom: 16, alignItems: 'center' },
  photoPreview: { width: 100, height: 100, borderRadius: 16 },
  photoPlaceholder: { width: 100, height: 100, borderRadius: 16, backgroundColor: T.bg2, borderWidth: 1.5, borderColor: T.light, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  photoPlaceholderLabel: { fontSize: 10, color: T.mid, textAlign: 'center' },
  btns: { flexDirection: 'row', gap: 10, marginTop: 8 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: T.light, alignItems: 'center' },
  cancelText: { fontSize: 13, color: T.mid },
  saveBtn: { flex: 2, padding: 14, borderRadius: 12, backgroundColor: T.accent, alignItems: 'center' },
  saveText: { fontSize: 13, fontWeight: '600', color: T.white },
  dbToggle: { backgroundColor: T.bg2, borderRadius: 12, padding: 12, marginBottom: 4, borderWidth: 1, borderColor: T.light, alignItems: 'center' },
  dbToggleText: { fontSize: 12, color: T.accent },
  dbBox: { backgroundColor: T.white, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: T.light, marginBottom: 4 },
  dbInput: { backgroundColor: T.bg2, borderRadius: 10, padding: 11, color: T.dark, fontSize: 13, borderWidth: 1, borderColor: T.light, marginBottom: 8 },
  dbResult: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 9, borderBottomWidth: 1, borderBottomColor: T.bg2 },
  dbThumb: { width: 36, height: 36, borderRadius: 9, backgroundColor: T.bg2, alignItems: 'center', justifyContent: 'center' },
  dbName: { fontSize: 12, color: T.dark, fontWeight: '500' },
  dbBrand: { fontSize: 10, color: T.mid },
  dbEmpty: { fontSize: 11, color: T.mid, textAlign: 'center', padding: 10 },
});