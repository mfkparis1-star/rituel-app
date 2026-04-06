import { useEffect, useState } from 'react';
import { Alert, Clipboard, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from '../../hooks/useTranslation';
import { supabase } from '../../lib/supabase';

const T = {
  bg: '#08080E', surface: '#11111A', border: '#1C1C2E',
  accent: '#C9A96E', rose: '#E87FAC', text: '#F5F0F8',
  textMid: '#B8B0C4', textSoft: '#6B6278',
};

const CATEGORY_ICONS: Record<string, string> = {
  'Nettoyant':'🫧','Hydratant':'🧴','Sérum':'💧','SPF':'☀️',
  'Tonique':'💦','Masque':'🌿','Maquillage':'💄',
  'Parfum':'🌸','Corps':'🪷','Cheveux':'✨',
};

const SKIN_LABELS: Record<string, Record<string, string>> = {
  fr: { dry: 'sèche', oily: 'grasse', combination: 'mixte', normal: 'normale', sensitive: 'sensible' },
  en: { dry: 'dry', oily: 'oily', combination: 'combination', normal: 'normal', sensitive: 'sensitive' },
};

const PUBLISHER_ID = '2836964';

const PARTNER_BRANDS = [
  { name: 'Diamond Smile', emoji: '💎', mid: '27135', desc_fr: 'Blanchiment dentaire professionnel', desc_en: 'Professional teeth whitening' },
  { name: 'Blissim', emoji: '🎁', mid: '15574', desc_fr: 'Box beauté personnalisée', desc_en: 'Personalized beauty box' },
  { name: 'Laboratoires Uma', emoji: '🌿', mid: '85413', desc_fr: 'Compléments naturels pour femmes', desc_en: 'Natural supplements for women' },
  { name: 'Perfumeria Comas', emoji: '🌸', mid: '105475', desc_fr: 'Parfums & cosmétiques premium', desc_en: 'Premium perfumes & cosmetics' },
  { name: 'Dr Pierre Ricaud', emoji: '✨', mid: '6977', desc_fr: 'Soins anti-âge experts', desc_en: 'Expert anti-ageing skincare' },
];

export default function HomeScreen() {
  const { t, lang } = useTranslation();
  const [user, setUser] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({ active: 0, finished: 0, stocked: 0, total: 0 });
  const [communityStats, setCommunityStats] = useState({ totalUsers: 0, topProduct: '' });

  const heure = new Date().getHours();
  const bonjour = heure < 12 ? t.home.greeting_morning : heure < 17 ? t.home.greeting_afternoon : t.home.greeting_evening;

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user;
      setUser(u || null);
      if (u) { loadProducts(u.id); loadProfile(u.id); }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user;
      setUser(u || null);
      if (u) { loadProducts(u.id); loadProfile(u.id); }
    });
    loadCommunityStats();
    return () => listener.subscription.unsubscribe();
  }, []);

  const loadProducts = async (userId: string) => {
    const { data, error } = await supabase.from('products').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (error) { console.warn('loadProducts error:', error.message); return; }
    if (data) {
      setProducts(data);
      setStats({
        active: data.filter(p => p.status === 'active').length,
        finished: data.filter(p => p.status === 'finished').length,
        stocked: data.filter(p => p.status === 'stocked').length,
        total: data.reduce((s: number, p: any) => s + (p.price || 0), 0),
      });
    }
  };

  const loadProfile = async (userId: string) => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (error && error.code !== 'PGRST116') { console.warn('loadProfile error:', error.message); return; }
    if (data) setProfile(data);
  };

  const loadCommunityStats = async () => {
    const { count: totalUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    const { data: topProductData } = await supabase.from('products').select('name').limit(100);
    let topProduct = 'Hyalu B5 Sérum';
    if (topProductData && topProductData.length > 0) {
      const freq: Record<string, number> = {};
      topProductData.forEach((p: any) => { freq[p.name] = (freq[p.name] || 0) + 1; });
      topProduct = Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0] || topProduct;
    }
    setCommunityStats({ totalUsers: totalUsers || 0, topProduct });
  };

  const firstName = profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Sophie';
  const skinLabel = profile?.skin_type ? SKIN_LABELS[lang]?.[profile.skin_type] || profile.skin_type : null;

  const categorySpend = products.reduce((acc: Record<string, number>, p: any) => {
    acc[p.category] = (acc[p.category] || 0) + (p.price || 0);
    return acc;
  }, {});
  const topCategories = Object.entries(categorySpend).sort((a, b) => b[1] - a[1]).slice(0, 4);

  if (!user) return (
    <ScrollView style={styles.container}>
      <View style={styles.heroGuest}>
        <Text style={styles.logoText}>✦ rituel</Text>
        <Text style={styles.logoSub}>Votre archive beauté personnelle</Text>
        <View style={styles.socialProofBanner}>
          <Text style={styles.socialProofNumber}>{communityStats.totalUsers > 0 ? communityStats.totalUsers : '—'}</Text>
          <Text style={styles.socialProofText}>{lang === 'fr' ? 'femmes utilisent déjà Rituel' : 'women already use Rituel'}</Text>
        </View>
        <View style={styles.guestCard}>
          <Text style={styles.guestTitle}>{t.home.guest_title}</Text>
          <Text style={styles.guestSub}>{t.home.guest_sub}</Text>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{bonjour},</Text>
          <Text style={styles.name}>{firstName} ✨</Text>
        </View>
        {skinLabel && (
          <View style={styles.skinBadge}>
            <Text style={styles.skinBadgeText}>{lang === 'fr' ? `Peau ${skinLabel}` : `${skinLabel} skin`}</Text>
          </View>
        )}
      </View>

      {skinLabel && (
        <View style={styles.socialCard}>
          <Text style={styles.socialIcon}>👥</Text>
          <View style={styles.socialInfo}>
            <Text style={styles.socialTitle}>{t.home.social_title}</Text>
            <Text style={styles.socialText}>
              {communityStats.totalUsers > 1
                ? lang === 'fr'
                  ? `${communityStats.totalUsers} femmes utilisent Rituel pour prendre soin de leur peau ${skinLabel}.`
                  : `${communityStats.totalUsers} women use Rituel to care for their ${skinLabel} skin.`
                : lang === 'fr'
                  ? `Rejoignez des femmes à peau ${skinLabel} sur Rituel.`
                  : `Join women with ${skinLabel} skin on Rituel.`
              }
            </Text>
          </View>
        </View>
      )}

      <View style={styles.statsRow}>
        {[
          { label: lang === 'fr' ? 'Actifs' : 'Active', val: stats.active.toString(), color: '#52DBA8' },
          { label: lang === 'fr' ? 'Terminés' : 'Finished', val: stats.finished.toString(), color: '#FF5272' },
          { label: lang === 'fr' ? 'En stock' : 'In stock', val: stats.stocked.toString(), color: '#5BC4F8' },
        ].map(s => (
          <View key={s.label} style={styles.statBox}>
            <Text style={styles.statLabel}>{s.label}</Text>
            <Text style={[styles.statVal, { color: s.color }]}>{s.val}</Text>
          </View>
        ))}
      </View>

      <View style={styles.spendCard}>
        <Text style={styles.cardLabel}>{t.home.total_spend}</Text>
        <Text style={styles.spendTotal}>€{stats.total.toFixed(2)}</Text>
        <Text style={styles.spendSub}>{products.length} {t.home.products_archived}</Text>
        {topCategories.length > 0 && (
          <View style={styles.categoryList}>
            {topCategories.map(([cat, amount]) => {
              const pct = Math.round((amount / stats.total) * 100);
              return (
                <View key={cat} style={styles.categoryRow}>
                  <Text style={styles.categoryIcon}>{CATEGORY_ICONS[cat] || '✨'}</Text>
                  <View style={styles.categoryInfo}>
                    <View style={styles.categoryHeader}>
                      <Text style={styles.categoryName}>{cat}</Text>
                      <Text style={styles.categoryAmount}>€{amount.toFixed(2)}</Text>
                    </View>
                    <View style={styles.categoryBarBg}>
                      <View style={[styles.categoryBarFill, { width: `${pct}%` as any }]} />
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {products.length > 0 && (
        <View style={styles.recentCard}>
          <Text style={styles.cardLabel}>{t.home.recent_products}</Text>
          {products.slice(0, 4).map(p => (
            <View key={p.id} style={styles.productRow}>
              <Text style={styles.productIcon}>{p.icon || '✨'}</Text>
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{p.name}</Text>
                <Text style={styles.productBrand}>{p.brand}</Text>
              </View>
              <Text style={styles.productPrice}>€{p.price}</Text>
            </View>
          ))}
        </View>
      )}

      {products.length === 0 && (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>🗂</Text>
          <Text style={styles.emptyTitle}>{t.archive.empty_title}</Text>
          <Text style={styles.emptySub}>{t.archive.empty_sub}</Text>
        </View>
      )}

      {communityStats.topProduct && (
        <View style={styles.trendCard}>
          <Text style={styles.trendLabel}>{t.home.trend_label}</Text>
          <Text style={styles.trendProduct}>{communityStats.topProduct}</Text>
          <Text style={styles.trendSub}>{t.home.trend_sub}</Text>
        </View>
      )}

      {/* PARTNER BRANDS */}
      <View style={styles.partnersSection}>
        <Text style={styles.partnersLabel}>
          {lang === 'fr' ? '🛍️ NOS PARTENAIRES' : lang === 'tr' ? '🛍️ ORTAKLARIMIZ' : '🛍️ OUR PARTNERS'}
        </Text>
        <Text style={styles.partnersSub}>
          {lang === 'fr' ? 'Sélectionnés pour vous' : lang === 'tr' ? 'Sizin için seçildi' : 'Selected for you'}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.partnersScroll}>
          {PARTNER_BRANDS.map(brand => (
            <TouchableOpacity
              key={brand.mid}
              style={styles.partnerCard}
              onPress={() => {
                const url = `https://www.awin1.com/cread.php?awinmid=${brand.mid}&awinaffid=${PUBLISHER_ID}`;
                Linking.openURL(url);
              }}
            >
              <Text style={styles.partnerEmoji}>{brand.emoji}</Text>
              <Text style={styles.partnerName}>{brand.name}</Text>
              <Text style={styles.partnerDesc}>
                {lang === 'fr' ? brand.desc_fr : brand.desc_en}
              </Text>
              <View style={styles.partnerBtn}>
                <Text style={styles.partnerBtnText}>
                  {lang === 'fr' ? 'Découvrir →' : lang === 'tr' ? 'Keşfet →' : 'Discover →'}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.inviteBox}>
        <Text style={styles.inviteTitle}>{t.home.invite_title}</Text>
        <Text style={styles.inviteSub}>{t.home.invite_sub}</Text>
        <View style={styles.codeRow}>
          <View style={styles.codeBox}>
            <Text style={styles.code}>{profile?.referral_code || 'RITUEL-' + (user?.id?.slice(0,6)?.toUpperCase() || 'XXXXX')}</Text>
          </View>
          <TouchableOpacity style={styles.copyBtn} onPress={() => {
            const code = profile?.referral_code || 'RITUEL-CODE';
            Clipboard.setString(code);
            Alert.alert('', lang === 'fr' ? 'Code copié ! ' + code : 'Code copied! ' + code);
          }}>
            <Text style={styles.copyBtnText}>{t.home.invite_copy}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg, padding: 20 },
  header: { paddingTop: 60, paddingBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greeting: { fontSize: 13, color: T.textSoft, marginBottom: 4 },
  name: { fontSize: 28, fontWeight: '700', color: T.text },
  skinBadge: { backgroundColor: 'rgba(201,169,110,0.12)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(201,169,110,0.2)' },
  skinBadgeText: { fontSize: 11, color: T.accent, fontWeight: '600' },
  socialCard: { backgroundColor: 'rgba(232,127,172,0.08)', borderRadius: 16, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(232,127,172,0.2)', flexDirection: 'row', alignItems: 'center', gap: 12 },
  socialIcon: { fontSize: 28 },
  socialInfo: { flex: 1 },
  socialTitle: { fontSize: 13, fontWeight: '700', color: T.text, marginBottom: 4 },
  socialText: { fontSize: 12, color: T.textSoft, lineHeight: 18 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statBox: { flex: 1, backgroundColor: T.surface, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: T.border, alignItems: 'center' },
  statLabel: { fontSize: 9, color: T.textSoft, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  statVal: { fontSize: 22, fontWeight: '700' },
  spendCard: { backgroundColor: T.surface, borderRadius: 18, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: T.border },
  cardLabel: { fontSize: 10, color: T.textSoft, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 },
  spendTotal: { fontSize: 36, fontWeight: '700', color: T.accent, marginBottom: 4 },
  spendSub: { fontSize: 12, color: T.textSoft, marginBottom: 16 },
  categoryList: { gap: 12 },
  categoryRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  categoryIcon: { fontSize: 20, width: 28 },
  categoryInfo: { flex: 1 },
  categoryHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  categoryName: { fontSize: 12, color: T.textMid, fontWeight: '500' },
  categoryAmount: { fontSize: 12, color: T.accent, fontWeight: '600' },
  categoryBarBg: { height: 4, backgroundColor: '#1E1A22', borderRadius: 2, overflow: 'hidden' },
  categoryBarFill: { height: '100%' as any, backgroundColor: T.accent, borderRadius: 2 },
  recentCard: { backgroundColor: T.surface, borderRadius: 18, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: T.border },
  productRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: T.border },
  productIcon: { fontSize: 22, width: 36, textAlign: 'center' },
  productInfo: { flex: 1 },
  productName: { fontSize: 13, fontWeight: '600', color: T.text },
  productBrand: { fontSize: 11, color: T.textSoft },
  productPrice: { fontSize: 13, fontWeight: '700', color: T.accent },
  emptyCard: { backgroundColor: T.surface, borderRadius: 18, padding: 24, marginBottom: 16, borderWidth: 1, borderColor: T.border, alignItems: 'center' },
  emptyIcon: { fontSize: 36, marginBottom: 10 },
  emptyTitle: { fontSize: 15, fontWeight: '600', color: T.text, marginBottom: 6 },
  emptySub: { fontSize: 12, color: T.textSoft, textAlign: 'center' },
  trendCard: { backgroundColor: 'rgba(201,169,110,0.06)', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(201,169,110,0.2)' },
  trendLabel: { fontSize: 10, color: T.accent, fontWeight: '700', letterSpacing: 1, marginBottom: 6 },
  trendProduct: { fontSize: 18, fontWeight: '700', color: T.text, marginBottom: 4 },
  trendSub: { fontSize: 11, color: T.textSoft },
  partnersSection: { marginBottom: 16 },
  partnersLabel: { fontSize: 10, color: T.accent, fontWeight: '700', letterSpacing: 2, marginBottom: 4 },
  partnersSub: { fontSize: 12, color: T.textSoft, marginBottom: 12 },
  partnersScroll: { marginHorizontal: -4 },
  partnerCard: { backgroundColor: T.surface, borderRadius: 16, padding: 16, marginHorizontal: 6, borderWidth: 1, borderColor: T.border, width: 160, alignItems: 'center' },
  partnerEmoji: { fontSize: 32, marginBottom: 8 },
  partnerName: { fontSize: 13, fontWeight: '700', color: T.text, marginBottom: 4, textAlign: 'center' },
  partnerDesc: { fontSize: 11, color: T.textSoft, textAlign: 'center', marginBottom: 12, lineHeight: 16 },
  partnerBtn: { backgroundColor: 'rgba(201,169,110,0.15)', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(201,169,110,0.3)' },
  partnerBtnText: { fontSize: 11, color: T.accent, fontWeight: '700' },
  inviteBox: { backgroundColor: 'rgba(232,127,172,0.08)', borderRadius: 18, padding: 18, marginBottom: 40, borderWidth: 1, borderColor: 'rgba(232,127,172,0.2)' },
  inviteTitle: { fontSize: 13, fontWeight: '700', color: T.text, marginBottom: 6 },
  inviteSub: { fontSize: 12, color: T.textSoft, marginBottom: 12, lineHeight: 18 },
  codeRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  codeBox: { flex: 1, backgroundColor: T.surface, borderRadius: 10, padding: 10, borderWidth: 1, borderColor: T.border },
  code: { fontSize: 12, color: T.accent, fontWeight: '700', letterSpacing: 2 },
  copyBtn: { backgroundColor: T.rose, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10 },
  copyBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  heroGuest: { paddingTop: 80, alignItems: 'center' },
  logoText: { fontSize: 40, fontWeight: '700', color: T.accent, marginBottom: 8 },
  logoSub: { fontSize: 14, color: T.textSoft, marginBottom: 24 },
  socialProofBanner: { backgroundColor: T.surface, borderRadius: 16, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: T.border, alignItems: 'center', width: '100%' },
  socialProofNumber: { fontSize: 40, fontWeight: '700', color: T.accent, marginBottom: 4 },
  socialProofText: { fontSize: 13, color: T.textSoft },
  guestCard: { backgroundColor: T.surface, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: T.border, width: '100%' },
  guestTitle: { fontSize: 18, fontWeight: '700', color: T.text, marginBottom: 10 },
  guestSub: { fontSize: 14, color: T.textSoft, lineHeight: 22 },
});