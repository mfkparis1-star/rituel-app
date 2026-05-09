/**
 * Product detail + edit (Phase 16C M6).
 *
 * Mirrors the add-product form but pre-fills from supabase and updates
 * via supabase.from('products').update(). Same UX rules:
 *   - no blocking success Alert; safeBack to archive on save
 *   - submit disabled when form is dirty=false or invalid
 *   - graceful loading + not-found states
 */
import { type Session } from '@supabase/supabase-js';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PillButton from '../../components/ui/PillButton';
import { supabase } from '../../lib/supabase';
import { safeBack } from '../../utils/safeBack';
import { C, R, Sp, Type } from '../../theme';

type ProductStatus = 'active' | 'finished' | 'stocked';

type Product = {
  id: string;
  user_id: string;
  brand: string;
  name: string;
  category: string;
  status: ProductStatus;
  created_at?: string;
};

const CATEGORIES = [
  'Nettoyant',
  'Hydratant',
  'Sérum',
  'SPF',
  'Tonique',
  'Contour des yeux',
  'Masque',
  'Exfoliant',
  'Maquillage',
  'Autre',
];

const STATUSES: { id: ProductStatus; label: string }[] = [
  { id: 'active',   label: 'En cours' },
  { id: 'stocked',  label: 'En stock' },
  { id: 'finished', label: 'Terminé' },
];

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [session, setSession] = useState<Session | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [original, setOriginal] = useState<Product | null>(null);
  const [brand, setBrand] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>('Hydratant');
  const [status, setStatus] = useState<ProductStatus>('active');

  const [submitting, setSubmitting] = useState(false);

  // Auth bootstrap
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(data.session);
      setAuthChecked(true);
    })();
    return () => { mounted = false; };
  }, []);

  // Fetch product
  useEffect(() => {
    if (!authChecked || !session || !id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .eq('user_id', session.user.id)
        .maybeSingle();
      if (cancelled) return;
      if (error || !data) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      const p = data as Product;
      setOriginal(p);
      setBrand(p.brand ?? '');
      setName(p.name ?? '');
      setCategory(p.category ?? 'Hydratant');
      setStatus((p.status as ProductStatus) ?? 'active');
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [authChecked, session, id]);

  const dirty = useMemo(() => {
    if (!original) return false;
    return (
      brand.trim() !== (original.brand ?? '').trim() ||
      name.trim() !== (original.name ?? '').trim() ||
      category !== original.category ||
      status !== original.status
    );
  }, [original, brand, name, category, status]);

  const valid =
    brand.trim().length > 0 &&
    name.trim().length > 0 &&
    !!category;

  const canSave = !submitting && dirty && valid && !!original;

  const handleSave = async () => {
    if (!canSave || !original || !session) return;
    setSubmitting(true);
    const { error } = await supabase
      .from('products')
      .update({
        brand: brand.trim(),
        name: name.trim(),
        category,
        status,
      })
      .eq('id', original.id)
      .eq('user_id', session.user.id);
    setSubmitting(false);
    if (error) {
      Alert.alert('Erreur', 'Mise à jour impossible. Réessaye dans un instant.');
      return;
    }
    safeBack('/(tabs)/archive');
  };

  // Auth guard
  if (authChecked && !session) {
    return (
      <SafeAreaView style={s.root} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={s.centered}>
          <Text style={s.muted}>Connecte-toi pour voir ce produit.</Text>
          <PillButton
            label="Retour"
            variant="primary"
            onPress={() => safeBack('/(tabs)/archive')}
            style={{ marginTop: Sp.md }}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={s.root} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={s.centered}>
          <ActivityIndicator color={C.copper} />
        </View>
      </SafeAreaView>
    );
  }

  if (notFound) {
    return (
      <SafeAreaView style={s.root} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={s.centered}>
          <Text style={s.title}>Produit introuvable</Text>
          <Text style={[s.muted, { marginTop: Sp.xs }]}>
            Ce produit a peut-être été supprimé.
          </Text>
          <PillButton
            label="Retour à l’archive"
            variant="primary"
            onPress={() => safeBack('/(tabs)/archive')}
            style={{ marginTop: Sp.md }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={() => safeBack('/(tabs)/archive')} style={s.back}>
          <Text style={s.backTxt}>{'←  Retour'}</Text>
        </Pressable>

        <Text style={s.label}>PRODUIT</Text>
        <Text style={s.title}>Modifier</Text>
        <Text style={s.subtitle}>Mets à jour les informations de ton produit.</Text>

        <Text style={s.fieldLabel}>Marque</Text>
        <TextInput
          value={brand}
          onChangeText={setBrand}
          placeholder="La Roche-Posay"
          placeholderTextColor={C.textSoft}
          style={s.input}
          editable={!submitting}
        />

        <Text style={s.fieldLabel}>Nom</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Toleriane Sensitive"
          placeholderTextColor={C.textSoft}
          style={s.input}
          editable={!submitting}
        />

        <Text style={s.fieldLabel}>Catégorie</Text>
        <View style={s.chipsWrap}>
          {CATEGORIES.map((cat) => {
            const active = category === cat;
            return (
              <Pressable
                key={cat}
                onPress={() => !submitting && setCategory(cat)}
                style={[s.chip, active && s.chipActive]}
              >
                <Text style={[s.chipTxt, active && s.chipTxtActive]}>{cat}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={s.fieldLabel}>Statut</Text>
        <View style={s.statusRow}>
          {STATUSES.map((st) => {
            const active = status === st.id;
            return (
              <Pressable
                key={st.id}
                onPress={() => !submitting && setStatus(st.id)}
                style={[s.statusChip, active && s.statusChipActive]}
              >
                <Text style={[s.statusTxt, active && s.statusTxtActive]}>{st.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <PillButton
          label="Enregistrer"
          variant="primary"
          fullWidth
          disabled={!canSave}
          loading={submitting}
          onPress={handleSave}
          style={{ marginTop: Sp.lg }}
        />

        <View style={{ height: Sp.huge }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.appBg },
  scroll: { paddingHorizontal: Sp.lg, paddingTop: Sp.sm, paddingBottom: Sp.huge },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Sp.lg },
  back: { paddingVertical: Sp.sm, marginBottom: Sp.md },
  backTxt: { fontSize: 14, color: C.textMid },
  label: {
    fontSize: 11,
    letterSpacing: 1.5,
    color: C.copper,
    fontWeight: '600',
    marginBottom: 6,
  },
  title: { ...Type.h1, marginBottom: 4 },
  subtitle: { ...Type.body, color: C.textMid, marginBottom: Sp.lg },
  muted: { ...Type.body, color: C.textMid, textAlign: 'center' },
  fieldLabel: {
    fontSize: 12,
    letterSpacing: 0.5,
    color: C.textMid,
    marginBottom: 6,
    fontWeight: '500',
    marginTop: Sp.md,
  },
  input: {
    backgroundColor: C.bg2,
    borderRadius: R.md,
    padding: Sp.md,
    fontSize: 14,
    color: C.text,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Sp.xs,
  },
  chip: {
    backgroundColor: C.bg2,
    paddingHorizontal: Sp.md,
    paddingVertical: 8,
    borderRadius: R.full,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipActive: {
    backgroundColor: C.cream,
    borderColor: C.copper,
  },
  chipTxt: { fontSize: 13, color: C.textMid },
  chipTxtActive: { color: C.espresso, fontWeight: '600' },
  statusRow: {
    flexDirection: 'row',
    gap: Sp.xs,
  },
  statusChip: {
    flex: 1,
    paddingVertical: Sp.sm,
    backgroundColor: C.bg2,
    borderRadius: R.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  statusChipActive: {
    backgroundColor: C.cream,
    borderColor: C.copper,
  },
  statusTxt: { fontSize: 13, color: C.textMid },
  statusTxtActive: { color: C.espresso, fontWeight: '600' },
});
