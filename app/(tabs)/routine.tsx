import { type Session } from '@supabase/supabase-js';
import { router } from 'expo-router';
import { useEffect, useState, useRef } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Svg, { Path } from 'react-native-svg';
import EmptyState from '../../components/ui/EmptyState';
import PillButton from '../../components/ui/PillButton';
import PremiumCard from '../../components/ui/PremiumCard';
import { optimizeRoutine, RoutineOptimizeResult } from '../../utils/routineAI';
import { saveAICache, loadAICache, clearAICache } from '../../utils/aiCache';
import { AI_DISCLAIMER, COSMETIC_DISCLAIMER } from '../../utils/legal';
import { useAIUnlock } from '../../hooks/useAIUnlock';
import CreditPackModal from '../../components/credits/CreditPackModal';
import { supabase } from '../../lib/supabase';
import { C, R, Sh, Sp, Type } from '../../theme';
import { useLanguage } from '../../hooks/useLanguage';
import RoutineShareCard, { RoutineSlot, RoutineStepLite } from '../../components/share/RoutineShareCard';
import { captureAndShare } from '../../utils/shareCard';

import { categoryInfo } from '../../utils/routineGestures';
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
  category: string | null;
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
  const { t, lang } = useLanguage();
  const [slot, setSlot] = useState<Slot>('matin');
  const [steps, setSteps] = useState<RoutineStep[]>([]);

  const routineShareRef = useRef<View>(null);

  const handleShareRoutine = async () => {
    if (steps.length === 0) return;
    await captureAndShare(routineShareRef, `rituel-routine-${slot}`);
  };
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  // Add modal
  const [modalOpen, setModalOpen] = useState(false);
  const [productName, setProductName] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [myProducts, setMyProducts] = useState<{ id: string; name: string; brand: string | null; category: string | null }[]>([]);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // optimize flow
  const [optimizeModalOpen, setOptimizeModalOpen] = useState(false);
  const [creditPacksVisible, setCreditPacksVisible] = useState(false);
  const { unlock, isPremium } = useAIUnlock('routine_optimize');
  const [optimizing, setOptimizing] = useState(false);
  const [optimizeResult, setOptimizeResult] = useState<RoutineOptimizeResult | null>(null);
  const [optimizeError, setOptimizeError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const cached = await loadAICache<{ result: RoutineOptimizeResult }>('routine');
      if (!cancelled && cached?.result) {
        setOptimizeResult(cached.result);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ----- Session bootstrap -----
  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setAuthChecked(true);
      if (!data.session) {
        Alert.alert(
          t('routine.alerts.signInTitle'),
          t('routine.alerts.signInManageBody'),
          [
            { text: t('routine.alerts.cancel'), style: 'cancel', onPress: () => router.replace('/(tabs)/ai-studio' as any) },
            { text: t('routine.alerts.signInAction'), onPress: () => router.replace('/(tabs)/auth' as any) },
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
      Alert.alert(t('routine.alerts.signInTitle'), t('routine.alerts.signInAddBody'));
      return;
    }
    setProductName('');
    setBrand('');
    setCategory(null);
    setSearch('');
    setError(null);
    setModalOpen(true);
    // load user's archived products for quick-pick
    supabase
      .from('products')
      .select('id, name, brand, category')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setMyProducts(data as any); });
  };

  const handleSave = async () => {
    setError(null);
    if (!session) return;
    if (!productName.trim()) {
      setError('Veuillez renseigner le nom du produit.');
      return;
    }
    setSaving(true);
    const info = categoryInfo(category);
    const { error: err } = await supabase.from('routine_steps').insert({
      user_id: session.user.id,
      product_name: productName.trim(),
      brand: brand.trim(),
      step_order: steps.length + 1,
      duration: info.duration,
      routine_type: slot,
      category: category,
      icon: '',
    });
    setSaving(false);
    if (err) {
      setError(t('routine.alerts.saveError'));
      return;
    }
    setModalOpen(false);
    loadSteps(session.user.id, slot);
  };

  // ----- Delete step -----
  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      t('routine.alerts.deleteStepTitle'),
      t('routine.alerts.deleteStepBody').replace('{name}', name),
      [
        { text: t('routine.alerts.cancel'), style: 'cancel' },
        {
          text: t('routine.alerts.delete'),
          style: 'destructive',
          onPress: async () => {
            const { error: err } = await supabase.from('routine_steps').delete().eq('id', id);
            if (err) {
              Alert.alert(t('routine.alerts.errorTitle'), t('routine.alerts.deleteError'));
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
            t('routine.alerts.errorTitle'),
            t('routine.alerts.unlockError')
          );
        }
        return;
      }
    }
    setOptimizeModalOpen(true);
    clearAICache('routine');
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

      const r = await optimizeRoutine(stepsForAI, skinType, lang);
      setOptimizeResult(r);
      saveAICache('routine', { result: r });
    } catch (e: any) {
      setOptimizeError(e?.message || t('common.genericError'));
    } finally {
      setOptimizing(false);
    }
  };

  const closeOptimize = () => {
    setOptimizeModalOpen(false);
    setOptimizeResult(null);
    setOptimizeError('');
  };

  const routineMinutes = Math.max(
    1,
    Math.round(
      steps.reduce((a, st) => {
        const n = parseInt(String(st.duration).replace(/\D/g, ''), 10) || 60;
        return a + (/min/i.test(String(st.duration)) ? n * 60 : n);
      }, 0) / 60
    )
  );

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
          <Text style={s.title}>{t('routine.title')}</Text>
          <Text style={s.subtitle}>{t('routine.subtitle')}</Text>
        </View>

        <View style={s.segmented}>
          <Pressable onPress={() => setSlot('matin')} style={s.segBtn}>
            <Text style={[s.segTxt, slot === 'matin' && s.segTxtActive]}>{t('routine.segment.morning')}</Text>
            {slot === 'matin' && <View style={s.segUnderline} />}
          </Pressable>
          <Pressable onPress={() => setSlot('soir')} style={s.segBtn}>
            <Text style={[s.segTxt, slot === 'soir' && s.segTxtActive]}>{t('routine.segment.evening')}</Text>
            {slot === 'soir' && <View style={s.segUnderline} />}
          </Pressable>
        </View>

        {steps.length > 0 && (
          <View style={s.summaryRow}>
            <Text style={s.summaryTxt}>
              {steps.length} {steps.length > 1 ? t('routine.summary.steps') : t('routine.summary.step')}
            </Text>
            <View style={s.summaryDot} />
            <Text style={s.summaryTxt}>{routineMinutes} {t('routine.summary.min')}</Text>
          </View>
        )}

        {loading ? (
          <View style={s.loadingBox}><ActivityIndicator color={C.copper} /></View>
        ) : steps.length === 0 ? (
          <View style={s.emptyCard}>
            <EmptyState
              title={t('routine.empty.title')}
              subtitle="Ajoutez vos étapes pour mieux suivre vos soins."
              action={<PillButton label={t('routine.empty.addStep')} variant="primary" onPress={openAddModal} />}
            />
          </View>
        ) : (
          <View style={s.list}>
            {steps.map((step, i) => (
              <ReanimatedSwipeable
                key={step.id}
                friction={2}
                rightThreshold={40}
                overshootRight={false}
                renderRightActions={() => (
                  <Pressable
                    onPress={() => handleDelete(step.id, step.product_name)}
                    style={s.swipeDeleteAction}
                  >
                    <Text style={s.swipeDeleteText}>{t('routine.swipeDelete')}</Text>
                  </Pressable>
                )}
              >
              <View style={[s.stepRow, i === steps.length - 1 && s.stepRowLast]}>
                <Text style={s.stepIdx}>{String(i + 1).padStart(2, '0')}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.stepProduct}>{step.product_name}</Text>
                  {(() => {
                    const info = categoryInfo(step.category);
                    const hint = info.hintKey ? t(info.hintKey) : step.brand || null;
                    return hint ? <Text style={s.stepHint}>{hint}</Text> : null;
                  })()}
                </View>
                <Text style={s.stepTime}>{step.duration}</Text>
              </View>
              </ReanimatedSwipeable>
            ))}
            <PillButton
              label={t('routine.empty.addStep')}
              variant="outline"
              fullWidth
              onPress={openAddModal}
              style={{ marginTop: Sp.md }}
            />
            <PillButton
              label={t('routine.startRitual')}
              variant="primary"
              fullWidth
              onPress={() => router.push('/routine-session' as any)}
              style={{ marginTop: Sp.sm }}
            />
            <Pressable onPress={handleOptimize} style={s.optimizeLink} hitSlop={6}>
              <Text style={s.optimizeLinkTxt}>{t('routine.optimizeCta')}</Text>
            </Pressable>
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
              <Text style={s.label}>{t('routine.optimizeModal.kicker')}</Text>
              <Text style={s.title}>{t('routine.optimizeModal.title')}</Text>
              <Text style={s.subtitle}>
                Suggestions personnalisées selon ton type de peau et tes étapes actuelles.
              </Text>
            </View>

            {optimizing && (
              <View style={s.optimizeLoadingBox}>
                <ActivityIndicator color={C.copper} size="large" />
                <Text style={s.optimizeLoadingTxt}>{t('routine.optimizeModal.loading')}</Text>
              </View>
            )}

            {!optimizing && optimizeError && (
              <View style={s.optimizeErrorBox}>
                <Text style={s.optimizeErrorTitle}>{t('routine.optimizeModal.errorTitle')}</Text>
                <Text style={s.optimizeErrorTxt}>{optimizeError}</Text>
                <PillButton
                  label={t('routine.optimizeModal.retry')}
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
                    <Text style={s.optimizeSectionLabel}>{t('routine.optimizeModal.sectionImprovements')}</Text>
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
                    <Text style={s.optimizeSectionLabel}>{t('routine.optimizeModal.sectionMissing')}</Text>
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
                    <Text style={s.optimizeSectionLabel}>{t('routine.optimizeModal.sectionRecommendations')}</Text>
                    {optimizeResult.recommendations.map((rec, i) => (
                      <View key={`rec-${i}`} style={s.optimizeBulletRow}>
                        <Text style={s.optimizeBulletNum}>{i + 1}</Text>
                        <Text style={s.optimizeBulletTxt}>{rec}</Text>
                      </View>
                    ))}
                  </PremiumCard>
                )}

                <Text style={s.disclaimer}>{AI_DISCLAIMER[lang]}</Text>
                <View style={{ height: Sp.xs }} />
                <Text style={s.disclaimer}>{COSMETIC_DISCLAIMER[lang]}</Text>

                <PillButton
                  label={t('routine.optimizeModal.close')}
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
              <Text style={s.label}>{slot === 'matin' ? t('routine.addModal.kickerMorning') : t('routine.addModal.kickerEvening')}</Text>
              <Text style={s.title}>{t('routine.addModal.title')}</Text>
            </View>

            <View style={s.searchBox}>
              <Text style={s.searchIcon}>⌕</Text>
              <TextInput
                style={s.searchInput}
                placeholder={t('routine.addModal.searchPlaceholder')}
                placeholderTextColor={C.textSoft}
                value={search}
                onChangeText={setSearch}
                autoCorrect={false}
              />
            </View>

            {(() => {
              const q = search.trim().toLowerCase();
              const filtered = q
                ? myProducts.filter((mp) =>
                    (mp.name || '').toLowerCase().includes(q) ||
                    (mp.brand || '').toLowerCase().includes(q))
                : myProducts;
              if (filtered.length === 0) return null;
              return (
                <View style={{ marginBottom: Sp.md }}>
                  <Text style={s.quickLabel}>{t('routine.addModal.fromProducts')}</Text>
                  {filtered.slice(0, 6).map((mp) => (
                    <Pressable
                      key={mp.id}
                      style={s.quickRow}
                      onPress={() => {
                        setProductName(mp.name || '');
                        setBrand(mp.brand || '');
                        setCategory(mp.category ?? null);
                        setError(null);
                      }}
                    >
                      <View style={s.quickAvatar}>
                        <Text style={s.quickAvatarTxt}>
                          {(mp.name || '?').slice(0, 2).toUpperCase()}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.quickName}>{mp.name}</Text>
                        <Text style={s.quickMeta}>
                          {[mp.brand, mp.category].filter(Boolean).join(' · ')}
                        </Text>
                      </View>
                      <Text style={s.quickAdd}>+</Text>
                    </Pressable>
                  ))}
                </View>
              );
            })()}

            <Text style={s.orLabel}>{t('routine.addModal.orManual')}</Text>

            <PremiumCard variant="white" style={{ marginBottom: Sp.md }}>
              <Text style={s.fieldLabel}>{t('routine.addModal.productLabel')}</Text>
              <TextInput
                style={s.input}
                placeholder="ex: Sérum hydratant"
                placeholderTextColor={C.textSoft}
                value={productName}
                onChangeText={(v) => { setProductName(v); setError(null); }}
                editable={!saving}
                autoCorrect={false}
              />

              <Text style={s.fieldLabel}>{t('routine.addModal.brandLabel')}</Text>
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
                label={t('routine.addModal.save')}
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
            {steps.length > 0 && (
          <View style={{ paddingHorizontal: 20, paddingBottom: 12 }}>
            <PillButton
              label={t('routine.shareCta')}
              variant="ghost"
              fullWidth
              onPress={handleShareRoutine}
            />
          </View>
        )}

        {steps.length > 0 && (
          <View style={{ position: 'absolute', left: -9999, top: -9999 }} pointerEvents="none">
            <RoutineShareCard
              ref={routineShareRef}
              slot={slot}
              steps={steps.map((st) => ({
                step_order: st.step_order,
                name: st.product_name ?? '',
                brand: st.brand ?? null,
              }))}
            />
          </View>
        )}

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
    gap: 26,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    marginBottom: Sp.md,
  },
  segUnderline: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: -1,
    height: 2,
    backgroundColor: C.copper,
    borderRadius: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Sp.md,
  },
  summaryTxt: { fontSize: 12.5, color: C.textSoft },
  summaryDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: C.copper },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    paddingVertical: 16,
    paddingHorizontal: Sp.md,
    backgroundColor: C.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
  },
  stepRowLast: { borderBottomWidth: 0 },
  stepIdx: { fontSize: 13, color: C.copper, width: 18, fontVariant: ['tabular-nums'] },
  stepHint: { fontSize: 12, color: C.textSoft, marginTop: 2 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.white,
    borderRadius: R.md,
    paddingHorizontal: Sp.md,
    marginBottom: Sp.md,
    ...Sh.soft,
  },
  searchIcon: { fontSize: 16, color: C.copper, marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 14, fontSize: 14, color: C.espresso },
  quickLabel: {
    fontSize: 11, letterSpacing: 1.2, color: C.textSoft,
    fontWeight: '600', textTransform: 'uppercase', marginBottom: Sp.xs, marginLeft: 2,
  },
  quickRow: {
    flexDirection: 'row', alignItems: 'center', gap: 13,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border,
  },
  quickAvatar: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: C.cream,
    alignItems: 'center', justifyContent: 'center',
  },
  quickAvatarTxt: { fontSize: 12, color: C.copper, fontWeight: '600' },
  quickName: { fontSize: 14.5, color: C.text, fontWeight: '500' },
  quickMeta: { fontSize: 11.5, color: C.textSoft, marginTop: 1 },
  quickAdd: { fontSize: 20, color: C.copper },
  orLabel: {
    fontSize: 12, color: C.textSoft, textAlign: 'center', marginBottom: Sp.sm,
  },
  _segmented_old: {
    flexDirection: 'row',
    backgroundColor: C.white, borderRadius: R.full, padding: 4,
    marginBottom: Sp.lg, borderWidth: 1, borderColor: C.border,
  },
  segBtn: { flex: 1, paddingVertical: 10, borderRadius: R.full, alignItems: 'center' },
  segBtnActive: { backgroundColor: C.espresso },
  segTxt: { fontSize: 13, fontWeight: '500', color: C.textMid },
  segTxtActive: { color: C.white },

  emptyCard: { backgroundColor: C.white, borderRadius: R.lg, ...Sh.soft },
  list: {
    backgroundColor: C.white,
    borderRadius: R.lg,
    overflow: 'hidden',
    marginBottom: Sp.xs,
    ...Sh.soft,
  },
  optimizeLink: { alignItems: 'center', marginTop: Sp.md, paddingVertical: 4 },
  optimizeLinkTxt: { fontSize: 13, color: C.copper, fontWeight: '500' },
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
  swipeDeleteAction: {
    backgroundColor: C.red,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Sp.lg,
    marginVertical: 4,
    borderRadius: R.md,
  },
  swipeDeleteText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
});
