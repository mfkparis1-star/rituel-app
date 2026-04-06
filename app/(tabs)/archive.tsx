import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Linking, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTranslation } from '../../hooks/useTranslation';
import { supabase } from '../../lib/supabase';
import { getAwinLink } from '../../utils/awin';

const T = {
  bg: '#08080E', surface: '#11111A', border: '#1C1C2E',
  accent: '#C9A96E', rose: '#E87FAC', text: '#F5F0F8',
  textMid: '#B8B0C4', textSoft: '#6B6278',
};

const CATEGORIES_FR = ['Nettoyant','Hydratant','Sérum','SPF','Tonique','Masque','Maquillage','Parfum','Corps','Cheveux'];
const CATEGORIES_EN = ['Cleanser','Moisturizer','Serum','SPF','Toner','Mask','Makeup','Perfume','Body','Hair'];
const ICONS: Record<string, string> = {
  'Nettoyant':'🫧','Hydratant':'🧴','Sérum':'💧','SPF':'☀️','Tonique':'💦','Masque':'🌿','Maquillage':'💄','Parfum':'🌸','Corps':'🪷','Cheveux':'✨',
  'Cleanser':'🫧','Moisturizer':'🧴','Serum':'💧','Toner':'💦','Mask':'🌿','Makeup':'💄','Perfume':'🌸','Body':'🪷','Hair':'✨',
};
const STATUSES_FR = [
  { id: 'active', label: 'Actif', color: '#52DBA8' },
  { id: 'finished', label: 'Terminé', color: '#FF5272' },
  { id: 'stocked', label: 'En stock', color: '#5BC4F8' },
];
const STATUSES_EN = [
  { id: 'active', label: 'Active', color: '#52DBA8' },
  { id: 'finished', label: 'Finished', color: '#FF5272' },
  { id: 'stocked', label: 'In stock', color: '#5BC4F8' },
];

const PAO_MONTHS: Record<string, number> = {
  'Nettoyant': 12, 'Cleanser': 12,
  'Hydratant': 12, 'Moisturizer': 12,
  'Sérum': 6, 'Serum': 6,
  'SPF': 12,
  'Tonique': 12, 'Toner': 12,
  'Masque': 6, 'Mask': 6,
  'Maquillage': 6, 'Makeup': 6,
  'Parfum': 36, 'Perfume': 36,
  'Corps': 18, 'Body': 18,
  'Cheveux': 12, 'Hair': 12,
};

type Product = {
  id: string; brand: string; name: string; category: string;
  status: string; price: number; icon: string; notes: string;
  image_url?: string; created_at: string; opened_at?: string;
};

type BeautyProduct = {
  id: string; brand: string; name: string; category: string; description: string;
};

function getPAOStatus(product: Product): { label: string; color: string; daysLeft: number } | null {
  if (!product.opened_at || product.status !== 'active') return null;
  const opened = new Date(product.opened_at);
  const paoMonths = PAO_MONTHS[product.category] || 12;
  const expiry = new Date(opened);
  expiry.setMonth(expiry.getMonth() + paoMonths);
  const today = new Date();
  const daysLeft = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (daysLeft < 0) return { label: '⚠️ Expiré', color: '#FF5272', daysLeft };
  if (daysLeft <= 30) return { label: `⚠️ ${daysLeft}j`, color: '#F5A623', daysLeft };
  if (daysLeft <= 60) return { label: `⏰ ${daysLeft}j`, color: '#FFD60A', daysLeft };
  return { label: `✓ ${daysLeft}j`, color: '#52DBA8', daysLeft };
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

  return (
    <View style={{ marginBottom: 14 }}>
      <TouchableOpacity onPress={() => setOpen(!open)} style={dbStyles.toggle}>
        <Text style={dbStyles.toggleText}>{lang === 'fr' ? '🔍 Chercher dans notre base beauté' : '🔍 Search our beauty database'}</Text>
      </TouchableOpacity>
      {open && (
        <View style={dbStyles.box}>
          <TextInput style={dbStyles.input} placeholder={lang === 'fr' ? 'ex: Avène, CeraVe...' : 'ex: CeraVe, Neutrogena...'} placeholderTextColor="#6B6278" value={query} onChangeText={search} autoCorrect={false} blurOnSubmit={false} />
          {loading && <ActivityIndicator color="#C9A96E" style={{ marginVertical: 8 }} />}
          {results.map((p) => (
            <TouchableOpacity key={p.id} onPress={() => { onSelect(p); setOpen(false); setQuery(''); setResults([]); }} style={dbStyles.result}>
              <View style={dbStyles.resultIcon}><Text style={{ fontSize: 20 }}>{ICONS[p.category] || '✨'}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={dbStyles.name} numberOfLines={1}>{p.name}</Text>
                <Text style={dbStyles.brand}>{p.brand} · {p.category}</Text>
              </View>
            </TouchableOpacity>
          ))}
          {!loading && query.length >= 2 && results.length === 0 && (
            <Text style={dbStyles.noResult}>{lang === 'fr' ? 'Aucun résultat — ajoutez manuellement' : 'No results — add manually'}</Text>
          )}
        </View>
      )}
    </View>
  );
}

const dbStyles = StyleSheet.create({
  toggle: { backgroundColor: 'rgba(201,169,110,0.1)', borderRadius: 12, padding: 12, marginBottom: 4, borderWidth: 1, borderColor: 'rgba(201,169,110,0.2)', alignItems: 'center' },
  toggleText: { fontSize: 13, color: '#C9A96E', fontWeight: '600' },
  box: { backgroundColor: '#08080E', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#1C1C2E', marginBottom: 4 },
  input: { backgroundColor: '#11111A', borderRadius: 10, padding: 12, color: '#F5F0F8', fontSize: 14, borderWidth: 1, borderColor: '#1C1C2E', marginBottom: 8 },
  result: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderBottomWidth: 1, borderBottomColor: '#1C1C2E' },
  resultIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#11111A', alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 13, color: '#F5F0F8', fontWeight: '600' },
  brand: { fontSize: 11, color: '#6B6278' },
  noResult: { fontSize: 12, color: '#6B6278', textAlign: 'center', padding: 12 },
});

export default function ArchiveScreen() {
  const { t, lang } = useTranslation();
  const CATEGORIES = lang === 'fr' ? CATEGORIES_FR : CATEGORIES_EN;
  const STATUSES = lang === 'fr' ? STATUSES_FR : STATUSES_EN;

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

  const loadProducts = async (userId: string) => {
    const { data, error } = await supabase.from('products').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (error) { console.warn('loadProducts error:', error.message); }
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

  const handleDBSelect = (p: BeautyProduct) => {
    setName(p.name); setBrand(p.brand); setCategory(p.category || CATEGORIES[1]);
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
    if (!brand || !name) { Alert.alert('', lang === 'fr' ? 'Marque et nom sont obligatoires' : 'Brand and name are required'); return; }
    if (!user) return;
    setSaving(true);
    let imageUrl = null;
    if (imageBase64) imageUrl = await uploadImage(imageBase64, user.id);
    const { error } = await supabase.from('products').insert({
      user_id: user.id, brand, name, category,
      price: parseFloat(price) || 0, notes,
      icon: ICONS[category] || '✨', status, image_url: imageUrl,
      opened_at: openedAt || null,
    });
    if (error) { Alert.alert('Erreur', error.message); }
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
      notes, status, icon: ICONS[category] || '✨', image_url: imageUrl,
      opened_at: openedAt || null,
    }).eq('id', selectedProduct.id);
    if (error) { Alert.alert('Erreur', error.message); }
    else { setShowEditModal(false); resetForm(); loadProducts(user.id); }
    setSaving(false);
  };

  const deleteProduct = async (id: string) => {
    const confirmed = window.confirm(
      lang === 'fr' ? 'Supprimer ce produit ?' : 'Delete this product?'
    );
    if (confirmed) {
      await supabase.from('products').delete().eq('id', id);
      if (user) loadProducts(user.id);
    }
  };

  const filteredProducts = products
    .filter(p => filterStatus === 'all' || p.status === filterStatus)
    .filter(p => search === '' || p.name.toLowerCase().includes(search.toLowerCase()) || p.brand.toLowerCase().includes(search.toLowerCase()));

  const total = products.reduce((s, p) => s + (p.price || 0), 0).toFixed(2);
  const getStatusColor = (s: string) => STATUSES.find(x => x.id === s)?.color || '#fff';
  const getStatusLabel = (s: string) => STATUSES.find(x => x.id === s)?.label || s;
  const expiringCount = products.filter(p => { const pao = getPAOStatus(p); return pao && pao.daysLeft <= 30; }).length;

  const paoMonthsLabel = (cat: string) => {
    const m = PAO_MONTHS[cat] || 12;
    return lang === 'fr' ? `PAO: ${m} mois` : `PAO: ${m} months`;
  };

  if (!user) return (
    <View style={styles.center}>
      <Text style={styles.centerIcon}>🔐</Text>
      <Text style={styles.centerTitle}>{t.archive.login_required}</Text>
      <Text style={styles.centerSub}>{t.archive.login_sub}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t.archive.title}</Text>
        <Text style={styles.sub}>{products.length} {lang === 'fr' ? 'produits' : 'products'} · €{total} {lang === 'fr' ? 'au total' : 'total'}</Text>
      </View>

      {expiringCount > 0 && (
        <View style={styles.expiryAlert}>
          <Text style={styles.expiryAlertText}>
            ⚠️ {expiringCount} {lang === 'fr' ? `produit${expiringCount > 1 ? 's' : ''} expire${expiringCount > 1 ? 'nt' : ''} bientôt` : `product${expiringCount > 1 ? 's' : ''} expiring soon`}
          </Text>
        </View>
      )}

      <TextInput style={styles.searchInput} placeholder={t.archive.search} placeholderTextColor={T.textSoft} value={search} onChangeText={setSearch} autoCorrect={false} blurOnSubmit={false} />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        {[{ id: 'all', label: t.archive.filter_all }, ...STATUSES].map(s => (
          <TouchableOpacity key={s.id} onPress={() => setFilterStatus(s.id)} style={[styles.filterChip, filterStatus===s.id && styles.filterChipActive]}>
            <Text style={[styles.filterChipText, filterStatus===s.id && styles.filterChipTextActive]}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.limitBar}>
        <View style={styles.limitRow}>
          <Text style={styles.limitLabel}>{t.archive.free_limit}</Text>
          <Text style={styles.limitVal}>{products.length}/30</Text>
        </View>
        <View style={styles.barBg}>
          <View style={[styles.barFill, { width: `${Math.min((products.length/30)*100,100)}%` as any }]} />
        </View>
        <Text style={styles.limitHint}>{t.archive.premium_hint}</Text>
      </View>

      {loading ? <ActivityIndicator color={T.accent} style={{ marginTop: 40 }} /> :
       filteredProducts.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>{search ? '🔍' : '✨'}</Text>
          <Text style={styles.emptyTitle}>{search ? (lang === 'fr' ? 'Aucun résultat' : 'No results') : t.archive.empty_title}</Text>
          <Text style={styles.emptySub}>{search ? `"${search}"` : t.archive.empty_sub}</Text>
        </View>
      ) : filteredProducts.map(p => {
        const pao = getPAOStatus(p);
        const awinLink = getAwinLink(p.brand);
        return (
          <TouchableOpacity key={p.id} onPress={() => openEdit(p)} style={styles.card}>
            {p.image_url ? <Image source={{ uri: p.image_url }} style={styles.cardImage} /> : <Text style={styles.icon}>{p.icon}</Text>}
            <View style={styles.info}>
              <View style={styles.row}>
                <Text style={styles.name}>{p.name}</Text>
                <Text style={[styles.badge, { color: getStatusColor(p.status) }]}>{getStatusLabel(p.status)}</Text>
              </View>
              <Text style={styles.brand}>{p.brand} · {p.category}</Text>
              {pao && (
                <Text style={[styles.paoText, { color: pao.color }]}>{pao.label}</Text>
              )}
              {p.notes ? <Text style={styles.notes}>{p.notes}</Text> : null}
            </View>
            <View style={styles.cardRight}>
              <Text style={styles.price}>€{p.price}</Text>
              {p.status === 'finished' && awinLink && (
                <TouchableOpacity
                  onPress={(e: any) => {
                    e.stopPropagation?.();
                    e.preventDefault?.();
                    Linking.openURL(awinLink);
                  }}
                  style={styles.rebuyBtn}
                >
                  <Text style={styles.rebuyText}>🛒</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={(e: any) => {
                  e.stopPropagation?.();
                  e.preventDefault?.();
                  deleteProduct(p.id);
                }}
              >
                <Text style={styles.deleteBtnText}>🗑</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        );
      })}

      <TouchableOpacity style={styles.addBtn} onPress={() => { resetForm(); setShowAddModal(true); }}>
        <Text style={styles.addText}>{t.archive.add_product}</Text>
      </TouchableOpacity>

      {/* ADD MODAL */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalScroll} keyboardShouldPersistTaps="handled">
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{t.archive.new_product}</Text>
              <DBSearch onSelect={handleDBSelect} lang={lang} />
              <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
                {imageUri ? <Image source={{ uri: imageUri }} style={styles.imagePreview} /> : (
                  <View style={styles.imagePlaceholder}>
                    <Text style={styles.imagePlaceholderIcon}>📷</Text>
                    <Text style={styles.imagePlaceholderText}>{t.archive.add_photo}</Text>
                  </View>
                )}
              </TouchableOpacity>
              <Text style={styles.fieldLabel}>{t.archive.brand}</Text>
              <TextInput style={styles.input} placeholder="ex: La Roche-Posay" placeholderTextColor={T.textSoft} value={brand} onChangeText={setBrand} autoCorrect={false} blurOnSubmit={false} />
              <Text style={styles.fieldLabel}>{t.archive.product_name}</Text>
              <TextInput style={styles.input} placeholder="ex: Toleriane Double Repair" placeholderTextColor={T.textSoft} value={name} onChangeText={setName} autoCorrect={false} blurOnSubmit={false} />
              <Text style={styles.fieldLabel}>{t.archive.category}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                {CATEGORIES.map(c => (
                  <TouchableOpacity key={c} onPress={() => setCategory(c)} style={[styles.catChip, category===c && styles.catChipActive]}>
                    <Text style={[styles.catChipText, category===c && styles.catChipTextActive]}>{ICONS[c]} {c}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <Text style={styles.fieldLabel}>{t.archive.status}</Text>
              <View style={styles.statusRow}>
                {STATUSES.map(s => (
                  <TouchableOpacity key={s.id} onPress={() => setStatus(s.id)} style={[styles.statusChip, status===s.id && { backgroundColor: s.color+'20', borderColor: s.color }]}>
                    <Text style={[styles.statusChipText, status===s.id && { color: s.color }]}>{s.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.fieldLabel}>
                {lang === 'fr' ? '📅 Date d\'ouverture (optionnel)' : '📅 Opening date (optional)'}
              </Text>
              <Text style={styles.paoHint}>{paoMonthsLabel(category)}</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD (ex: 2024-01-15)"
                placeholderTextColor={T.textSoft}
                value={openedAt}
                onChangeText={setOpenedAt}
                autoCorrect={false}
                blurOnSubmit={false}
              />
              <Text style={styles.fieldLabel}>{t.archive.price}</Text>
              <TextInput style={styles.input} placeholder="ex: 18.50" placeholderTextColor={T.textSoft} value={price} onChangeText={setPrice} keyboardType="numeric" blurOnSubmit={false} />
              <Text style={styles.fieldLabel}>{t.archive.notes}</Text>
              <TextInput style={[styles.input, { height: 70 }]} placeholder={lang === 'fr' ? 'Votre avis...' : 'Your opinion...'} placeholderTextColor={T.textSoft} value={notes} onChangeText={setNotes} multiline />
              <View style={styles.modalBtns}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddModal(false)}>
                  <Text style={styles.cancelBtnText}>{t.archive.cancel}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={addProduct} disabled={saving || uploading}>
                  <Text style={styles.saveBtnText}>{uploading ? 'Upload...' : saving ? '...' : t.archive.add}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* EDIT MODAL */}
      <Modal visible={showEditModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalScroll} keyboardShouldPersistTaps="handled">
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{t.archive.edit_product}</Text>
              <DBSearch onSelect={handleDBSelect} lang={lang} />
              <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
                {imageUri ? <Image source={{ uri: imageUri }} style={styles.imagePreview} /> : (
                  <View style={styles.imagePlaceholder}>
                    <Text style={styles.imagePlaceholderIcon}>📷</Text>
                    <Text style={styles.imagePlaceholderText}>{t.archive.add_photo}</Text>
                  </View>
                )}
              </TouchableOpacity>
              <Text style={styles.fieldLabel}>{t.archive.brand}</Text>
              <TextInput style={styles.input} placeholder="ex: La Roche-Posay" placeholderTextColor={T.textSoft} value={brand} onChangeText={setBrand} autoCorrect={false} blurOnSubmit={false} />
              <Text style={styles.fieldLabel}>{t.archive.product_name}</Text>
              <TextInput style={styles.input} placeholder="ex: Toleriane Double Repair" placeholderTextColor={T.textSoft} value={name} onChangeText={setName} autoCorrect={false} blurOnSubmit={false} />
              <Text style={styles.fieldLabel}>{t.archive.category}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                {CATEGORIES.map(c => (
                  <TouchableOpacity key={c} onPress={() => setCategory(c)} style={[styles.catChip, category===c && styles.catChipActive]}>
                    <Text style={[styles.catChipText, category===c && styles.catChipTextActive]}>{ICONS[c]} {c}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <Text style={styles.fieldLabel}>{t.archive.status}</Text>
              <View style={styles.statusRow}>
                {STATUSES.map(s => (
                  <TouchableOpacity key={s.id} onPress={() => setStatus(s.id)} style={[styles.statusChip, status===s.id && { backgroundColor: s.color+'20', borderColor: s.color }]}>
                    <Text style={[styles.statusChipText, status===s.id && { color: s.color }]}>{s.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.fieldLabel}>
                {lang === 'fr' ? '📅 Date d\'ouverture (optionnel)' : '📅 Opening date (optional)'}
              </Text>
              <Text style={styles.paoHint}>{paoMonthsLabel(category)}</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD (ex: 2024-01-15)"
                placeholderTextColor={T.textSoft}
                value={openedAt}
                onChangeText={setOpenedAt}
                autoCorrect={false}
                blurOnSubmit={false}
              />
              <Text style={styles.fieldLabel}>{t.archive.price}</Text>
              <TextInput style={styles.input} placeholder="ex: 18.50" placeholderTextColor={T.textSoft} value={price} onChangeText={setPrice} keyboardType="numeric" blurOnSubmit={false} />
              <Text style={styles.fieldLabel}>{t.archive.notes}</Text>
              <TextInput style={[styles.input, { height: 70 }]} placeholder={lang === 'fr' ? 'Votre avis...' : 'Your opinion...'} placeholderTextColor={T.textSoft} value={notes} onChangeText={setNotes} multiline />
              <View style={styles.modalBtns}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowEditModal(false)}>
                  <Text style={styles.cancelBtnText}>{t.archive.cancel}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={updateProduct} disabled={saving || uploading}>
                  <Text style={styles.saveBtnText}>{uploading ? 'Upload...' : saving ? '...' : t.archive.save}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg, padding: 20 },
  header: { paddingTop: 60, paddingBottom: 16 },
  title: { fontSize: 26, fontWeight: '700', color: T.text, marginBottom: 4 },
  sub: { fontSize: 13, color: T.textSoft },
  expiryAlert: { backgroundColor: 'rgba(255,82,114,0.1)', borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,82,114,0.3)' },
  expiryAlertText: { fontSize: 13, color: '#FF5272', fontWeight: '600', textAlign: 'center' },
  searchInput: { backgroundColor: T.surface, borderRadius: 14, padding: 14, color: T.text, fontSize: 14, borderWidth: 1, borderColor: T.border, marginBottom: 12 },
  filterRow: { marginBottom: 14 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, backgroundColor: T.surface, marginRight: 8, borderWidth: 1, borderColor: T.border },
  filterChipActive: { backgroundColor: T.accent, borderColor: T.accent },
  filterChipText: { fontSize: 12, color: T.textSoft, fontWeight: '500' },
  filterChipTextActive: { color: '#1A1208', fontWeight: '700' },
  limitBar: { backgroundColor: T.surface, borderRadius: 14, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: T.border },
  limitRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  limitLabel: { fontSize: 11, color: T.textSoft },
  limitVal: { fontSize: 11, color: T.accent, fontWeight: '600' },
  barBg: { height: 6, backgroundColor: '#1E1A22', borderRadius: 3, overflow: 'hidden', marginBottom: 6 },
  barFill: { height: '100%' as any, backgroundColor: T.accent, borderRadius: 3 },
  limitHint: { fontSize: 10, color: T.textSoft },
  card: { backgroundColor: T.surface, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: T.border, flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardImage: { width: 44, height: 44, borderRadius: 10 },
  icon: { fontSize: 28, width: 44, textAlign: 'center' },
  info: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 },
  name: { fontSize: 13, fontWeight: '700', color: T.text, flex: 1 },
  badge: { fontSize: 10, fontWeight: '600', marginLeft: 8 },
  brand: { fontSize: 11, color: T.textSoft, marginBottom: 2 },
  paoText: { fontSize: 10, fontWeight: '600', marginBottom: 2 },
  notes: { fontSize: 11, color: T.textMid, fontStyle: 'italic' },
  cardRight: { alignItems: 'flex-end', gap: 8 },
  price: { fontSize: 14, fontWeight: '700', color: T.accent },
  rebuyBtn: { backgroundColor: 'rgba(201,169,110,0.15)', borderRadius: 8, padding: 6, borderWidth: 1, borderColor: 'rgba(201,169,110,0.3)' },
  rebuyText: { fontSize: 16 },
  deleteBtnText: { fontSize: 16 },
  addBtn: { borderWidth: 1.5, borderColor: T.border, borderStyle: 'dashed', borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 4, marginBottom: 40 },
  addText: { fontSize: 14, color: T.textSoft },
  empty: { alignItems: 'center', paddingTop: 60, paddingBottom: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: T.text, marginBottom: 6 },
  emptySub: { fontSize: 13, color: T.textSoft },
  center: { flex: 1, backgroundColor: T.bg, alignItems: 'center', justifyContent: 'center', padding: 40 },
  centerIcon: { fontSize: 48, marginBottom: 12 },
  centerTitle: { fontSize: 20, fontWeight: '700', color: T.text, marginBottom: 8 },
  centerSub: { fontSize: 13, color: T.textSoft, textAlign: 'center' },
  imagePicker: { marginBottom: 16, alignItems: 'center' },
  imagePreview: { width: 120, height: 120, borderRadius: 16 },
  imagePlaceholder: { width: 120, height: 120, borderRadius: 16, backgroundColor: T.bg, borderWidth: 1.5, borderColor: T.border, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  imagePlaceholderIcon: { fontSize: 32, marginBottom: 6 },
  imagePlaceholderText: { fontSize: 11, color: T.textSoft },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalScroll: { maxHeight: '90%' as any },
  modalContent: { backgroundColor: T.surface, borderRadius: 24, padding: 24, paddingBottom: 40, borderWidth: 1, borderColor: T.border },
  modalTitle: { fontSize: 20, fontWeight: '700', color: T.text, marginBottom: 20 },
  fieldLabel: { fontSize: 12, color: T.textSoft, marginBottom: 6, fontWeight: '500' },
  paoHint: { fontSize: 10, color: T.accent, marginBottom: 6, fontWeight: '500' },
  input: { backgroundColor: T.bg, borderRadius: 12, padding: 14, color: T.text, fontSize: 14, borderWidth: 1, borderColor: T.border, marginBottom: 14 },
  catChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: T.bg, marginRight: 8, borderWidth: 1, borderColor: T.border },
  catChipActive: { backgroundColor: T.accent, borderColor: T.accent },
  catChipText: { fontSize: 11, color: T.textSoft },
  catChipTextActive: { color: '#1A1208', fontWeight: '700' },
  statusRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  statusChip: { flex: 1, padding: 8, borderRadius: 10, borderWidth: 1, borderColor: T.border, alignItems: 'center' },
  statusChipText: { fontSize: 11, color: T.textSoft, fontWeight: '500' },
  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 8 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: T.border, alignItems: 'center' },
  cancelBtnText: { fontSize: 14, color: T.textSoft },
  saveBtn: { flex: 2, padding: 14, borderRadius: 12, backgroundColor: T.accent, alignItems: 'center' },
  saveBtnText: { fontSize: 14, fontWeight: '700', color: '#1A1208' },
});