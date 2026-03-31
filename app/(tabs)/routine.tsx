import { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTranslation } from '../../hooks/useTranslation';
import { supabase } from '../../lib/supabase';

const T = {
  bg: '#08080E', surface: '#11111A', border: '#1C1C2E',
  accent: '#C9A96E', rose: '#E87FAC', text: '#F5F0F8',
  textMid: '#B8B0C4', textSoft: '#6B6278',
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

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user;
      setUser(u || null);
      if (u) loadSteps(u.id, tab);
      else setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (user) loadSteps(user.id, tab);
  }, [tab]);

  const loadSteps = async (userId: string, type: string) => {
    setLoading(true);
    const { data } = await supabase.from('routine_steps').select('*').eq('user_id', userId).eq('routine_type', type).order('step_order', { ascending: true });
    if (data) setSteps(data);
    setLoading(false);
  };

  const addStep = async () => {
    if (!productName.trim()) { Alert.alert('', lang === 'fr' ? 'Nom du produit obligatoire' : 'Product name required'); return; }
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('routine_steps').insert({
      user_id: user.id, product_name: productName.trim(),
      brand: brand.trim(), step_order: steps.length + 1,
      duration, routine_type: tab, icon: '✨',
    });
    if (error) { Alert.alert('Erreur', error.message); }
    else { setShowModal(false); setProductName(''); setBrand(''); setDuration('60s'); loadSteps(user.id, tab); }
    setSaving(false);
  };

  const deleteStep = async (id: string) => {
    await supabase.from('routine_steps').delete().eq('id', id);
    if (user) loadSteps(user.id, tab);
  };

  if (!user) return (
    <View style={styles.center}>
      <Text style={styles.centerIcon}>🔐</Text>
      <Text style={styles.centerTitle}>{t.archive.login_required}</Text>
      <Text style={styles.centerSub}>{t.archive.login_sub}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t.routine.title}</Text>
      </View>

      <View style={styles.tabs}>
        {[
          { id: 'matin', label: t.routine.morning },
          { id: 'soir', label: t.routine.evening },
        ].map(t2 => (
          <TouchableOpacity key={t2.id} onPress={() => setTab(t2.id)} style={[styles.tab, tab === t2.id && styles.tabActive]}>
            <Text style={[styles.tabText, tab === t2.id && styles.tabTextActive]}>{t2.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <Text style={styles.loading}>...</Text>
      ) : steps.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>{tab === 'matin' ? '☀️' : '🌙'}</Text>
          <Text style={styles.emptyTitle}>{t.routine.empty_title}</Text>
          <Text style={styles.emptySub}>{t.routine.empty_sub}</Text>
        </View>
      ) : (
        steps.map((s, i) => (
          <View key={s.id} style={styles.stepRow}>
            <View style={styles.timeline}>
              <View style={styles.stepIcon}>
                <Text style={styles.stepEmoji}>{s.icon}</Text>
              </View>
              {i < steps.length - 1 && <View style={styles.line} />}
            </View>
            <View style={styles.stepCard}>
              <View style={styles.stepHeader}>
                <Text style={styles.stepName}>{s.product_name}</Text>
                <Text style={styles.stepNum}>{lang === 'fr' ? `Étape ${s.step_order}` : `Step ${s.step_order}`}</Text>
              </View>
              <Text style={styles.stepBrand}>{s.brand} · {s.duration}</Text>
            </View>
            <TouchableOpacity onPress={() => deleteStep(s.id)} style={styles.deleteBtn}>
              <Text style={styles.deleteBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
        ))
      )}

      <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)}>
        <Text style={styles.addText}>{t.routine.add_step}</Text>
      </TouchableOpacity>

      {steps.length > 0 && (
        <View style={styles.shareBox}>
          <Text style={styles.shareTitle}>{t.routine.share_title}</Text>
          <Text style={styles.shareSub}>{t.routine.share_sub}</Text>
          <TouchableOpacity style={styles.shareBtn}>
            <Text style={styles.shareBtnText}>{t.routine.share_btn}</Text>
          </TouchableOpacity>
        </View>
      )}

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalScroll} keyboardShouldPersistTaps="handled">
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{t.routine.new_step}</Text>
              <Text style={styles.fieldLabel}>{t.routine.product_name}</Text>
              <TextInput style={styles.input} placeholder={lang === 'fr' ? 'ex: Toleriane Double Repair' : 'ex: CeraVe Moisturizing Cream'} placeholderTextColor={T.textSoft} value={productName} onChangeText={setProductName} autoCorrect={false} blurOnSubmit={false} />
              <Text style={styles.fieldLabel}>{t.routine.brand}</Text>
              <TextInput style={styles.input} placeholder={lang === 'fr' ? 'ex: La Roche-Posay' : 'ex: CeraVe'} placeholderTextColor={T.textSoft} value={brand} onChangeText={setBrand} autoCorrect={false} blurOnSubmit={false} />
              <Text style={styles.fieldLabel}>{t.routine.duration}</Text>
              <View style={styles.durationRow}>
                {['30s', '60s', '90s', '2min'].map(d => (
                  <TouchableOpacity key={d} onPress={() => setDuration(d)} style={[styles.durationChip, duration === d && styles.durationChipActive]}>
                    <Text style={[styles.durationChipText, duration === d && styles.durationChipTextActive]}>{d}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.modalBtns}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)}>
                  <Text style={styles.cancelBtnText}>{lang === 'fr' ? 'Annuler' : 'Cancel'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={addStep} disabled={saving}>
                  <Text style={styles.saveBtnText}>{saving ? '...' : lang === 'fr' ? 'Ajouter ✓' : 'Add ✓'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg, padding: 20 },
  header: { paddingTop: 60, paddingBottom: 20 },
  title: { fontSize: 26, fontWeight: '700', color: T.text },
  tabs: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  tab: { flex: 1, padding: 12, borderRadius: 14, backgroundColor: T.surface, alignItems: 'center', borderWidth: 1, borderColor: T.border },
  tabActive: { backgroundColor: T.accent, borderColor: T.accent },
  tabText: { fontSize: 13, fontWeight: '600', color: T.textSoft },
  tabTextActive: { color: '#1A1208' },
  loading: { textAlign: 'center', color: T.textSoft, marginTop: 40 },
  empty: { alignItems: 'center', paddingTop: 40, paddingBottom: 20 },
  emptyIcon: { fontSize: 44, marginBottom: 10 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: T.text, marginBottom: 6 },
  emptySub: { fontSize: 13, color: T.textSoft },
  stepRow: { flexDirection: 'row', gap: 14, marginBottom: 4, alignItems: 'flex-start' },
  timeline: { alignItems: 'center', width: 44 },
  stepIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: T.surface, borderWidth: 1, borderColor: T.border, alignItems: 'center', justifyContent: 'center' },
  stepEmoji: { fontSize: 22 },
  line: { width: 2, flex: 1, backgroundColor: T.border, marginVertical: 4, minHeight: 20 },
  stepCard: { flex: 1, backgroundColor: T.surface, borderRadius: 14, padding: 12, marginBottom: 4, borderWidth: 1, borderColor: T.border },
  stepHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  stepName: { fontSize: 13, fontWeight: '700', color: T.text, flex: 1 },
  stepNum: { fontSize: 10, color: T.accent, fontWeight: '600', backgroundColor: 'rgba(201,169,110,0.12)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  stepBrand: { fontSize: 11, color: T.textSoft },
  deleteBtn: { padding: 8, justifyContent: 'center' },
  deleteBtnText: { fontSize: 14, color: T.textSoft },
  addBtn: { borderWidth: 1.5, borderColor: T.border, borderStyle: 'dashed', borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 8, marginBottom: 16 },
  addText: { fontSize: 14, color: T.textSoft },
  shareBox: { backgroundColor: 'rgba(232,127,172,0.08)', borderRadius: 18, padding: 18, marginBottom: 40, borderWidth: 1, borderColor: 'rgba(232,127,172,0.2)' },
  shareTitle: { fontSize: 14, fontWeight: '600', color: T.text, marginBottom: 4 },
  shareSub: { fontSize: 12, color: T.textSoft, marginBottom: 14 },
  shareBtn: { backgroundColor: T.rose, borderRadius: 12, padding: 12, alignItems: 'center' },
  shareBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  center: { flex: 1, backgroundColor: T.bg, alignItems: 'center', justifyContent: 'center', padding: 40 },
  centerIcon: { fontSize: 48, marginBottom: 12 },
  centerTitle: { fontSize: 20, fontWeight: '700', color: T.text, marginBottom: 8 },
  centerSub: { fontSize: 13, color: T.textSoft, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalScroll: { maxHeight: '90%' as any },
  modalContent: { backgroundColor: T.surface, borderRadius: 24, padding: 24, paddingBottom: 40, borderWidth: 1, borderColor: T.border },
  modalTitle: { fontSize: 20, fontWeight: '700', color: T.text, marginBottom: 20 },
  fieldLabel: { fontSize: 12, color: T.textSoft, marginBottom: 6, fontWeight: '500' },
  input: { backgroundColor: T.bg, borderRadius: 12, padding: 14, color: T.text, fontSize: 14, borderWidth: 1, borderColor: T.border, marginBottom: 14 },
  durationRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  durationChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: T.bg, borderWidth: 1, borderColor: T.border },
  durationChipActive: { backgroundColor: T.accent, borderColor: T.accent },
  durationChipText: { fontSize: 12, color: T.textSoft },
  durationChipTextActive: { color: '#1A1208', fontWeight: '700' },
  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 8 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: T.border, alignItems: 'center' },
  cancelBtnText: { fontSize: 14, color: T.textSoft },
  saveBtn: { flex: 2, padding: 14, borderRadius: 12, backgroundColor: T.accent, alignItems: 'center' },
  saveBtnText: { fontSize: 14, fontWeight: '700', color: '#1A1208' },
});