import { type Session } from '@supabase/supabase-js';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import EmptyState from '../../components/ui/EmptyState';
import PillButton from '../../components/ui/PillButton';
import PremiumCard from '../../components/ui/PremiumCard';
import { optimizeRoutine, RoutineOptimizeResult } from '../../utils/routineAI';
import { AI_DISCLAIMER, COSMETIC_DISCLAIMER } from '../../utils/legal';
import { useAIUnlock } from '../../hooks/useAIUnlock';
import CreditPackModal from '../../components/credits/CreditPackModal';
import { supabase } from '../../lib/supabase';
import { C, R, Sh, Sp, Type } from '../../theme';

type Slot = 'matin' | 'soir';

type RoutineStep = {
  id: string;
  user_id: string;
  product_name: string;
  brand: string;
  step_order: number;
  duration: string;
  routine_type: string;
  icon: string;
};

function BackArrow({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M19 12H5" />
      <Path d="M12 19l-7-7 7-7" />
    </Svg>
  );
}

function CloseIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M18 6L6 18M6 6l12 12" />
    </Svg>
  );
}

export default function RoutineScreen() {
  const [slot, setSlot] = useState<Slot>('matin');
  const [steps, setSteps] = useState<RoutineStep[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  // Add modal
  const [modalOpen, setModalOpen] = useState(false);
  const [productName, setProductName] = useState('');
  const [brand, setBrand] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // optimize flow
  const [optimizeModalOpen, setOptimizeModalOpen] = useState(false);
  const [creditPacksVisible, setCreditPacksVisible] = useState(false);
  const { unlock, isPremium } = useAIUnlock('routine_optimize');
  const [optimizing, setOptimizing] = useState(false);
  const [optimizeResult, setOptimizeResult] = useState<RoutineOptimizeResult | null>(null);
  const [optimizeError, setOptimizeError] = useState('');

  // ----- Session bootstrap -----
  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setAuthChecked(true);
      if (!data.session) {
        Alert.alert(
          'Connexion requise',
          'Connectez-vous pour gérer votre routine.',
          [
            { text: 'Annuler', style: 'cancel', onPress: () => router.replace('/(tabs)/ai-studio' as any) },
            { text: 'Se connecter', onPress: () => router.replace('/(tabs)/auth' as any) },
          ]
        );
      }
    });
    return () => { mounted = false; };
  }, []);

  // ----- Load steps when session or slot changes -----
  useEffect(() => {
    if (!session) {
      setLoading(false);
      return;
    }
    loadSteps(session.user.id, slot);
  }, [session, slot]);

  const loadSteps = async (userId: string, type: Slot) => {
    setLoading(true);
    const { data, error: err } = await supabase
      .from('routine_steps')
      .select('*')
      .eq('user_id', userId)
      .eq('routine_type', type)
      .order('step_order', { ascending: true });
    if (!err && data) setSteps(data as RoutineStep[]);
    setLoading(false);
  };

  // ----- Add step -----
  const openAddModal = () => {
    if (!session) {
      Alert.alert('Connexion requise', 'Connectez-vous pour ajouter une étape.');
      return;
    }
    setProductName('');
    setBrand('');
    setError(null);
    setModalOpen(true);
  };

  const handleSave = async () => {
    setError(null);
    if (!session) return;
    if (!productName.trim()) {
      setError('Veuillez renseigner le nom du produit.');
      return;
    }
    setSaving(true);
    const { error: err } = await supabase.from('routine_steps').insert({
      user_id: session.user.id,
      product_name: productName.trim(),
      brand: brand.trim(),
      step_order: steps.length + 1,
      duration: '60s',
      routine_type: slot,
      icon: '',
    });
    setSaving(false);
    if (err) {
      setError('Erreur lors de l\'enregistrement. Réessayez.');
      return;
    }
    setModalOpen(false);
    loadSteps(session.user.id, slot);
  };

  // ----- Delete step -----
  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      'Supprimer l\'étape',
      `Voulez-vous supprimer "${name}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            const { error: err } = await supabase.from('routine_steps').delete().eq('id', id);
            if (err) {
              Alert.alert('Erreur', 'Suppression impossible.');
              return;
            }
            if (session) loadSteps(session.user.id, slot);
          },
        },
      ]
    );
  };

  // ----- AI Optimize -----
  const handleOptimize = async () => {
    if (steps.length === 0 || !session) return;
    if (!isPremium) {
      const resultId = `routine_${Date.now()}`;
      const r = await unlock(resultId);
      if (!r.ok) {
        if (r.reason === 'insufficient') {
          setCreditPacksVisible(true);
        } else {
          Alert.alert(
            'Erreur',
            "Impossible de débloquer l'optimisation. Réessaye dans un instant."
          );
        }
        return;
      }
    }
    setOptimizeModalOpen(true);
    setOptimizing(true);
    setOptimizeError('');
    setOptimizeResult(null);

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('skin_type')
        .eq('id', session.user.id)
        .maybeSingle();
      const skinType = profile?.skin_type || 'normal';

      const { data: allSteps } = await supabase
        .from('routine_steps')
        .select('product_name, routine_type')
        .eq('user_id', session.user.id);

      const stepsForAI = (allSteps || []).map((st: any) => ({
        name: st.product_name as string,
        time: (st.routine_type === 'matin' ? 'morning' : 'evening') as 'morning' | 'evening',
      }));

      const r = await optimizeRoutine(stepsForAI, skinType, 'fr');
      setOptimizeResult(r);
    } catch (e: any) {
      setOptimizeError(e?.message || 'Une erreur est survenue. Réessayez.');
    } finally {
      setOptimizing(false);
    }
  };

  const closeOptimize = () => {
    setOptimizeModalOpen(false);
    setOptimizeResult(null);
    setOptimizeError('');
  };

  if (!authChecked) {
    return (
      <SafeAreaView style={s.root} edges={['top']}>
        <View style={s.centerWrap}><ActivityIndicator color={C.copper} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.topBar}>
          <Pressable onPress={() => router.replace('/(tabs)/ai-studio' as any)} style={s.backBtn} hitSlop={8}>
            <BackArrow color={C.espresso} />
          </Pressable>
        </View>

        <View style={s.header}>
          <Text style={s.title}>Ma Routine</Text>
          <Text style={s.subtitle}>Construisez une routine simple et cohérente.</Text>
        </View>

        <View style={s.segmented}>
          <Pressable onPress={() => setSlot('matin')} style={[s.segBtn, slot === 'matin' && s.segBtnActive]}>
            <Text style={[s.segTxt, slot === 'matin' && s.segTxtActive]}>Matin</Text>
          </Pressable>
          <Pressable onPress={() => setSlot('soir')} style={[s.segBtn, slot === 'soir' && s.segBtnActive]}>
            <Text style={[s.segTxt, slot === 'soir' && s.segTxtActive]}>Soir</Text>
          </Pressable>
        </View>

        {loading ? (
          <View style={s.loadingBox}><ActivityIndicator color={C.copper} /></View>
        ) : steps.length === 0 ? (
          <View style={s.emptyCard}>
            <EmptyState
              title="Votre routine est prête à être construite"
              subtitle="Ajoutez vos étapes pour mieux suivre vos soins."
              action={<PillButton label="+ Ajouter une étape" variant="primary" onPress={openAddModal} />}
            />
          </View>
        ) : (
          <View style={s.list}>
            {steps.map((step, i) => (
              <View key={step.id} style={[s.stepCard, Sh.soft]}>
                <View style={s.stepNumber}>
                  <Text style={s.stepNumberTxt}>{i + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  {step.brand ? <Text style={s.stepBrand}>{step.brand.toUpperCase()}</Text> : null}
                  <Text style={s.stepProduct}>{step.product_name}</Text>
                  <Text style={s.stepTime}>{step.duration}</Text>
                </View>
                <Pressable onPress={() => handleDelete(step.id, step.product_name)} style={s.deleteBtn} hitSlop={8}>
                  <CloseIcon color={C.textSoft} />
                </Pressable>
              </View>
            ))}
            <PillButton
              label="Optimiser avec l'IA"
              variant="primary"
              fullWidth
              onPress={handleOptimize}
              style={{ marginTop: Sp.md }}
            />
            <PillButton
              label="+ Ajouter une étape"
              variant="outline"
              fullWidth
              onPress={openAddModal}
              style={{ marginTop: Sp.xs }}
            />
          </View>
        )}

        <View style={{ height: Sp.huge }} />
      </ScrollView>

      <Modal visible={optimizeModalOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={closeOptimize}>
        <SafeAreaView style={s.modalRoot} edges={['top']}>
          <ScrollView contentContainerStyle={s.modalScroll} showsVerticalScrollIndicator={false}>
            <View style={s.modalTopBar}>
              <Pressable onPress={closeOptimize} style={s.backBtn} hitSlop={8}>
                <CloseIcon color={C.espresso} />
              </Pressable>
            </View>

            <View style={s.header}>
              <Text style={s.label}>OPTIMISATION IA</Text>
              <Text style={s.title}>Ta routine, mieux pensée</Text>
              <Text style={s.subtitle}>
                Suggestions personnalisées selon ton type de peau et tes étapes actuelles.
              </Text>
            </View>

            {optimizing && (
              <View style={s.optimizeLoadingBox}>
                <ActivityIndicator color={C.copper} size="large" />
                <Text style={s.optimizeLoadingTxt}>Analyse en cours...</Text>
              </View>
            )}

            {!optimizing && optimizeError && (
              <View style={s.optimizeErrorBox}>
                <Text style={s.optimizeErrorTitle}>Oups</Text>
                <Text style={s.optimizeErrorTxt}>{optimizeError}</Text>
                <PillButton
                  label="Réessayer"
                  variant="primary"
                  fullWidth
                  onPress={handleOptimize}
                  style={{ marginTop: Sp.md }}
                />
              </View>
            )}

            {!optimizing && !optimizeError && optimizeResult && (
              <View>
                {optimizeResult.improvements.length > 0 && (
                  <PremiumCard variant="white" style={{ marginBottom: Sp.sm }}>
                    <Text style={s.optimizeSectionLabel}>AMÉLIORATIONS</Text>
                    {optimizeResult.improvements.map((imp, i) => (
                      <View key={`imp-${i}`} style={s.optimizeBulletRow}>
                        <Text style={s.optimizeBulletNum}>{i + 1}</Text>
                        <Text style={s.optimizeBulletTxt}>{imp}</Text>
                      </View>
                    ))}
                  </PremiumCard>
                )}

                {optimizeResult.missingCategories.length > 0 && (
                  <PremiumCard variant="white" style={{ marginBottom: Sp.sm }}>
                    <Text style={s.optimizeSectionLabel}>CATÉGORIES MANQUANTES</Text>
                    <View style={s.optimizeChipsRow}>
                      {optimizeResult.missingCategories.map((cat, i) => (
                        <View key={`miss-${i}`} style={s.optimizeMissingChip}>
                          <Text style={s.optimizeMissingChipTxt}>{cat}</Text>
                        </View>
                      ))}
                    </View>
                  </PremiumCard>
                )}

                {optimizeResult.recommendations.length > 0 && (
                  <PremiumCard variant="white" style={{ marginBottom: Sp.sm }}>
                    <Text style={s.optimizeSectionLabel}>RECOMMANDATIONS</Text>
                    {optimizeResult.recommendations.map((rec, i) => (
                      <View key={`rec-${i}`} style={s.optimizeBulletRow}>
                        <Text style={s.optimizeBulletNum}>{i + 1}</Text>
                        <Text style={s.optimizeBulletTxt}>{rec}</Text>
                      </View>
                    ))}
                  </PremiumCard>
                )}

                <Text style={s.disclaimer}>{AI_DISCLAIMER.fr}</Text>
                <View style={{ height: Sp.xs }} />
                <Text style={s.disclaimer}>{COSMETIC_DISCLAIMER.fr}</Text>

                <PillButton
                  label="Fermer"
                  variant="outline"
                  fullWidth
                  onPress={closeOptimize}
                  style={{ marginTop: Sp.md }}
                />
              </View>
            )}

            <View style={{ height: Sp.huge }} />
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <Modal visible={modalOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalOpen(false)}>
        <SafeAreaView style={s.modalRoot} edges={['top']}>
          <ScrollView contentContainerStyle={s.modalScroll} keyboardShouldPersistTaps="handled">
            <View style={s.modalTopBar}>
              <Pressable onPress={() => setModalOpen(false)} style={s.backBtn} hitSlop={8}>
                <CloseIcon color={C.espresso} />
              </Pressable>
            </View>

            <View style={s.header}>
              <Text style={s.label}>{slot === 'matin' ? 'ROUTINE MATIN' : 'ROUTINE SOIR'}</Text>
              <Text style={s.title}>Nouvelle étape</Text>
            </View>

            <PremiumCard variant="white" style={{ marginBottom: Sp.md }}>
              <Text style={s.fieldLabel}>NOM DU PRODUIT</Text>
              <TextInput
                style={s.input}
                placeholder="ex: Sérum hydratant"
                placeholderTextColor={C.textSoft}
                value={productName}
                onChangeText={(v) => { setProductName(v); setError(null); }}
                editable={!saving}
                autoCorrect={false}
              />

              <Text style={s.fieldLabel}>MARQUE (optionnel)</Text>
              <TextInput
                style={s.input}
                placeholder="ex: Caudalie"
                placeholderTextColor={C.textSoft}
                value={brand}
                onChangeText={(v) => { setBrand(v); setError(null); }}
                editable={!saving}
                autoCorrect={false}
              />

              {error && (
                <View style={s.errorBox}>
                  <Text style={s.errorTxt}>{error}</Text>
                </View>
              )}

              <PillButton
                label="Enregistrer"
                variant="primary"
                fullWidth
                loading={saving}
                disabled={!productName.trim() || saving}
                onPress={handleSave}
                style={{ marginTop: Sp.md }}
              />
            </PremiumCard>
          </ScrollView>
        </SafeAreaView>
      </Modal>
      <CreditPackModal
        visible={creditPacksVisible}
        onClose={() => setCreditPacksVisible(false)}
        onSuccess={() => setCreditPacksVisible(false)}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.appBg },
  scroll: { paddingHorizontal: Sp.lg, paddingTop: Sp.sm, paddingBottom: Sp.xl },
  centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingBox: { paddingVertical: Sp.huge, alignItems: 'center' },

  topBar: { flexDirection: 'row', alignItems: 'center', marginBottom: Sp.md },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: C.white, alignItems: 'center', justifyContent: 'center',
    ...Sh.soft,
  },
  header: { marginBottom: Sp.lg, marginTop: Sp.sm },
  label: {
    fontSize: 11, fontWeight: '700', color: C.copper,
    letterSpacing: 2.4, marginBottom: Sp.xs,
  },
  title: { ...Type.h1, marginBottom: 4 },
  subtitle: { ...Type.body, color: C.textMid },

  segmented: {
    flexDirection: 'row',
    backgroundColor: C.white, borderRadius: R.full, padding: 4,
    marginBottom: Sp.lg, borderWidth: 1, borderColor: C.border,
  },
  segBtn: { flex: 1, paddingVertical: 10, borderRadius: R.full, alignItems: 'center' },
  segBtnActive: { backgroundColor: C.espresso },
  segTxt: { fontSize: 13, fontWeight: '500', color: C.textMid },
  segTxtActive: { color: C.white },

  emptyCard: { backgroundColor: C.white, borderRadius: R.lg, ...Sh.soft },
  list: {},
  stepCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.white, borderRadius: R.md,
    padding: Sp.md, marginBottom: Sp.xs,
  },
  stepNumber: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: C.cream,
    alignItems: 'center', justifyContent: 'center',
    marginRight: Sp.sm,
  },
  stepNumberTxt: { fontSize: 12, fontWeight: '700', color: C.espresso },
  stepBrand: {
    fontSize: 9, fontWeight: '700', color: C.copper,
    letterSpacing: 1.4, marginBottom: 2,
  },
  stepProduct: { fontSize: 14, fontWeight: '600', color: C.text, marginBottom: 2 },
  stepTime: { fontSize: 12, color: C.textMid },
  deleteBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: C.cream,
    alignItems: 'center', justifyContent: 'center',
    marginLeft: Sp.xs,
  },

  modalRoot: { flex: 1, backgroundColor: C.appBg },
  modalScroll: { paddingHorizontal: Sp.lg, paddingTop: Sp.sm, paddingBottom: Sp.xl },
  modalTopBar: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: Sp.md },

  fieldLabel: {
    fontSize: 10, fontWeight: '700', color: C.copper,
    letterSpacing: 1.4, textTransform: 'uppercase',
    marginBottom: Sp.xs, marginTop: Sp.sm,
  },
  input: {
    backgroundColor: C.cream, borderRadius: R.sm,
    paddingHorizontal: Sp.md, paddingVertical: 12,
    fontSize: 14, color: C.text,
  },
  errorBox: {
    backgroundColor: '#FCE8E6', borderRadius: R.sm,
    padding: Sp.sm, marginTop: Sp.sm,
  },
  errorTxt: { fontSize: 12, color: C.red, lineHeight: 17 },

  optimizeLoadingBox: {
    paddingVertical: Sp.huge,
    alignItems: 'center',
  },
  optimizeLoadingTxt: {
    fontSize: 14,
    color: C.textMid,
    marginTop: Sp.md,
  },
  optimizeErrorBox: {
    backgroundColor: C.white,
    borderRadius: R.lg,
    padding: Sp.lg,
    alignItems: 'center',
  },
  optimizeErrorTitle: {
    ...Type.h2,
    marginBottom: Sp.xs,
  },
  optimizeErrorTxt: {
    fontSize: 13,
    color: C.textMid,
    textAlign: 'center',
    lineHeight: 19,
  },
  optimizeSectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: C.copper,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: Sp.sm,
  },
  optimizeBulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Sp.xs,
  },
  optimizeBulletNum: {
    width: 22,
    fontSize: 12,
    fontWeight: '700',
    color: C.espresso,
  },
  optimizeBulletTxt: {
    flex: 1,
    fontSize: 13,
    color: C.text,
    lineHeight: 19,
  },
  optimizeChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  optimizeMissingChip: {
    backgroundColor: '#FCE8E6',
    borderRadius: R.full,
    paddingHorizontal: Sp.sm,
    paddingVertical: 6,
    marginRight: 6,
    marginBottom: 6,
  },
  optimizeMissingChipTxt: {
    fontSize: 12,
    color: C.red,
    fontWeight: '600',
  },
  disclaimer: {
    fontSize: 11,
    color: C.textSoft,
    textAlign: 'center',
    lineHeight: 17,
    marginTop: Sp.md,
    paddingHorizontal: Sp.md,
  },
});
