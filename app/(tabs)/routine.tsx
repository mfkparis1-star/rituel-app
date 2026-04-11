import { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTranslation } from '../../hooks/useTranslation';
import { supabase } from '../../lib/supabase';

const T = {
  bg: '#FDF8F5', bg2: '#F5EDE6', accent: '#B8856A',
  dark: '#1A1310', mid: '#6B5245', light: '#E8D5C8', white: '#FFFFFF',
  green: '#5B9B6B',
};

type RoutineStep = {
  id: string; user_id: string; product_name: string; brand: string;
  step_order: number; duration: string; routine_type: string; icon: string;
};

export default function RoutineScreen() {
  const { t, lang } = useTranslation();
  const [tab, setTab] = useState('matin');
  const [steps, setSteps] = useState<RoutineStep[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [productName, setProductName] = useState('');
  const [brand, setBrand] = useState('');
  const [duration, setDuration] = useState('60s');
  const [saving, setSaving] = useState(false);

  const lbl = (fr: string, tr: string, en: string) => lang === 'fr' ? fr : lang === 'tr' ? tr : en;

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user;
      setUser(u || null);
      if (u) loadSteps(u.id, tab);
      else setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user;
      setUser(u || null);
      if (!u) setLoading(false);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) loadSteps(user.id, tab);
  }, [tab]);

  const loadSteps = async (userId: string, type: string) => {
    setLoading(true);
    const { data, error } = await supabase.from('routine_steps').select('*').eq('user_id', userId).eq('routine_type', type).order('step_order', { ascending: true });
    if (error) console.warn('loadSteps error:', error.message);
    else if (data) setSteps(data);
    setLoading(false);
  };

  const addStep = async () => {
    if (!productName.trim()) { Alert.alert('', lbl('Nom du produit obligatoire', 'Ürün adı zorunlu', 'Product name required')); return; }
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('routine_steps').insert({
      user_id: user.id, product_name: productName.trim(),
      brand: brand.trim(), step_order: steps.length + 1,
      duration, routine_type: tab, icon: '✨',
    });
    if (error) Alert.alert('Erreur', error.message);
    else { setShowModal(false); setProductName(''); setBrand(''); setDuration('60s'); loadSteps(user.id, tab); }
    setSaving(false);
  };

  const deleteStep = async (id: string) => {
    const { error } = await supabase.from('routine_steps').delete().eq('id', id);
    if (error) { Alert.alert('Erreur', error.message); return; }
    if (user) loadSteps(user.id, tab);
  };

  if (!user) return (
    <View style={s.center}>
      <Text style={s.centerTitle}>{t.archive.login_required}</Text>
      <Text style={s.centerSub}>{t.archive.login_sub}</Text>
    </View>
  );

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>

      <View style={s.header}>
        <Text style={s.title}>{t.routine.title}</Text>
      </View>

      <View style={s.tabs}>
        {[
          { id: 'matin', label: t.routine.morning, emoji: '☀️' },
          { id: 'soir', label: t.routine.evening, emoji: '🌙' },
        ].map(tab2 => (
          <TouchableOpacity key={tab2.id} onPress={() => setTab(tab2.id)} style={[s.tab, tab === tab2.id && s.tabActive]}>
            <Text style={[s.tabText, tab === tab2.id && s.tabTextActive]}>{tab2.emoji} {tab2.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <Text style={s.loading}>...</Text>
      ) : steps.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyIcon}>{tab === 'matin' ? '☀️' : '🌙'}</Text>
          <Text style={s.emptyTitle}>{t.routine.empty_title}</Text>
          <Text style={s.emptySub}>{t.routine.empty_sub}</Text>
        </View>
      ) : (
        steps.map((step2, i) => (
          <View key={step2.id} style={s.stepRow}>
            <View style={s.timeline}>
              <View style={s.stepIconBox}>
                <Text style={s.stepEmoji}>{step2.icon}</Text>
              </View>
              {i < steps.length - 1 && <View style={s.line} />}
            </View>
            <View style={s.stepCard}>
              <View style={s.stepHeader}>
                <Text style={s.stepName}>{step2.product_name}</Text>
                <View style={s.stepNumBadge}>
                  <Text style={s.stepNum}>
                    {lbl(`Étape ${step2.step_order}`, `Adım ${step2.step_order}`, `Step ${step2.step_order}`)}
                  </Text>
                </View>
              </View>
              <Text style={s.stepBrand}>{step2.brand} · {step2.duration}</Text>
            </View>
            <TouchableOpacity onPress={() => deleteStep(step2.id)} style={s.deleteBtn}>
              <Text style={s.deleteBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
        ))
      )}

      <TouchableOpacity style={s.addBtn} onPress={() => setShowModal(true)}>
        <Text style={s.addText}>+ {t.routine.add_step}</Text>
      </TouchableOpacity>

      {steps.length > 0 && (
        <View style={s.shareBox}>
          <Text style={s.shareTitle}>{t.routine.share_title}</Text>
          <Text style={s.shareSub}>{t.routine.share_sub}</Text>
          <TouchableOpacity style={s.shareBtn}>
            <Text style={s.shareBtnText}>{t.routine.share_btn}</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={{ height: 40 }} />

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <ScrollView style={s.modalScroll} keyboardShouldPersistTaps="handled">
            <View style={s.modalContent}>
              <View style={s.modalHandle} />
              <Text style={s.modalTitle}>{t.routine.new_step}</Text>
              <Text style={s.fieldLabel}>{t.routine.product_name}</Text>
              <TextInput style={s.input} placeholder={lbl('ex: Toleriane Double Repair', 'örn: CeraVe', 'ex: CeraVe Moisturizing')} placeholderTextColor={T.light} value={productName} onChangeText={setProductName} autoCorrect={false} />
              <Text style={s.fieldLabel}>{t.routine.brand}</Text>
              <TextInput style={s.input} placeholder={lbl('ex: La Roche-Posay', 'örn: La Roche-Posay', 'ex: CeraVe')} placeholderTextColor={T.light} value={brand} onChangeText={setBrand} autoCorrect={false} />
              <Text style={s.fieldLabel}>{t.routine.duration}</Text>
              <View style={s.durationRow}>
                {['30s', '60s', '90s', '2min'].map(d => (
                  <TouchableOpacity key={d} onPress={() => setDuration(d)} style={[s.durationChip, duration === d && s.durationChipActive]}>
                    <Text style={[s.durationChipText, duration === d && s.durationChipTextActive]}>{d}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={s.modalBtns}>
                <TouchableOpacity style={s.cancelBtn} onPress={() => setShowModal(false)}>
                  <Text style={s.cancelBtnText}>{lbl('Annuler', 'İptal', 'Cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.saveBtn} onPress={addStep} disabled={saving}>
                  <Text style={s.saveBtnText}>{saving ? '...' : lbl('Ajouter ✓', 'Ekle ✓', 'Add ✓')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  header: { paddingHorizontal: 22, paddingTop: 60, paddingBottom: 16 },
  title: { fontSize: 24, fontWeight: '300', color: T.dark, letterSpacing: 0.5 },
  tabs: { flexDirection: 'row', gap: 10, marginHorizontal: 22, marginBottom: 20 },
  tab: { flex: 1, padding: 12, borderRadius: 100, backgroundColor: T.white, alignItems: 'center', borderWidth: 1, borderColor: T.light },
  tabActive: { backgroundColor: T.dark, borderColor: T.dark },
  tabText: { fontSize: 12, color: T.mid },
  tabTextActive: { color: 'rgba(184,133,106,0.9)' },
  loading: { textAlign: 'center', color: T.light, marginTop: 40 },
  empty: { alignItems: 'center', paddingTop: 40, paddingBottom: 20 },
  emptyIcon: { fontSize: 40, marginBottom: 10 },
  emptyTitle: { fontSize: 17, fontWeight: '300', color: T.dark, marginBottom: 6 },
  emptySub: { fontSize: 12, color: T.mid },
  stepRow: { flexDirection: 'row', gap: 12, marginHorizontal: 22, marginBottom: 4, alignItems: 'flex-start' },
  timeline: { alignItems: 'center', width: 44 },
  stepIconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: T.white, borderWidth: 1, borderColor: T.light, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  stepEmoji: { fontSize: 20 },
  line: { width: 1.5, flex: 1, backgroundColor: T.light, marginVertical: 4, minHeight: 20 },
  stepCard: { flex: 1, backgroundColor: T.white, borderRadius: 14, padding: 12, marginBottom: 4, borderWidth: 1, borderColor: T.light, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  stepHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  stepName: { fontSize: 13, fontWeight: '500', color: T.dark, flex: 1 },
  stepNumBadge: { backgroundColor: 'rgba(184,133,106,0.1)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  stepNum: { fontSize: 9, color: T.accent, letterSpacing: 0.3 },
  stepBrand: { fontSize: 10, color: T.mid },
  deleteBtn: { padding: 8, justifyContent: 'center' },
  deleteBtnText: { fontSize: 12, color: T.light },
  addBtn: { borderWidth: 1.5, borderColor: T.light, borderStyle: 'dashed', borderRadius: 14, padding: 16, alignItems: 'center', marginHorizontal: 22, marginTop: 8, marginBottom: 16 },
  addText: { fontSize: 13, color: T.mid },
  shareBox: { backgroundColor: T.bg2, borderRadius: 18, padding: 18, marginHorizontal: 22, marginBottom: 16, borderWidth: 1, borderColor: T.light },
  shareTitle: { fontSize: 13, fontWeight: '500', color: T.dark, marginBottom: 4 },
  shareSub: { fontSize: 11, color: T.mid, marginBottom: 14 },
  shareBtn: { backgroundColor: T.accent, borderRadius: 100, padding: 12, alignItems: 'center' },
  shareBtnText: { fontSize: 12, fontWeight: '500', color: T.white },
  center: { flex: 1, backgroundColor: T.bg, alignItems: 'center', justifyContent: 'center', padding: 40 },
  centerTitle: { fontSize: 18, fontWeight: '300', color: T.dark, marginBottom: 8 },
  centerSub: { fontSize: 13, color: T.mid, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(26,19,16,0.6)', justifyContent: 'flex-end' },
  modalScroll: { maxHeight: '85%' as any },
  modalContent: { backgroundColor: T.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 48 },
  modalHandle: { width: 36, height: 4, backgroundColor: T.light, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '300', color: T.dark, marginBottom: 20, letterSpacing: 0.3 },
  fieldLabel: { fontSize: 9, color: T.mid, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 6 },
  input: { backgroundColor: T.white, borderRadius: 12, padding: 13, color: T.dark, fontSize: 13, borderWidth: 1, borderColor: T.light, marginBottom: 14 },
  durationRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  durationChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 100, backgroundColor: T.white, borderWidth: 1, borderColor: T.light },
  durationChipActive: { backgroundColor: T.dark, borderColor: T.dark },
  durationChipText: { fontSize: 12, color: T.mid },
  durationChipTextActive: { color: 'rgba(184,133,106,0.9)' },
  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 8 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: T.light, alignItems: 'center' },
  cancelBtnText: { fontSize: 13, color: T.mid },
  saveBtn: { flex: 2, padding: 14, borderRadius: 12, backgroundColor: T.accent, alignItems: 'center' },
  saveBtnText: { fontSize: 13, fontWeight: '600', color: T.white },
});