import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTranslation } from '../../hooks/useTranslation';
import { supabase } from '../../lib/supabase';

const T = {
  bg: '#08080E', surface: '#11111A', border: '#1C1C2E',
  accent: '#C9A96E', rose: '#E87FAC', text: '#F5F0F8',
  textMid: '#B8B0C4', textSoft: '#6B6278',
};

type Entry = {
  id: string; user_id: string; photo_url: string;
  notes: string; week_number: number; created_at: string;
};

export default function JournalScreen() {
  const { t, lang } = useTranslation();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user;
      setUser(u || null);
      if (u) loadEntries(u.id);
      else setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user;
      setUser(u || null);
      if (u) loadEntries(u.id);
      else setLoading(false);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const loadEntries = async (userId: string) => {
    const { data } = await supabase.from('skin_journal').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (data) setEntries(data);
    setLoading(false);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.8,
    });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const uploadPhoto = async (uri: string, userId: string): Promise<string | null> => {
    try {
      setUploading(true);
      const response = await fetch(uri);
      const blob = await response.blob();
      const fileName = `${userId}/${Date.now()}.jpg`;
      const { error } = await supabase.storage.from('skin-journal').upload(fileName, blob, { contentType: 'image/jpeg' });
      if (error) return null;
      const { data } = supabase.storage.from('skin-journal').getPublicUrl(fileName);
      return data.publicUrl;
    } catch { return null; }
    finally { setUploading(false); }
  };

  const addEntry = async () => {
    if (!imageUri) { window.alert(lang === 'fr' ? 'Veuillez ajouter une photo' : 'Please add a photo'); return; }
    if (!user) return;
    setSaving(true);
    const photoUrl = await uploadPhoto(imageUri, user.id);
    if (!photoUrl) { window.alert('Erreur upload'); setSaving(false); return; }
    const { error } = await supabase.from('skin_journal').insert({
      user_id: user.id, photo_url: photoUrl,
      notes: notes.trim(), week_number: entries.length + 1,
    });
    if (error) { window.alert('Erreur: ' + error.message); }
    else { setShowModal(false); setImageUri(null); setNotes(''); loadEntries(user.id); }
    setSaving(false);
  };

  const deleteEntry = async (id: string) => {
    const confirmed = window.confirm(lang === 'fr' ? 'Supprimer cette entrée?' : 'Delete this entry?');
    if (confirmed) {
      await supabase.from('skin_journal').delete().eq('id', id);
      if (user) loadEntries(user.id);
    }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' });

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
        <Text style={styles.title}>{t.journal.title}</Text>
        <Text style={styles.sub}>{t.journal.sub}</Text>
      </View>

      <View style={styles.progressCard}>
        <Text style={styles.progressLabel}>{t.journal.progress}</Text>
        <View style={styles.progressRow}>
          <View style={styles.progressStat}>
            <Text style={styles.progressVal}>{entries.length}</Text>
            <Text style={styles.progressStatLabel}>{t.journal.photos}</Text>
          </View>
          <View style={styles.progressDivider} />
          <View style={styles.progressStat}>
            <Text style={styles.progressVal}>{entries.length > 0 ? `S${entries.length}` : 'S0'}</Text>
            <Text style={styles.progressStatLabel}>{t.journal.week}</Text>
          </View>
          <View style={styles.progressDivider} />
          <View style={styles.progressStat}>
            <Text style={styles.progressVal}>{entries.length >= 2 ? '✓' : '—'}</Text>
            <Text style={styles.progressStatLabel}>{t.journal.comparison}</Text>
          </View>
        </View>
        {entries.length >= 2 && (
          <TouchableOpacity style={styles.compareBtn} onPress={() => setShowCompare(true)}>
            <Text style={styles.compareBtnText}>{t.journal.see_evolution}</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)}>
        <Text style={styles.addBtnIcon}>📷</Text>
        <Text style={styles.addBtnText}>{t.journal.add_btn}</Text>
        <Text style={styles.addBtnSub}>{t.journal.week} {entries.length + 1}</Text>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator color={T.accent} style={{ marginTop: 20 }} />
      ) : entries.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🌸</Text>
          <Text style={styles.emptyTitle}>{t.journal.empty_title}</Text>
          <Text style={styles.emptySub}>{t.journal.empty_sub}</Text>
        </View>
      ) : (
        <View>
          <Text style={styles.sectionLabel}>{t.journal.your_photos}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoStrip}>
            {entries.map((e) => (
              <TouchableOpacity key={e.id} onLongPress={() => deleteEntry(e.id)} style={styles.photoItem}>
                <Image source={{ uri: e.photo_url }} style={styles.photo} />
                <View style={styles.photoLabel}>
                  <Text style={styles.photoWeek}>S{e.week_number}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <Text style={styles.sectionLabel}>{t.journal.history}</Text>
          {entries.map(e => (
            <View key={e.id} style={styles.entryCard}>
              <Image source={{ uri: e.photo_url }} style={styles.entryPhoto} />
              <View style={styles.entryInfo}>
                <Text style={styles.entryWeek}>{t.journal.week} {e.week_number}</Text>
                <Text style={styles.entryDate}>{formatDate(e.created_at)}</Text>
                {e.notes ? <Text style={styles.entryNotes}>{e.notes}</Text> : null}
              </View>
              <TouchableOpacity onPress={() => deleteEntry(e.id)}>
                <Text style={styles.deleteText}>🗑</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <View style={{ height: 40 }} />

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalScroll} keyboardShouldPersistTaps="handled">
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{t.journal.week} {entries.length + 1} 📸</Text>
              <Text style={styles.modalSub}>{t.journal.modal_sub}</Text>
              <TouchableOpacity onPress={pickImage} style={styles.photoPickerBtn}>
                {imageUri ? (
                  <Image source={{ uri: imageUri }} style={styles.photoPreview} />
                ) : (
                  <View style={styles.photoPickerPlaceholder}>
                    <Text style={styles.photoPickerIcon}>📷</Text>
                    <Text style={styles.photoPickerText}>{lang === 'fr' ? 'Prendre ou choisir une photo' : 'Take or choose a photo'}</Text>
                    <Text style={styles.photoPickerHint}>{t.journal.modal_sub}</Text>
                  </View>
                )}
              </TouchableOpacity>
              <Text style={styles.fieldLabel}>{t.journal.notes}</Text>
              <TextInput style={[styles.input, { height: 80 }]} placeholder={lang === 'fr' ? 'Comment va votre peau cette semaine?' : 'How is your skin this week?'} placeholderTextColor={T.textSoft} value={notes} onChangeText={setNotes} multiline blurOnSubmit={false} />
              <View style={styles.modalBtns}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowModal(false); setImageUri(null); setNotes(''); }}>
                  <Text style={styles.cancelBtnText}>{lang === 'fr' ? 'Annuler' : 'Cancel'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={addEntry} disabled={saving || uploading}>
                  <Text style={styles.saveBtnText}>{uploading ? 'Upload...' : saving ? '...' : t.journal.save}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={showCompare} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t.journal.evolution_title}</Text>
            {entries.length >= 2 && (
              <View style={styles.compareRow}>
                <View style={styles.compareItem}>
                  <Image source={{ uri: entries[entries.length-1].photo_url }} style={styles.comparePhoto} />
                  <Text style={styles.compareLabel}>{t.journal.week} {entries[entries.length-1].week_number}</Text>
                  <Text style={styles.compareDate}>{formatDate(entries[entries.length-1].created_at)}</Text>
                </View>
                <View style={styles.compareArrow}>
                  <Text style={styles.compareArrowText}>→</Text>
                </View>
                <View style={styles.compareItem}>
                  <Image source={{ uri: entries[0].photo_url }} style={styles.comparePhoto} />
                  <Text style={styles.compareLabel}>{t.journal.week} {entries[0].week_number}</Text>
                  <Text style={styles.compareDate}>{formatDate(entries[0].created_at)}</Text>
                </View>
              </View>
            )}
            <Text style={styles.compareMessage}>
              {entries.length} {lang === 'fr' ? 'semaines de suivi' : 'weeks of tracking'} ✨
            </Text>
            <TouchableOpacity style={styles.saveBtn} onPress={() => setShowCompare(false)}>
              <Text style={styles.saveBtnText}>{lang === 'fr' ? 'Fermer' : 'Close'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg, padding: 20 },
  header: { paddingTop: 60, paddingBottom: 20 },
  title: { fontSize: 26, fontWeight: '700', color: T.text, marginBottom: 4 },
  sub: { fontSize: 12, color: T.textSoft },
  progressCard: { backgroundColor: T.surface, borderRadius: 18, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: T.border },
  progressLabel: { fontSize: 10, color: T.textSoft, letterSpacing: 2, marginBottom: 14 },
  progressRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  progressStat: { alignItems: 'center' },
  progressVal: { fontSize: 28, fontWeight: '700', color: T.accent, marginBottom: 4 },
  progressStatLabel: { fontSize: 10, color: T.textSoft },
  progressDivider: { width: 1, height: 40, backgroundColor: T.border },
  compareBtn: { marginTop: 16, backgroundColor: 'rgba(201,169,110,0.12)', borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(201,169,110,0.2)' },
  compareBtnText: { fontSize: 13, color: T.accent, fontWeight: '600' },
  addBtn: { backgroundColor: T.surface, borderRadius: 18, padding: 20, marginBottom: 24, borderWidth: 1.5, borderColor: T.accent, borderStyle: 'dashed', alignItems: 'center' },
  addBtnIcon: { fontSize: 36, marginBottom: 8 },
  addBtnText: { fontSize: 14, fontWeight: '600', color: T.text, marginBottom: 4 },
  addBtnSub: { fontSize: 12, color: T.accent },
  sectionLabel: { fontSize: 10, color: T.textSoft, letterSpacing: 2, marginBottom: 12, marginTop: 8 },
  photoStrip: { marginBottom: 24 },
  photoItem: { marginRight: 12, position: 'relative' },
  photo: { width: 90, height: 90, borderRadius: 14, borderWidth: 2, borderColor: T.border },
  photoLabel: { position: 'absolute', bottom: 6, left: 6, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  photoWeek: { fontSize: 10, color: '#fff', fontWeight: '700' },
  entryCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: T.surface, borderRadius: 14, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: T.border, gap: 12 },
  entryPhoto: { width: 60, height: 60, borderRadius: 10 },
  entryInfo: { flex: 1 },
  entryWeek: { fontSize: 13, fontWeight: '700', color: T.text, marginBottom: 2 },
  entryDate: { fontSize: 11, color: T.textSoft, marginBottom: 4 },
  entryNotes: { fontSize: 11, color: T.textMid, fontStyle: 'italic' },
  deleteText: { fontSize: 16 },
  empty: { alignItems: 'center', paddingTop: 40, paddingBottom: 20 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: T.text, marginBottom: 8 },
  emptySub: { fontSize: 13, color: T.textSoft, textAlign: 'center', lineHeight: 20 },
  center: { flex: 1, backgroundColor: T.bg, alignItems: 'center', justifyContent: 'center', padding: 40 },
  centerIcon: { fontSize: 48, marginBottom: 12 },
  centerTitle: { fontSize: 20, fontWeight: '700', color: T.text, marginBottom: 8 },
  centerSub: { fontSize: 13, color: T.textSoft, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalScroll: { maxHeight: '90%' as any },
  modalContent: { backgroundColor: T.surface, borderRadius: 24, padding: 24, paddingBottom: 40, borderWidth: 1, borderColor: T.border },
  modalTitle: { fontSize: 20, fontWeight: '700', color: T.text, marginBottom: 8 },
  modalSub: { fontSize: 12, color: T.textSoft, marginBottom: 20, lineHeight: 18 },
  photoPickerBtn: { marginBottom: 16 },
  photoPreview: { width: '100%', height: 200, borderRadius: 16 },
  photoPickerPlaceholder: { width: '100%', height: 160, borderRadius: 16, backgroundColor: T.bg, borderWidth: 1.5, borderColor: T.border, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 8 },
  photoPickerIcon: { fontSize: 40 },
  photoPickerText: { fontSize: 14, color: T.textMid, fontWeight: '600' },
  photoPickerHint: { fontSize: 11, color: T.textSoft },
  fieldLabel: { fontSize: 12, color: T.textSoft, marginBottom: 6, fontWeight: '500' },
  input: { backgroundColor: T.bg, borderRadius: 12, padding: 14, color: T.text, fontSize: 14, borderWidth: 1, borderColor: T.border, marginBottom: 14 },
  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 8 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: T.border, alignItems: 'center' },
  cancelBtnText: { fontSize: 14, color: T.textSoft },
  saveBtn: { flex: 2, padding: 14, borderRadius: 12, backgroundColor: T.accent, alignItems: 'center' },
  saveBtnText: { fontSize: 14, fontWeight: '700', color: '#1A1208' },
  compareRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  compareItem: { alignItems: 'center', flex: 1 },
  comparePhoto: { width: 120, height: 120, borderRadius: 16, marginBottom: 8 },
  compareLabel: { fontSize: 13, fontWeight: '700', color: T.text },
  compareDate: { fontSize: 10, color: T.textSoft },
  compareArrow: { paddingHorizontal: 10 },
  compareArrowText: { fontSize: 24, color: T.accent },
  compareMessage: { fontSize: 13, color: T.textSoft, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
});