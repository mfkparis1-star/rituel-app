import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from '../../hooks/useTranslation';
import { supabase } from '../../lib/supabase';

const T = {
  bg: '#08080E', surface: '#11111A', border: '#1C1C2E',
  accent: '#C9A96E', rose: '#E87FAC', text: '#F5F0F8',
  textMid: '#B8B0C4', textSoft: '#6B6278',
};

const CATEGORY_COLORS: Record<string, string> = {
  'Ingrédients': '#C9A96E', 'Ingredients': '#C9A96E',
  'Conseils': '#E87FAC', 'Tips': '#E87FAC',
  'Techniques': '#5BC4F8',
};

type Article = {
  id: string; title: string; subtitle: string; content: string;
  title_en?: string; subtitle_en?: string; content_en?: string;
  category: string; author: string; is_featured: boolean; created_at: string;
};

export default function DiscoverScreen() {
  const { t, lang } = useTranslation();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Article | null>(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => { loadArticles(); }, []);

  const loadArticles = async () => {
    const { data } = await supabase.from('articles').select('*').order('created_at', { ascending: false });
    if (data) setArticles(data);
    setLoading(false);
  };

  const getTitle = (a: Article) => lang === 'en' && a.title_en ? a.title_en : a.title;
  const getSubtitle = (a: Article) => lang === 'en' && a.subtitle_en ? a.subtitle_en : a.subtitle;
  const getContent = (a: Article) => lang === 'en' && a.content_en ? a.content_en : a.content;

  const FILTERS = [
    { id: 'all', label: lang === 'fr' ? 'Tous' : 'All' },
    { id: 'ingredients', label: lang === 'fr' ? 'Ingrédients' : 'Ingredients' },
    { id: 'tips', label: lang === 'fr' ? 'Conseils' : 'Tips' },
    { id: 'techniques', label: 'Techniques' },
  ];

  const filteredArticles = filter === 'all' ? articles : articles.filter(a => {
    if (filter === 'ingredients') return a.category === 'Ingrédients';
    if (filter === 'tips') return a.category === 'Conseils';
    if (filter === 'techniques') return a.category === 'Techniques';
    return true;
  });

  const featured = articles.filter(a => a.is_featured);

  if (selected) return (
    <ScrollView style={styles.container}>
      <TouchableOpacity onPress={() => setSelected(null)} style={styles.backBtn}>
        <Text style={styles.backBtnText}>{lang === 'fr' ? '← Retour' : '← Back'}</Text>
      </TouchableOpacity>
      <View style={[styles.categoryBadge, { backgroundColor: (CATEGORY_COLORS[selected.category] || T.accent) + '20', borderColor: CATEGORY_COLORS[selected.category] || T.accent }]}>
        <Text style={[styles.categoryBadgeText, { color: CATEGORY_COLORS[selected.category] || T.accent }]}>{selected.category}</Text>
      </View>
      <Text style={styles.articleTitle}>{getTitle(selected)}</Text>
      <Text style={styles.articleSubtitle}>{getSubtitle(selected)}</Text>
      <View style={styles.authorRow}>
        <View style={styles.authorAvatar}>
          <Text style={styles.authorAvatarText}>{selected.author.charAt(0)}</Text>
        </View>
        <View>
          <Text style={styles.authorName}>{selected.author}</Text>
          <Text style={styles.articleDate}>
            {new Date(selected.created_at).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
          </Text>
        </View>
      </View>
      <View style={styles.divider} />
      <Text style={styles.articleContent}>{getContent(selected)}</Text>
      <View style={styles.articleFooter}>
        <Text style={styles.articleFooterText}>✦ rituel</Text>
      </View>
    </ScrollView>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t.discover.title}</Text>
        <Text style={styles.sub}>{t.discover.sub}</Text>
      </View>

      {featured.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t.discover.featured}</Text>
          {featured.slice(0, 2).map(a => (
            <TouchableOpacity key={a.id} onPress={() => setSelected(a)} style={styles.featuredCard}>
              <View style={[styles.featuredAccent, { backgroundColor: CATEGORY_COLORS[a.category] || T.accent }]} />
              <View style={styles.featuredContent}>
                <View style={[styles.catTag, { backgroundColor: (CATEGORY_COLORS[a.category] || T.accent) + '20' }]}>
                  <Text style={[styles.catTagText, { color: CATEGORY_COLORS[a.category] || T.accent }]}>{a.category}</Text>
                </View>
                <Text style={styles.featuredTitle}>{getTitle(a)}</Text>
                <Text style={styles.featuredSubtitle} numberOfLines={2}>{getSubtitle(a)}</Text>
                <Text style={styles.featuredAuthor}>{a.author}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters}>
        {FILTERS.map(f => (
          <TouchableOpacity key={f.id} onPress={() => setFilter(f.id)} style={[styles.chip, filter===f.id && styles.chipActive]}>
            <Text style={[styles.chipText, filter===f.id && styles.chipTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{t.discover.all_articles}</Text>
        {loading ? (
          <ActivityIndicator color={T.accent} style={{ marginTop: 20 }} />
        ) : filteredArticles.length === 0 ? (
          <Text style={styles.empty}>{lang === 'fr' ? 'Aucun article' : 'No articles'}</Text>
        ) : (
          filteredArticles.map(a => (
            <TouchableOpacity key={a.id} onPress={() => setSelected(a)} style={styles.articleCard}>
              <View style={styles.articleCardLeft}>
                <View style={[styles.catDot, { backgroundColor: CATEGORY_COLORS[a.category] || T.accent }]} />
              </View>
              <View style={styles.articleCardContent}>
                <Text style={styles.articleCardCategory}>{a.category}</Text>
                <Text style={styles.articleCardTitle}>{getTitle(a)}</Text>
                <Text style={styles.articleCardSubtitle} numberOfLines={2}>{getSubtitle(a)}</Text>
                <Text style={styles.articleCardAuthor}>{a.author} · {new Date(a.created_at).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'short' })}</Text>
              </View>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
          ))
        )}
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg, padding: 20 },
  header: { paddingTop: 60, paddingBottom: 20 },
  title: { fontSize: 26, fontWeight: '700', color: T.text, marginBottom: 4 },
  sub: { fontSize: 12, color: T.textSoft },
  section: { marginBottom: 24 },
  sectionLabel: { fontSize: 10, color: T.textSoft, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 },
  featuredCard: { backgroundColor: T.surface, borderRadius: 18, marginBottom: 12, borderWidth: 1, borderColor: T.border, flexDirection: 'row', overflow: 'hidden' },
  featuredAccent: { width: 4 },
  featuredContent: { flex: 1, padding: 16 },
  catTag: { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, marginBottom: 8 },
  catTagText: { fontSize: 10, fontWeight: '700' },
  featuredTitle: { fontSize: 16, fontWeight: '700', color: T.text, marginBottom: 6, lineHeight: 22 },
  featuredSubtitle: { fontSize: 12, color: T.textSoft, lineHeight: 18, marginBottom: 10 },
  featuredAuthor: { fontSize: 11, color: T.textSoft, fontStyle: 'italic' },
  filters: { marginBottom: 20 },
  chip: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, backgroundColor: T.surface, marginRight: 8, borderWidth: 1, borderColor: T.border },
  chipActive: { backgroundColor: T.accent, borderColor: T.accent },
  chipText: { fontSize: 12, color: T.textSoft, fontWeight: '500' },
  chipTextActive: { color: '#1A1208', fontWeight: '700' },
  articleCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: T.surface, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: T.border, gap: 12 },
  articleCardLeft: { alignItems: 'center', paddingTop: 4 },
  catDot: { width: 8, height: 8, borderRadius: 4 },
  articleCardContent: { flex: 1 },
  articleCardCategory: { fontSize: 9, color: T.textSoft, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  articleCardTitle: { fontSize: 13, fontWeight: '700', color: T.text, marginBottom: 3 },
  articleCardSubtitle: { fontSize: 11, color: T.textSoft, lineHeight: 16, marginBottom: 6 },
  articleCardAuthor: { fontSize: 10, color: T.textSoft, fontStyle: 'italic' },
  arrow: { fontSize: 20, color: T.textSoft },
  empty: { textAlign: 'center', color: T.textSoft, marginTop: 20 },
  backBtn: { paddingTop: 60, paddingBottom: 20 },
  backBtnText: { fontSize: 14, color: T.accent, fontWeight: '600' },
  categoryBadge: { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, marginBottom: 16 },
  categoryBadgeText: { fontSize: 11, fontWeight: '700' },
  articleTitle: { fontSize: 24, fontWeight: '700', color: T.text, marginBottom: 8, lineHeight: 32 },
  articleSubtitle: { fontSize: 14, color: T.textMid, lineHeight: 22, marginBottom: 20 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  authorAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(201,169,110,0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: T.border },
  authorAvatarText: { fontSize: 18, fontWeight: '700', color: T.accent },
  authorName: { fontSize: 13, fontWeight: '600', color: T.text },
  articleDate: { fontSize: 11, color: T.textSoft },
  divider: { height: 1, backgroundColor: T.border, marginBottom: 20 },
  articleContent: { fontSize: 14, color: T.textMid, lineHeight: 26 },
  articleFooter: { marginTop: 40, marginBottom: 40, alignItems: 'center' },
  articleFooterText: { fontSize: 12, color: T.textSoft, fontStyle: 'italic' },
});