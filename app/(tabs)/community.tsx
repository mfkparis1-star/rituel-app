import * as ImagePicker from 'expo-image-picker';
import { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Image, Modal, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { useTranslation } from '../../hooks/useTranslation';
import { supabase } from '../../lib/supabase';

const T = {
  bg: '#FDF8F5', surface: '#FFFFFF', border: '#E8D5C8',
  accent: '#B8856A', rose: '#D4547E', text: '#1A1310',
  textMid: '#6B5245', textSoft: '#A89080',
};

type Post = {
  id: string; user_id: string; caption: string; skin_type: string;
  product_names: string[]; likes_count: number; created_at: string;
  user_email?: string; display_name?: string; image_url?: string;
};

export default function CommunityScreen() {
  const { t, lang } = useTranslation();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [user, setUser] = useState<any>(null);
  const [likedPosts, setLikedPosts] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [caption, setCaption] = useState('');
  const [productNames, setProductNames] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const swipeableRefs = useRef<{ [key: string]: Swipeable | null }>({});

  const SKIN_FILTERS = [
    { id: 'all', label: lang === 'fr' ? 'Tous' : lang === 'tr' ? 'Tümü' : 'All' },
    { id: 'dry', label: lang === 'fr' ? 'Sèche' : lang === 'tr' ? 'Kuru' : 'Dry' },
    { id: 'oily', label: lang === 'fr' ? 'Grasse' : lang === 'tr' ? 'Yağlı' : 'Oily' },
    { id: 'combination', label: lang === 'fr' ? 'Mixte' : lang === 'tr' ? 'Karma' : 'Combination' },
    { id: 'normal', label: lang === 'fr' ? 'Normale' : lang === 'tr' ? 'Normal' : 'Normal' },
    { id: 'sensitive', label: lang === 'fr' ? 'Sensible' : lang === 'tr' ? 'Hassas' : 'Sensitive' },
  ];

  const lbl = (fr: string, tr: string, en: string) => lang === 'fr' ? fr : lang === 'tr' ? tr : en;

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user;
      setUser(u || null);
      if (u) loadLikedPosts(u.id);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user;
      setUser(u || null);
      if (u) loadLikedPosts(u.id);
    });
    loadPosts();
    return () => listener.subscription.unsubscribe();
  }, []);

  const loadPosts = async () => {
    const { data, error } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
    if (error) { console.warn('loadPosts error:', error.message); }
    else if (data) setPosts(data);
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPosts();
    if (user) await loadLikedPosts(user.id);
    setRefreshing(false);
  };

  const loadLikedPosts = async (userId: string) => {
    const { data, error } = await supabase.from('post_likes').select('post_id').eq('user_id', userId);
    if (error) { console.warn('loadLikedPosts error:', error.message); return; }
    if (data) setLikedPosts(data.map((l: any) => l.post_id));
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [4, 3], quality: 0.6, base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setImageBase64(result.assets[0].base64 ? `data:image/jpeg;base64,${result.assets[0].base64}` : null);
    }
  };

  const uploadImage = async (base64: string, userId: string): Promise<string | null> => {
    try {
      const fileName = `${userId}/${Date.now()}.jpg`;
      const base64Data = base64.replace(/^data:image\/\w+;base64,/, '');
      const byteArray = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      const { error } = await supabase.storage.from('post-images').upload(fileName, byteArray, { contentType: 'image/jpeg' });
      if (error) { console.warn('uploadImage error:', error.message); return null; }
      const { data } = supabase.storage.from('post-images').getPublicUrl(fileName);
      return data.publicUrl;
    } catch (e) { console.warn('uploadImage exception:', e); return null; }
  };

  const toggleLike = async (postId: string) => {
    if (!user) { Alert.alert('', lbl('Connectez-vous pour aimer', 'Beğenmek için giriş yapın', 'Sign in to like')); return; }
    const liked = likedPosts.includes(postId);
    const post = posts.find(p => p.id === postId)!;
    if (liked) {
      await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', user.id);
      await supabase.from('posts').update({ likes_count: post.likes_count - 1 }).eq('id', postId);
      setLikedPosts(p => p.filter(id => id !== postId));
      setPosts(p => p.map(p => p.id === postId ? { ...p, likes_count: p.likes_count - 1 } : p));
    } else {
      await supabase.from('post_likes').insert({ post_id: postId, user_id: user.id });
      await supabase.from('posts').update({ likes_count: post.likes_count + 1 }).eq('id', postId);
      setLikedPosts(p => [...p, postId]);
      setPosts(p => p.map(p => p.id === postId ? { ...p, likes_count: p.likes_count + 1 } : p));
    }
  };

  const deletePost = async (postId: string) => {
    Alert.alert(
      lbl('Supprimer ce post ?', 'Bu postu sil?', 'Delete this post?'),
      lbl('Cette action est irréversible.', 'Bu işlem geri alınamaz.', 'This action cannot be undone.'),
      [
        {
          text: lbl('Annuler', 'İptal', 'Cancel'),
          style: 'cancel',
          onPress: () => swipeableRefs.current[postId]?.close(),
        },
        {
          text: lbl('Supprimer', 'Sil', 'Delete'),
          style: 'destructive',
          onPress: async () => {
            await supabase.from('post_likes').delete().eq('post_id', postId);
            const { error } = await supabase.from('posts').delete().eq('id', postId);
            if (error) {
              Alert.alert('Erreur', error.message);
            } else {
              setPosts(prev => prev.filter(p => p.id !== postId));
            }
          },
        },
      ]
    );
  };

  const sharePost = async () => {
    if (!user) { Alert.alert('', lbl('Connectez-vous pour partager', 'Paylaşmak için giriş yapın', 'Sign in to share')); return; }
    if (!caption.trim()) { Alert.alert('', lbl('Écrivez quelque chose', 'Bir şeyler yazın', 'Write something')); return; }
    setSaving(true);
    let imageUrl = null;
    if (imageBase64) {
      setUploading(true);
      imageUrl = await uploadImage(imageBase64, user.id);
      setUploading(false);
    }
    const { data: profile } = await supabase.from('profiles').select('full_name, skin_type').eq('id', user.id).single();
    const { error } = await supabase.from('posts').insert({
      user_id: user.id, user_email: user.email,
      display_name: profile?.full_name || user.email?.split('@')[0] || 'Membre',
      caption: caption.trim(), skin_type: profile?.skin_type || '',
      product_names: productNames.split(',').map((p: string) => p.trim()).filter(Boolean),
      likes_count: 0, image_url: imageUrl,
    });
    if (error) { Alert.alert('Erreur', error.message); }
    else { setShowModal(false); setCaption(''); setProductNames(''); setImageUri(null); setImageBase64(null); loadPosts(); }
    setSaving(false);
  };

  const renderRightActions = (postId: string, progress: Animated.AnimatedInterpolation<number>) => {
    const trans = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [80, 0],
    });
    return (
      <Animated.View style={[styles.deleteAction, { transform: [{ translateX: trans }] }]}>
        <TouchableOpacity onPress={() => deletePost(postId)} style={styles.deleteActionBtn}>
          <Text style={styles.deleteActionIcon}>🗑</Text>
          <Text style={styles.deleteActionText}>{lbl('Supprimer', 'Sil', 'Delete')}</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const filteredPosts = filter === 'all' ? posts : posts.filter(p => p.skin_type === filter);
  const getDisplayName = (post: Post) => post.display_name || post.user_email?.split('@')[0] || 'Membre';

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={T.accent}
          colors={[T.accent]}
        />
      }
    >
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{t.community.title}</Text>
          <Text style={styles.sub}>{t.community.sub}</Text>
        </View>
        {user && (
          <TouchableOpacity style={styles.shareBtn} onPress={() => setShowModal(true)}>
            <Text style={styles.shareBtnText}>{t.community.share_btn}</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters}>
        {SKIN_FILTERS.map(f => (
          <TouchableOpacity key={f.id} onPress={() => setFilter(f.id)} style={[styles.chip, filter===f.id && styles.chipActive]}>
            <Text style={[styles.chipText, filter===f.id && styles.chipTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <Text style={styles.loading}>...</Text>
      ) : filteredPosts.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>💬</Text>
          <Text style={styles.emptyTitle}>{t.community.empty_title}</Text>
          <Text style={styles.emptySub}>{t.community.empty_sub}</Text>
        </View>
      ) : (
        filteredPosts.map(post => {
          const isOwn = user && user.id === post.user_id;
          const cardContent = (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{getDisplayName(post).charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{getDisplayName(post)}</Text>
                  <Text style={styles.userSkin}>Rituel member · {new Date(post.created_at).toLocaleDateString(lang === 'fr' ? 'fr-FR' : lang === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'short' })}</Text>
                </View>
              </View>
              {post.image_url && <Image source={{ uri: post.image_url }} style={styles.postImage} resizeMode="cover" />}
              <Text style={styles.caption}>{post.caption}</Text>
              {post.product_names?.length > 0 && (
                <View style={styles.products}>
                  {post.product_names.map((name: string, i: number) => (
                    <View key={i} style={styles.productTag}>
                      <Text style={styles.productTagText}>{name}</Text>
                    </View>
                  ))}
                </View>
              )}
              <View style={styles.actions}>
                <TouchableOpacity onPress={() => toggleLike(post.id)} style={styles.action}>
                  <Text style={[styles.actionIcon, likedPosts.includes(post.id) && styles.liked]}>
                    {likedPosts.includes(post.id) ? '♥' : '♡'}
                  </Text>
                  <Text style={styles.actionText}>{post.likes_count}</Text>
                </TouchableOpacity>
                {isOwn && (
                  <Text style={styles.swipeHint}>{lbl('← glisser pour supprimer', '← silmek için kaydır', '← swipe to delete')}</Text>
                )}
              </View>
            </View>
          );

          if (isOwn) {
            return (
              <Swipeable
                key={post.id}
                ref={(ref) => { swipeableRefs.current[post.id] = ref; }}
                renderRightActions={(progress) => renderRightActions(post.id, progress)}
                rightThreshold={40}
                overshootRight={false}
              >
                {cardContent}
              </Swipeable>
            );
          }
          return <View key={post.id}>{cardContent}</View>;
        })
      )}

      <View style={{ height: 60 }} />

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalScroll} keyboardShouldPersistTaps="handled">
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{t.community.share_title}</Text>
              <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
                {imageUri ? (
                  <Image source={{ uri: imageUri }} style={styles.imagePreview} resizeMode="cover" />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Text style={styles.imagePlaceholderIcon}>📷</Text>
                    <Text style={styles.imagePlaceholderText}>{lbl('Ajouter une photo (optionnel)', 'Fotoğraf ekle (opsiyonel)', 'Add a photo (optional)')}</Text>
                  </View>
                )}
              </TouchableOpacity>
              <Text style={styles.fieldLabel}>{t.community.message}</Text>
              <TextInput style={[styles.input, { height: 100 }]} placeholder={lbl('Partagez votre expérience...', 'Deneyiminizi paylaşın...', 'Share your experience...')} placeholderTextColor={T.textSoft} value={caption} onChangeText={setCaption} multiline blurOnSubmit={false} />
              <Text style={styles.fieldLabel}>{t.community.products_used}</Text>
              <TextInput style={styles.input} placeholder="ex: La Roche-Posay, CeraVe" placeholderTextColor={T.textSoft} value={productNames} onChangeText={setProductNames} autoCorrect={false} blurOnSubmit={false} />
              <View style={styles.modalBtns}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowModal(false); setImageUri(null); setImageBase64(null); }}>
                  <Text style={styles.cancelBtnText}>{lbl('Annuler', 'İptal', 'Cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={sharePost} disabled={saving || uploading}>
                  <Text style={styles.saveBtnText}>{uploading ? 'Upload...' : saving ? '...' : t.community.publish}</Text>
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
  container: { flex: 1, backgroundColor: T.bg, paddingHorizontal: 20 },
  header: { paddingTop: 70, paddingBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: 10 },
  title: { fontSize: 26, fontWeight: '700', color: T.text, marginBottom: 4 },
  sub: { fontSize: 12, color: T.textSoft },
  shareBtn: { backgroundColor: T.accent, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8 },
  shareBtnText: { fontSize: 12, fontWeight: '700', color: '#1A1208' },
  filters: { marginBottom: 20 },
  chip: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, backgroundColor: T.surface, marginRight: 8, borderWidth: 1, borderColor: T.border },
  chipActive: { backgroundColor: T.accent, borderColor: T.accent },
  chipText: { fontSize: 12, color: T.textSoft, fontWeight: '500' },
  chipTextActive: { color: '#1A1208', fontWeight: '700' },
  loading: { textAlign: 'center', color: T.textSoft, marginTop: 40 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 44, marginBottom: 10 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: T.text, marginBottom: 6 },
  emptySub: { fontSize: 13, color: T.textSoft, textAlign: 'center' },
  card: { backgroundColor: T.surface, borderRadius: 18, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: T.border },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(201,169,110,0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: T.border },
  avatarText: { fontSize: 16, fontWeight: '700', color: T.accent },
  userInfo: { flex: 1 },
  userName: { fontSize: 13, fontWeight: '700', color: T.text },
  userSkin: { fontSize: 10, color: T.textSoft },
  postImage: { width: '100%', height: 200, borderRadius: 12, marginBottom: 12 },
  caption: { fontSize: 13, color: T.textMid, lineHeight: 20, marginBottom: 10 },
  products: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  productTag: { backgroundColor: 'rgba(201,169,110,0.1)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, borderWidth: 1, borderColor: 'rgba(201,169,110,0.2)' },
  productTagText: { fontSize: 10, color: T.accent, fontWeight: '500' },
  actions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTopWidth: 1, borderTopColor: T.border },
  action: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionIcon: { fontSize: 18, color: T.textSoft },
  liked: { color: T.rose },
  actionText: { fontSize: 12, color: T.textSoft },
  swipeHint: { fontSize: 9, color: T.textSoft, fontStyle: 'italic', opacity: 0.6 },
  deleteAction: { width: 80, marginBottom: 14, justifyContent: 'center', alignItems: 'flex-end' },
  deleteActionBtn: { backgroundColor: T.rose, borderRadius: 18, height: '100%', width: 70, alignItems: 'center', justifyContent: 'center' },
  deleteActionIcon: { fontSize: 22, marginBottom: 4 },
  deleteActionText: { fontSize: 11, color: '#FFFFFF', fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalScroll: { maxHeight: '90%' as any },
  modalContent: { backgroundColor: T.surface, borderRadius: 24, padding: 24, paddingBottom: 40, borderWidth: 1, borderColor: T.border },
  modalTitle: { fontSize: 20, fontWeight: '700', color: T.text, marginBottom: 20 },
  imagePicker: { marginBottom: 16 },
  imagePreview: { width: '100%', height: 180, borderRadius: 14 },
  imagePlaceholder: { width: '100%', height: 120, borderRadius: 14, backgroundColor: T.bg, borderWidth: 1.5, borderColor: T.border, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  imagePlaceholderIcon: { fontSize: 32, marginBottom: 6 },
  imagePlaceholderText: { fontSize: 12, color: T.textSoft },
  fieldLabel: { fontSize: 12, color: T.textSoft, marginBottom: 6, fontWeight: '500' },
  input: { backgroundColor: T.bg, borderRadius: 12, padding: 14, color: T.text, fontSize: 14, borderWidth: 1, borderColor: T.border, marginBottom: 14 },
  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 8 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: T.border, alignItems: 'center' },
  cancelBtnText: { fontSize: 14, color: T.textSoft },
  saveBtn: { flex: 2, padding: 14, borderRadius: 12, backgroundColor: T.accent, alignItems: 'center' },
  saveBtnText: { fontSize: 14, fontWeight: '700', color: '#1A1208' },
});
