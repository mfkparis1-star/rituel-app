import { useEffect, useState } from 'react';
import { Alert, Clipboard, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from '../../hooks/useTranslation';
import { supabase } from '../../lib/supabase';

const T = {
  bg: '#FDF8F5',
  bg2: '#F5EDE6',
  accent: '#B8856A',
  accent2: '#8C5E46',
  dark: '#1A1310',
  mid: '#6B5245',
  light: '#E8D5C8',
  white: '#FFFFFF',
  green: '#5B9B6B',
};

const CATEGORY_ICONS: Record<string, string> = {
  'Nettoyant': '○', 'Hydratant': '○', 'Sérum': '○', 'SPF': '○',
  'Tonique': '○', 'Masque': '○', 'Maquillage': '○',
  'Parfum': '○', 'Corps': '○', 'Cheveux': '○',
};

const SKIN_LABELS: Record<string, Record<string, string>> = {
  fr: { dry: 'sèche', oily: 'grasse', combination: 'mixte', normal: 'normale', sensitive: 'sensible' },
  en: { dry: 'dry', oily: 'oily', combination: 'combination', normal: 'normal', sensitive: 'sensitive' },
  tr: { dry: 'kuru', oily: 'yağlı', combination: 'karma', normal: 'normal', sensitive: 'hassas' },
};

const PUBLISHER_ID = '2836964';

const PARTNER_BRANDS = [
  { name: 'Diamond Smile', mid: '27135', desc_fr: 'Blanchiment dentaire', desc_en: 'Teeth whitening' },
  { name: 'Blissim', mid: '15574', desc_fr: 'Box beauté', desc_en: 'Beauty box' },
  { name: 'Uma', mid: '85413', desc_fr: 'Compléments naturels', desc_en: 'Natural supplements' },
  { name: 'Perfumeria Comas', mid: '105475', desc_fr: 'Parfums premium', desc_en: 'Premium perfumes' },
  { name: 'Dr Pierre Ricaud', mid: '6977', desc_fr: 'Soins anti-âge', desc_en: 'Anti-ageing care' },
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
  const topCategories = Object.entries(categorySpend).sort((a, b) => b[1] - a[1]).slice(0, 3);

  // GUEST VIEW
  if (!user) return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.guestHero}>
        <Text style={styles.guestLogo}>Rituel</Text>
        <Text style={styles.guestTagline}>votre archive beauté</Text>
        {communityStats.totalUsers > 0 && (
          <View style={styles.socialProof}>
            <Text style={styles.socialProofNum}>{communityStats.totalUsers}</Text>
            <Text style={styles.socialProofTxt}>
              {lang === 'fr' ? 'femmes utilisent déjà Rituel' : lang === 'tr' ? 'kadın Rituel kullanıyor' : 'women already use Rituel'}
            </Text>
          </View>
        )}
        <View style={styles.guestCard}>
          <Text style={styles.guestTitle}>{t.home.guest_title}</Text>
          <Text style={styles.guestSub}>{t.home.guest_sub}</Text>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.logoSmall}>Rituel</Text>
        <View style={styles.headerRight}>
          {skinLabel && (
            <View style={styles.skinBadge}>
              <Text style={styles.skinBadgeText}>
                {lang === 'fr' ? `Peau ${skinLabel}` : lang === 'tr' ? `${skinLabel} cilt` : `${skinLabel} skin`}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* GREETING */}
      <View style={styles.greetingBlock}>
        <Text style={styles.greetingText}>{bonjour},</Text>
        <Text style={styles.nameText}>{firstName}</Text>
      </View>

      {/* STATS ROW */}
      <View style={styles.statsRow}>
        {[
          { label: lang === 'fr' ? 'Actifs' : lang === 'tr' ? 'Aktif' : 'Active', val: stats.active, color: T.green },
          { label: lang === 'fr' ? 'Terminés' : lang === 'tr' ? 'Bitti' : 'Finished', val: stats.finished, color: T.accent },
          { label: lang === 'fr' ? 'En stock' : lang === 'tr' ? 'Stok' : 'Stock', val: stats.stocked, color: '#5BC4F8' },
        ].map(s => (
          <View key={s.label} style={styles.statBox}>
            <Text style={[styles.statVal, { color: s.color }]}>{s.val}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* SKIN ANALYSIS CARD */}
      <View style={styles.skinCard}>
        <Text style={styles.skinCardLabel}>
          {lang === 'fr' ? 'Analyse peau' : lang === 'tr' ? 'Cilt analizi' : 'Skin analysis'}
        </Text>
        <Text style={styles.skinCardTitle}>
          {skinLabel
            ? (lang === 'fr' ? `Peau ${skinLabel}` : lang === 'tr' ? `${skinLabel} cilt` : `${skinLabel} skin`)
            : (lang === 'fr' ? 'Analysez votre peau' : lang === 'tr' ? 'Cildinizi analiz edin' : 'Analyse your skin')}
        </Text>
        {skinLabel && (
          <View style={styles.skinTags}>
            <View style={styles.skinTag}><Text style={styles.skinTagText}>Hydratation</Text></View>
            <View style={styles.skinTag}><Text style={styles.skinTagText}>Anti-brillance</Text></View>
            <View style={styles.skinTag}><Text style={styles.skinTagText}>SPF</Text></View>
          </View>
        )}
        <TouchableOpacity style={styles.analyseBtn}>
          <Text style={styles.analyseBtnText}>
            {lang === 'fr' ? 'Nouvelle analyse' : lang === 'tr' ? 'Yeni analiz' : 'New analysis'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* SPENDING CARD */}
      {products.length > 0 && (
        <View style={styles.spendCard}>
          <Text style={styles.sectionLabel}>
            {lang === 'fr' ? 'Dépenses totales' : lang === 'tr' ? 'Toplam harcama' : 'Total spending'}
          </Text>
          <Text style={styles.spendTotal}>€{stats.total.toFixed(2)}</Text>
          <Text style={styles.spendSub}>
            {products.length} {lang === 'fr' ? 'produits archivés' : lang === 'tr' ? 'ürün arşivlendi' : 'products archived'}
          </Text>
          {topCategories.map(([cat, amount]) => {
            const pct = Math.round((amount / stats.total) * 100);
            return (
              <View key={cat} style={styles.catRow}>
                <View style={styles.catInfo}>
                  <View style={styles.catHeader}>
                    <Text style={styles.catName}>{cat}</Text>
                    <Text style={styles.catAmount}>€{amount.toFixed(2)}</Text>
                  </View>
                  <View style={styles.catBarBg}>
                    <View style={[styles.catBarFill, { width: `${pct}%` as any }]} />
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* RECENT PRODUCTS */}
      {products.length > 0 && (
        <View style={styles.recentSection}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>
              {lang === 'fr' ? 'Récents' : lang === 'tr' ? 'Son ürünler' : 'Recent'}
            </Text>
            <Text style={styles.sectionLink}>
              {lang === 'fr' ? 'Tout voir →' : lang === 'tr' ? 'Tümü →' : 'See all →'}
            </Text>
          </View>
          {products.slice(0, 3).map(p => (
            <View key={p.id} style={styles.productRow}>
              <View style={styles.productThumb}>
                <Text style={styles.productThumbText}>{(p.name || '?')[0].toUpperCase()}</Text>
              </View>
              <View style={styles.productInfo}>
                <Text style={styles.productBrand}>{p.brand}</Text>
                <Text style={styles.productName}>{p.name}</Text>
              </View>
              <Text style={styles.productPrice}>€{p.price}</Text>
            </View>
          ))}
        </View>
      )}

      {/* EMPTY STATE */}
      {products.length === 0 && (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>{t.archive.empty_title}</Text>
          <Text style={styles.emptySub}>{t.archive.empty_sub}</Text>
        </View>
      )}

      {/* PARTNERS */}
      <View style={styles.partnersSection}>
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>
            {lang === 'fr' ? 'Nos Partenaires' : lang === 'tr' ? 'Ortaklarımız' : 'Our Partners'}
          </Text>
          <Text style={styles.sectionLink}>
            {lang === 'fr' ? 'Voir tout →' : lang === 'tr' ? 'Tümü →' : 'See all →'}
          </Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {PARTNER_BRANDS.map(brand => (
            <TouchableOpacity
              key={brand.mid}
              style={styles.partnerCard}
              onPress={() => {
                const url = `https://www.awin1.com/cread.php?awinmid=${brand.mid}&awinaffid=${PUBLISHER_ID}`;
                Linking.openURL(url);
              }}
            >
              <View style={styles.partnerLogo}>
                <Text style={styles.partnerLogoText}>{brand.name.slice(0, 3).toUpperCase()}</Text>
              </View>
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

      {/* INVITE */}
      <View style={styles.inviteBox}>
        <Text style={styles.inviteTitle}>{t.home.invite_title}</Text>
        <Text style={styles.inviteSub}>{t.home.invite_sub}</Text>
        <View style={styles.codeRow}>
          <View style={styles.codeBox}>
            <Text style={styles.codeText}>
              {profile?.referral_code || 'RITUEL-' + (user?.id?.slice(0, 6)?.toUpperCase() || 'XXXXX')}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.copyBtn}
            onPress={() => {
              const code = profile?.referral_code || 'RITUEL-CODE';
              Clipboard.setString(code);
              Alert.alert('', lang === 'fr' ? 'Code copié ! ' + code : 'Code copied! ' + code);
            }}
          >
            <Text style={styles.copyBtnText}>{t.home.invite_copy}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },

  // HEADER
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 22, paddingTop: 60, paddingBottom: 8 },
  logoSmall: { fontSize: 20, fontWeight: '300', color: T.dark, letterSpacing: 3 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  skinBadge: { backgroundColor: 'rgba(184,133,106,0.12)', borderRadius: 100, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(184,133,106,0.2)' },
  skinBadgeText: { fontSize: 10, color: T.accent, letterSpacing: 0.5 },

  // GREETING
  greetingBlock: { paddingHorizontal: 22, paddingBottom: 18 },
  greetingText: { fontSize: 13, color: T.mid, marginBottom: 2 },
  nameText: { fontSize: 26, fontWeight: '300', color: T.dark, letterSpacing: 0.5 },

  // STATS
  statsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 22, marginBottom: 16 },
  statBox: { flex: 1, backgroundColor: T.white, borderRadius: 14, padding: 14, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  statVal: { fontSize: 24, fontWeight: '300', letterSpacing: 0.5, marginBottom: 3 },
  statLabel: { fontSize: 8, color: T.mid, textTransform: 'uppercase', letterSpacing: 0.8 },

  // SKIN CARD
  skinCard: { marginHorizontal: 22, marginBottom: 16, backgroundColor: T.dark, borderRadius: 20, padding: 20 },
  skinCardLabel: { fontSize: 9, color: 'rgba(184,133,106,0.6)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 },
  skinCardTitle: { fontSize: 20, fontWeight: '300', color: T.white, marginBottom: 12, letterSpacing: 0.5 },
  skinTags: { flexDirection: 'row', gap: 6, marginBottom: 14, flexWrap: 'wrap' },
  skinTag: { backgroundColor: 'rgba(184,133,106,0.15)', borderRadius: 100, paddingHorizontal: 10, paddingVertical: 3, borderWidth: 1, borderColor: 'rgba(184,133,106,0.25)' },
  skinTagText: { fontSize: 9, color: T.accent, letterSpacing: 0.5 },
  analyseBtn: { alignSelf: 'flex-start', backgroundColor: T.accent, borderRadius: 100, paddingHorizontal: 16, paddingVertical: 9 },
  analyseBtnText: { fontSize: 11, color: T.white, letterSpacing: 0.5 },

  // SPEND CARD
  spendCard: { marginHorizontal: 22, marginBottom: 16, backgroundColor: T.white, borderRadius: 18, padding: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  sectionLabel: { fontSize: 9, color: T.mid, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 },
  spendTotal: { fontSize: 32, fontWeight: '300', color: T.dark, marginBottom: 3, letterSpacing: 0.5 },
  spendSub: { fontSize: 11, color: T.mid, marginBottom: 16 },
  catRow: { marginBottom: 10 },
  catInfo: { flex: 1 },
  catHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  catName: { fontSize: 11, color: T.dark, fontWeight: '500' },
  catAmount: { fontSize: 11, color: T.accent },
  catBarBg: { height: 3, backgroundColor: T.bg2, borderRadius: 2 },
  catBarFill: { height: 3, backgroundColor: T.accent, borderRadius: 2 },

  // RECENT
  recentSection: { marginHorizontal: 22, marginBottom: 16 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 },
  sectionTitle: { fontSize: 17, fontWeight: '300', color: T.dark, letterSpacing: 0.3 },
  sectionLink: { fontSize: 10, color: T.accent },
  productRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: T.white, borderRadius: 14, padding: 12, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  productThumb: { width: 44, height: 44, borderRadius: 11, backgroundColor: T.bg2, alignItems: 'center', justifyContent: 'center' },
  productThumbText: { fontSize: 16, color: T.accent, fontWeight: '300' },
  productInfo: { flex: 1 },
  productBrand: { fontSize: 8, color: T.mid, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 },
  productName: { fontSize: 12, color: T.dark, fontWeight: '500' },
  productPrice: { fontSize: 12, color: T.accent },

  // EMPTY
  emptyCard: { marginHorizontal: 22, marginBottom: 16, backgroundColor: T.white, borderRadius: 18, padding: 24, alignItems: 'center' },
  emptyTitle: { fontSize: 15, fontWeight: '300', color: T.dark, marginBottom: 6 },
  emptySub: { fontSize: 12, color: T.mid, textAlign: 'center' },

  // PARTNERS
  partnersSection: { marginBottom: 16, paddingLeft: 22 },
  partnerCard: { backgroundColor: T.white, borderRadius: 16, padding: 14, marginRight: 10, width: 150, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  partnerLogo: { width: 44, height: 44, borderRadius: 12, backgroundColor: T.bg2, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  partnerLogoText: { fontSize: 9, color: T.mid, fontWeight: '600', letterSpacing: 0.5 },
  partnerName: { fontSize: 12, fontWeight: '500', color: T.dark, marginBottom: 3 },
  partnerDesc: { fontSize: 10, color: T.mid, marginBottom: 10, lineHeight: 14 },
  partnerBtn: { backgroundColor: T.bg2, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: T.light },
  partnerBtnText: { fontSize: 10, color: T.accent },

  // INVITE
  inviteBox: { marginHorizontal: 22, backgroundColor: T.bg2, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: T.light },
  inviteTitle: { fontSize: 13, fontWeight: '500', color: T.dark, marginBottom: 5 },
  inviteSub: { fontSize: 11, color: T.mid, marginBottom: 12, lineHeight: 17 },
  codeRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  codeBox: { flex: 1, backgroundColor: T.white, borderRadius: 10, padding: 10, borderWidth: 1, borderColor: T.light },
  codeText: { fontSize: 11, color: T.accent, fontWeight: '600', letterSpacing: 2 },
  copyBtn: { backgroundColor: T.accent, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
  copyBtnText: { fontSize: 11, fontWeight: '600', color: T.white },

  // GUEST
  guestHero: { paddingTop: 80, alignItems: 'center', padding: 22 },
  guestLogo: { fontSize: 40, fontWeight: '300', color: T.dark, letterSpacing: 4, marginBottom: 6 },
  guestTagline: { fontSize: 13, fontStyle: 'italic', color: T.mid, letterSpacing: 2, marginBottom: 28 },
  socialProof: { backgroundColor: T.white, borderRadius: 16, padding: 18, marginBottom: 20, alignItems: 'center', width: '100%', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  socialProofNum: { fontSize: 36, fontWeight: '300', color: T.accent, marginBottom: 4 },
  socialProofTxt: { fontSize: 12, color: T.mid },
  guestCard: { backgroundColor: T.white, borderRadius: 20, padding: 22, width: '100%' },
  guestTitle: { fontSize: 17, fontWeight: '300', color: T.dark, marginBottom: 8 },
  guestSub: { fontSize: 13, color: T.mid, lineHeight: 20 },
});