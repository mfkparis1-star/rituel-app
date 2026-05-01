import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Chip from '../../components/ui/Chip';
import EmptyState from '../../components/ui/EmptyState';
import PillButton from '../../components/ui/PillButton';
import { C, R, Sh, Sp, Type } from '../../theme';

type SkinFilter = 'all' | 'dry' | 'oily' | 'combination' | 'normal';

type ProductRef = {
  id: string;
  brand: string;
  name: string;
};

type Post = {
  id: string;
  username: string;
  meta?: string;
  skinType: SkinFilter;
  skinLabel: string;
  content: string;
  products: ProductRef[];
};

const POSTS: Post[] = [];

const SKIN_LABEL: Record<Exclude<SkinFilter, 'all'>, string> = {
  dry: 'Peau sèche',
  oily: 'Peau grasse',
  combination: 'Peau mixte',
  normal: 'Peau normale',
};

export default function CommunityScreen() {
  const [filter, setFilter] = useState<SkinFilter>('all');

  const filtered = POSTS.filter((p) => filter === 'all' || p.skinType === filter);
  const isEmpty = filtered.length === 0;

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <Text style={s.title}>Communauté</Text>
          <Text style={s.subtitle}>Découvrez les routines des femmes comme vous</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.filtersScroll}
        >
          <Chip label="Tous" active={filter === 'all'} onPress={() => setFilter('all')} />
          <Chip label="Sèche" active={filter === 'dry'} onPress={() => setFilter('dry')} />
          <Chip label="Grasse" active={filter === 'oily'} onPress={() => setFilter('oily')} />
          <Chip label="Mixte" active={filter === 'combination'} onPress={() => setFilter('combination')} />
          <Chip label="Normale" active={filter === 'normal'} onPress={() => setFilter('normal')} />
        </ScrollView>

        {isEmpty ? (
          <EmptyState
            title="Pas encore de routines"
            subtitle="Sois la première à partager ton rituel avec la communauté."
          />
        ) : (
          <View style={s.list}>
            {filtered.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </View>
        )}

        <View style={{ height: Sp.huge }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function PostCard({ post }: { post: Post }) {
  return (
    <View style={[s.postCard, Sh.soft]}>
      <View style={s.postHeader}>
        <View style={s.avatar}>
          <Text style={s.avatarLetter}>
            {(post.username[0] || '').toUpperCase()}
          </Text>
        </View>
        <View style={s.postUserBox}>
          <Text style={s.postUsername}>{post.username}</Text>
          {post.meta && <Text style={s.postMeta}>{post.meta}</Text>}
        </View>
        <View style={s.skinBadge}>
          <Text style={s.skinBadgeTxt}>{post.skinLabel}</Text>
        </View>
      </View>

      <Text style={s.postContent} numberOfLines={3}>
        {post.content}
      </Text>

      {post.products.length > 0 && (
        <>
          <Text style={s.productsLabel}>PRODUITS UTILISÉS</Text>
          <View style={s.productsBox}>
            {post.products.map((p) => (
              <View key={p.id} style={s.productCard}>
                <View style={s.productImg} />
                <View style={s.productMeta}>
                  <Text style={s.productBrand}>{p.brand}</Text>
                  <Text style={s.productName} numberOfLines={2}>
                    {p.name}
                  </Text>
                </View>
                <Text style={s.productCta}>Voir le produit ›</Text>
              </View>
            ))}
          </View>
        </>
      )}

      <View style={s.actionsRow}>
        <PillButton label="Essayer" variant="outline" size="sm" />
        <View style={{ width: Sp.xs }} />
        <PillButton label="Acheter" variant="primary" size="sm" />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.appBg },
  scroll: { paddingHorizontal: Sp.lg, paddingTop: Sp.sm, paddingBottom: Sp.xl },
  header: { marginBottom: Sp.lg, marginTop: Sp.sm },
  title: { ...Type.h1, marginBottom: 4 },
  subtitle: { ...Type.body, color: C.textMid },
  filtersScroll: {
    paddingRight: Sp.lg,
    marginBottom: Sp.lg,
  },
  list: { marginTop: Sp.sm },
  postCard: {
    backgroundColor: C.white,
    borderRadius: R.lg,
    padding: Sp.lg,
    marginBottom: Sp.md,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Sp.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.cream,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Sp.sm,
  },
  avatarLetter: {
    fontSize: 16,
    fontWeight: '600',
    color: C.espresso,
  },
  postUserBox: { flex: 1 },
  postUsername: {
    fontSize: 14,
    fontWeight: '600',
    color: C.text,
  },
  postMeta: {
    fontSize: 11,
    color: C.textSoft,
    marginTop: 2,
  },
  skinBadge: {
    backgroundColor: C.cream,
    paddingHorizontal: Sp.sm,
    paddingVertical: 4,
    borderRadius: R.full,
  },
  skinBadgeTxt: {
    fontSize: 10,
    fontWeight: '600',
    color: C.espresso,
    letterSpacing: 0.4,
  },
  postContent: {
    fontSize: 14,
    color: C.textMid,
    lineHeight: 21,
    marginBottom: Sp.md,
  },
  productsLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: C.copper,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: Sp.sm,
  },
  productsBox: {
    marginBottom: Sp.md,
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.cream,
    borderRadius: R.md,
    padding: Sp.sm,
    marginBottom: Sp.xs,
  },
  productImg: {
    width: 48,
    height: 48,
    borderRadius: R.sm,
    backgroundColor: C.white,
    marginRight: Sp.sm,
  },
  productMeta: { flex: 1 },
  productBrand: {
    fontSize: 9,
    fontWeight: '700',
    color: C.copper,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  productName: {
    fontSize: 13,
    fontWeight: '500',
    color: C.text,
    lineHeight: 17,
  },
  productCta: {
    fontSize: 11,
    fontWeight: '600',
    color: C.copper,
    marginLeft: Sp.xs,
  },
  actionsRow: {
    flexDirection: 'row',
    marginTop: Sp.xs,
  },
});
