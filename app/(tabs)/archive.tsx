import { type Session } from '@supabase/supabase-js';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Chip from '../../components/ui/Chip';
import EmptyState from '../../components/ui/EmptyState';
import PillButton from '../../components/ui/PillButton';
import StatCard from '../../components/ui/StatCard';
import { supabase } from '../../lib/supabase';
import { C, R, Sp, Type } from '../../theme';

const FREE_LIMIT = 30;

type FilterId = 'all' | 'active' | 'finished' | 'stocked';

type Product = {
  id: string;
  brand: string;
  name: string;
  status: 'active' | 'finished' | 'stocked';
  category?: string;
};

export default function ArchiveScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filter, setFilter] = useState<FilterId>('all');
  const [search, setSearch] = useState('');
  const [session, setSession] = useState<Session | null>(null);

  const loadProducts = useCallback(async (uid: string) => {
    const { data, error } = await supabase
      .from('products')
      .select('id, brand, name, status, category')
      .eq('user_id', uid)
      .order('created_at', { ascending: false });
    if (error) {
      setProducts([]);
      return;
    }
    setProducts((data as Product[]) ?? []);
  }, []);

  // Initial session + auth listener
  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      if (data.session) {
        loadProducts(data.session.user.id);
      } else {
        setProducts([]);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => {
      if (!mounted) return;
      setSession(s);
      if (s) {
        loadProducts(s.user.id);
      } else {
        setProducts([]);
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [loadProducts]);

  // Refresh on tab focus (e.g. after returning from add-product)
  useFocusEffect(
    useCallback(() => {
      if (session) {
        loadProducts(session.user.id);
      }
    }, [session, loadProducts])
  );

  const stats = {
    total: products.length,
    active: products.filter((p) => p.status === 'active').length,
    finished: products.filter((p) => p.status === 'finished').length,
    stocked: products.filter((p) => p.status === 'stocked').length,
  };

  const filtered = products.filter((p) => {
    if (filter === 'active' && p.status !== 'active') return false;
    if (filter === 'finished' && p.status !== 'finished') return false;
    if (filter === 'stocked' && p.status !== 'stocked') return false;
    if (search.trim() && !`${p.brand} ${p.name}`.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    return true;
  });

  const isEmpty = products.length === 0;

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <Text style={s.title}>Mon Archive</Text>
          <Text style={s.subtitle}>Organise, suis, utilise au bon moment</Text>
        </View>

        <View style={s.statsRow}>
          <StatCard label="Total" value={stats.total} />
          <View style={s.gap} />
          <StatCard label="Actifs" value={stats.active} />
          <View style={s.gap} />
          <StatCard label="Terminés" value={stats.finished} />
        </View>

        <View style={s.searchBox}>
          <TextInput
            style={s.search}
            placeholder="Rechercher un produit"
            placeholderTextColor={C.textSoft}
            value={search}
            onChangeText={setSearch}
            autoCorrect={false}
          />
        </View>

        <View style={s.filtersRow}>
          <Chip label="Tous" active={filter === 'all'} onPress={() => setFilter('all')} />
          <Chip label="En cours" active={filter === 'active'} onPress={() => setFilter('active')} />
          <Chip label="Terminé" active={filter === 'finished'} onPress={() => setFilter('finished')} />
          <Chip label="En stock" active={filter === 'stocked'} onPress={() => setFilter('stocked')} />
        </View>

        <Text style={s.limit}>{stats.total}/{FREE_LIMIT} produits gratuits</Text>

        {isEmpty ? (
          <EmptyState
            title="Ton archive est vide"
            subtitle="Ajoute tes soins pour suivre leur utilisation."
            action={
              <View style={s.emptyActions}>
                <PillButton
                  label="+ Ajouter un produit"
                  variant="primary"
                  onPress={() => router.push('/add-product' as any)}
                  fullWidth
                />
                <View style={{ height: Sp.sm }} />
                <PillButton
                  label="Identifier avec l'IA"
                  variant="ghost"
                  size="sm"
                  onPress={() => router.push('/(tabs)/scanner' as any)}
                />
              </View>
            }
          />
        ) : (
          <View style={s.list}>
            {filtered.map((p) => (
              <View key={p.id} style={s.productRow}>
                <View style={s.productLeft}>
                  <Text style={s.productBrand}>{p.brand}</Text>
                  <Text style={s.productName} numberOfLines={1}>
                    {p.name}
                  </Text>
                </View>
                <View style={[s.statusDot, p.status === 'active' && s.statusActive, p.status === 'finished' && s.statusFinished]} />
              </View>
            ))}
          </View>
        )}

        <View style={{ height: Sp.huge }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.appBg },
  scroll: { paddingHorizontal: Sp.lg, paddingTop: Sp.sm, paddingBottom: Sp.xl },
  header: { marginBottom: Sp.xl, marginTop: Sp.sm },
  title: { ...Type.h1, marginBottom: 4 },
  subtitle: { ...Type.body, color: C.textMid },
  statsRow: { flexDirection: 'row', marginBottom: Sp.lg },
  gap: { width: Sp.xs },
  searchBox: { marginBottom: Sp.md },
  search: {
    backgroundColor: C.white,
    borderRadius: R.md,
    paddingHorizontal: Sp.md,
    paddingVertical: 12,
    fontSize: 14,
    color: C.text,
    borderWidth: 1,
    borderColor: C.border,
  },
  filtersRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: Sp.sm },
  limit: {
    fontSize: 11,
    color: C.textSoft,
    letterSpacing: 0.6,
    marginBottom: Sp.lg,
    marginTop: Sp.xs,
  },
  emptyActions: { width: '100%', alignItems: 'center' },
  list: { marginTop: Sp.sm },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.white,
    borderRadius: R.md,
    padding: Sp.md,
    marginBottom: Sp.xs,
  },
  productLeft: { flex: 1 },
  productBrand: {
    fontSize: 10,
    fontWeight: '700',
    color: C.copper,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  productName: { fontSize: 14, fontWeight: '500', color: C.text },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.textSoft,
    marginLeft: Sp.sm,
  },
  statusActive: { backgroundColor: C.green },
  statusFinished: { backgroundColor: C.textSoft },
});
