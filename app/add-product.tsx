import { type Session } from '@supabase/supabase-js';
import { router, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import PillButton from '../components/ui/PillButton';
import PremiumCard from '../components/ui/PremiumCard';
import { supabase } from '../lib/supabase';
import { C, R, Sh, Sp, Type } from '../theme';
import { mapAuthError } from '../utils/authErrors';
import { safeBack } from '../utils/safeBack';

type Mode = 'menu' | 'manual';
type ProductStatus = 'active' | 'finished' | 'stocked';

const CATEGORIES_FR = [
  'Nettoyant',
  'Hydratant',
  'Sérum',
  'SPF',
  'Tonique',
  'Masque',
  'Maquillage',
  'Parfum',
  'Corps',
  'Cheveux',
];

const STATUSES: { id: ProductStatus; label: string }[] = [
  { id: 'active', label: 'En cours' },
  { id: 'stocked', label: 'En stock' },
  { id: 'finished', label: 'Terminé' },
];

function BackArrow({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M19 12H5" />
      <Path d="M12 19l-7-7 7-7" />
    </Svg>
  );
}

function SparkleIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 2v6M12 16v6M2 12h6M16 12h6" />
      <Path d="M5 5l3 3M16 16l3 3M5 19l3-3M16 8l3-3" />
    </Svg>
  );
}

function PencilIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 20h9" />
      <Path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4z" />
    </Svg>
  );
}

export default function AddProductScreen() {
  const [mode, setMode] = useState<Mode>('menu');
  const [session, setSession] = useState<Session | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // form fields
  const [brand, setBrand] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>('Hydratant');
  const [status, setStatus] = useState<ProductStatus>('active');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setAuthChecked(true);

      // Logged-out guard with explanation, then redirect to profile tab
      if (!data.session) {
        Alert.alert(
          'Connexion requise',
          'Connectez-vous pour ajouter un produit à votre archive.',
          [
            {
              text: 'Annuler',
              style: 'cancel',
              onPress: () => safeBack('/(tabs)/archive'),
            },
            {
              text: 'Se connecter',
              onPress: () => {
                router.replace('/(tabs)/auth' as any);
              },
            },
          ]
        );
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const canSubmit =
    brand.trim().length > 0 &&
    name.trim().length > 0 &&
    !!category &&
    !submitting &&
    !!session;

  const handleSave = async () => {
    setError(null);
    if (!session) {
      setError('Connectez-vous pour enregistrer.');
      return;
    }
    if (!canSubmit) {
      setError('Veuillez remplir tous les champs.');
      return;
    }

    setSubmitting(true);
    const { error: err } = await supabase.from('products').insert({
      user_id: session.user.id,
      brand: brand.trim(),
      name: name.trim(),
      category,
      status,
    });
    setSubmitting(false);

    if (err) {
      setError(mapAuthError(err));
      return;
    }

    Alert.alert(
      'Produit ajouté',
      `${brand.trim()} — ${name.trim()} a été ajouté à votre archive.`,
      [
        {
          text: 'OK',
          onPress: () => safeBack('/(tabs)/archive'),
        },
      ]
    );
  };

  // Don't render until auth is checked (avoids flash)
  if (!authChecked) {
    return (
      <SafeAreaView style={s.root} edges={['top']}>
        <View style={s.centerWrap} />
      </SafeAreaView>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={s.root} edges={['top']}>
        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={s.topBar}>
            <Pressable onPress={() => safeBack('/(tabs)/archive')} style={s.backBtn} hitSlop={8}>
              <BackArrow color={C.espresso} />
            </Pressable>
          </View>

          <View style={s.header}>
            <Text style={s.label}>ARCHIVE</Text>
            <Text style={s.title}>Ajouter un produit</Text>
            <Text style={s.subtitle}>
              Choisissez la méthode qui vous convient.
            </Text>
          </View>

          {mode === 'menu' && (
            <View style={s.methods}>
              <Pressable
                onPress={() => setMode('manual')}
                style={({ pressed }) => [
                  s.methodCard,
                  Sh.soft,
                  pressed && { opacity: 0.85 },
                ]}
              >
                <View style={s.methodIcon}>
                  <PencilIcon color={C.espresso} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.methodTitle}>Saisie manuelle</Text>
                  <Text style={s.methodDesc}>
                    Renseignez les informations vous-même.
                  </Text>
                </View>
              </Pressable>

              <Pressable
                onPress={() => {
                  Alert.alert(
                    'Bientôt disponible',
                    'L\'identification par IA arrive très bientôt.',
                    [{ text: 'OK' }]
                  );
                }}
                style={({ pressed }) => [
                  s.methodCard,
                  s.methodCardSoon,
                  Sh.soft,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <View style={s.methodIcon}>
                  <SparkleIcon color={C.espresso} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.methodTitle}>Identifier avec l'IA</Text>
                  <Text style={s.methodDesc}>
                    Prenez une photo, l'IA reconnaît la marque et la catégorie.
                  </Text>
                  <Text style={s.methodSoon}>Bientôt disponible</Text>
                </View>
              </Pressable>
            </View>
          )}

          {mode === 'manual' && (
            <View>
              <PremiumCard variant="white" style={s.formCard}>
                <Text style={s.fieldLabel}>MARQUE</Text>
                <TextInput
                  style={s.input}
                  placeholder="ex: Caudalie"
                  placeholderTextColor={C.textSoft}
                  value={brand}
                  onChangeText={(v) => {
                    setBrand(v);
                    setError(null);
                  }}
                  autoCorrect={false}
                  editable={!submitting}
                />

                <Text style={s.fieldLabel}>NOM DU PRODUIT</Text>
                <TextInput
                  style={s.input}
                  placeholder="ex: Vinoperfect Sérum"
                  placeholderTextColor={C.textSoft}
                  value={name}
                  onChangeText={(v) => {
                    setName(v);
                    setError(null);
                  }}
                  autoCorrect={false}
                  editable={!submitting}
                />

                <Text style={s.fieldLabel}>CATÉGORIE</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={s.catScroll}
                >
                  {CATEGORIES_FR.map((cat) => {
                    const active = category === cat;
                    return (
                      <Pressable
                        key={cat}
                        onPress={() => setCategory(cat)}
                        disabled={submitting}
                        style={[
                          s.catChip,
                          active && s.catChipActive,
                        ]}
                      >
                        <Text
                          style={[
                            s.catChipTxt,
                            active && s.catChipTxtActive,
                          ]}
                        >
                          {cat}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                <Text style={s.fieldLabel}>STATUT</Text>
                <View style={s.statusRow}>
                  {STATUSES.map((st) => {
                    const active = status === st.id;
                    return (
                      <Pressable
                        key={st.id}
                        onPress={() => setStatus(st.id)}
                        disabled={submitting}
                        style={[
                          s.statusChip,
                          active && s.statusChipActive,
                        ]}
                      >
                        <Text
                          style={[
                            s.statusTxt,
                            active && s.statusTxtActive,
                          ]}
                        >
                          {st.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {error && (
                  <View style={s.errorBox}>
                    <Text style={s.errorTxt}>{error}</Text>
                  </View>
                )}

                <PillButton
                  label="Enregistrer"
                  variant="primary"
                  fullWidth
                  loading={submitting}
                  disabled={!canSubmit}
                  onPress={handleSave}
                  style={{ marginTop: Sp.md }}
                />
              </PremiumCard>

              <Pressable
                onPress={() => {
                  setMode('menu');
                  setError(null);
                }}
                disabled={submitting}
                style={s.backToMenuBtn}
              >
                <Text style={s.backToMenuTxt}>← Choisir une autre méthode</Text>
              </Pressable>
            </View>
          )}

          <View style={{ height: Sp.huge }} />
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.appBg },
  scroll: { paddingHorizontal: Sp.lg, paddingTop: Sp.sm, paddingBottom: Sp.xl },
  centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  topBar: { flexDirection: 'row', alignItems: 'center', marginBottom: Sp.md },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: C.white,
    alignItems: 'center', justifyContent: 'center',
    ...Sh.soft,
  },

  header: { marginBottom: Sp.xl, marginTop: Sp.sm },
  label: {
    fontSize: 11, fontWeight: '700', color: C.copper,
    letterSpacing: 2.4, marginBottom: Sp.xs,
  },
  title: { ...Type.h1, marginBottom: 4 },
  subtitle: { ...Type.body, color: C.textMid },

  methods: { marginBottom: Sp.xl },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: C.white,
    borderRadius: R.lg,
    padding: Sp.lg,
    marginBottom: Sp.sm,
  },
  methodIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: C.cream,
    alignItems: 'center', justifyContent: 'center',
    marginRight: Sp.md,
  },
  methodTitle: {
    fontSize: 15, fontWeight: '600', color: C.text, marginBottom: 4,
  },
  methodDesc: {
    fontSize: 13, color: C.textMid, lineHeight: 18,
  },
  methodCardSoon: {
    opacity: 0.6,
  },
  methodSoon: {
    fontSize: 10, color: C.copper, fontWeight: '600',
    letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 6,
  },

  formCard: { marginBottom: Sp.md },
  fieldLabel: {
    fontSize: 10, fontWeight: '700', color: C.copper,
    letterSpacing: 1.4, textTransform: 'uppercase',
    marginBottom: Sp.xs, marginTop: Sp.sm,
  },
  input: {
    backgroundColor: C.cream,
    borderRadius: R.sm,
    paddingHorizontal: Sp.md,
    paddingVertical: 12,
    fontSize: 14,
    color: C.text,
  },

  catScroll: { paddingRight: Sp.md, paddingVertical: 4 },
  catChip: {
    backgroundColor: C.cream,
    borderRadius: R.full,
    paddingHorizontal: Sp.md,
    paddingVertical: 8,
    marginRight: Sp.xs,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  catChipActive: {
    backgroundColor: C.espresso,
    borderColor: C.espresso,
  },
  catChipTxt: { fontSize: 13, color: C.text, fontWeight: '500' },
  catChipTxtActive: { color: C.white },

  statusRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  statusChip: {
    flex: 1,
    backgroundColor: C.cream,
    borderRadius: R.full,
    paddingVertical: 10,
    alignItems: 'center',
    marginRight: Sp.xs,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  statusChipActive: {
    backgroundColor: C.espresso,
    borderColor: C.espresso,
  },
  statusTxt: { fontSize: 12, color: C.text, fontWeight: '500' },
  statusTxtActive: { color: C.white },

  errorBox: {
    backgroundColor: '#FCE8E6',
    borderRadius: R.sm,
    padding: Sp.sm,
    marginTop: Sp.md,
  },
  errorTxt: { fontSize: 12, color: C.red, lineHeight: 17 },

  backToMenuBtn: {
    alignItems: 'center',
    padding: Sp.md,
  },
  backToMenuTxt: {
    fontSize: 13,
    color: C.copper,
    fontWeight: '500',
  },
});