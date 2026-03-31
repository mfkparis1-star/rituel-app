import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTranslation } from '../../hooks/useTranslation';
import { supabase } from '../../lib/supabase';

const T = {
  bg: '#08080E', surface: '#11111A', border: '#1C1C2E',
  accent: '#C9A96E', rose: '#E87FAC', text: '#F5F0F8',
  textMid: '#B8B0C4', textSoft: '#6B6278',
};

const SKIN_TYPES_FR = ['Sèche', 'Grasse', 'Mixte', 'Normale', 'Sensible'];
const SKIN_TYPES_EN = ['Dry', 'Oily', 'Combination', 'Normal', 'Sensitive'];
const SKIN_IDS = ['dry', 'oily', 'combination', 'normal', 'sensitive'];

export default function AuthScreen() {
  const { t, lang } = useTranslation();
  const [mode, setMode] = useState<'login' | 'register' | 'reset' | 'profile' | 'editProfile'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [editName, setEditName] = useState('');
  const [editSkin, setEditSkin] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const SKIN_LABELS = lang === 'fr' ? SKIN_TYPES_FR : SKIN_TYPES_EN;

  const MENU_ITEMS = [
    { icon: '✦', label: t.routine.title, route: '/routine', desc: lang === 'fr' ? 'Gérer ma routine matin & soir' : 'Manage my morning & evening routine' },
    { icon: '📸', label: t.journal.title, route: '/journal', desc: lang === 'fr' ? 'Suivre l\'évolution de ma peau' : 'Track my skin\'s evolution' },
    { icon: '🧪', label: t.compatibility.title, route: '/compatibility', desc: lang === 'fr' ? 'Tester mes ingrédients' : 'Test my ingredients' },
    { icon: '📷', label: t.scanner.title, route: '/scanner', desc: lang === 'fr' ? 'Scanner un produit' : 'Scan a product' },
  ];

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        const u = data.session.user;
        setLoggedIn(true); setUserEmail(u.email || '');
        setUserId(u.id); setMode('profile'); loadProfile(u.id);
      }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const u = session.user;
        setLoggedIn(true); setUserEmail(u.email || '');
        setUserId(u.id); loadProfile(u.id);
      } else {
        setLoggedIn(false); setUserEmail(''); setUserId('');
        setProfile(null); setMode('login');
      }
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const loadProfile = async (id: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', id).single();
    if (data) { setProfile(data); setEditName(data.full_name || ''); setEditSkin(data.skin_type || ''); setAvatarUri(data.avatar_url || null); }
  };

  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.7 });
    if (!result.canceled) setAvatarUri(result.assets[0].uri);
  };

  const uploadAvatar = async (uri: string, uid: string): Promise<string | null> => {
    try {
      setUploading(true);
      const response = await fetch(uri);
      const blob = await response.blob();
      const fileExt = uri.split('.').pop() || 'jpg';
      const fileName = `${uid}/avatar.${fileExt}`;
      const { error } = await supabase.storage.from('avatars').upload(fileName, blob, { contentType: `image/${fileExt}`, upsert: true });
      if (error) return null;
      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
      return data.publicUrl + '?t=' + Date.now();
    } catch { return null; }
    finally { setUploading(false); }
  };

  const handleAuth = async () => {
    if (!email || !password) { window.alert(lang === 'fr' ? 'Veuillez remplir tous les champs' : 'Please fill in all fields'); return; }
    setLoading(true);
    try {
      if (mode === 'register') {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.user) {
          await supabase.from('profiles').upsert({ id: data.user.id, email, full_name: name, referral_code: 'RITUEL-' + Math.random().toString(36).slice(2,8).toUpperCase() });
          window.alert(lang === 'fr' ? 'Compte créé! Connectez-vous.' : 'Account created! Sign in now.');
          setMode('login');
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.user) { setLoggedIn(true); setUserEmail(data.user.email || ''); setUserId(data.user.id); setMode('profile'); loadProfile(data.user.id); }
      }
    } catch (e: any) { window.alert('Erreur: ' + e.message); }
    finally { setLoading(false); }
  };

  const handleReset = async () => {
    if (!email) { window.alert(lang === 'fr' ? 'Entrez votre email' : 'Enter your email'); return; }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) { window.alert('Erreur: ' + error.message); }
    else { setResetSent(true); }
    setLoading(false);
  };

  const handleSaveProfile = async () => {
    if (!userId) return;
    setSaving(true);
    let avatarUrl = profile?.avatar_url || null;
    if (avatarUri && !avatarUri.startsWith('http')) avatarUrl = await uploadAvatar(avatarUri, userId);
    const { error } = await supabase.from('profiles').upsert({ id: userId, full_name: editName, skin_type: editSkin, avatar_url: avatarUrl });
    if (error) { window.alert('Erreur: ' + error.message); }
    else { window.alert(lang === 'fr' ? 'Profil mis à jour! ✓' : 'Profile updated! ✓'); loadProfile(userId); setMode('profile'); }
    setSaving(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setLoggedIn(false); setUserEmail(''); setUserId(''); setProfile(null); setMode('login');
  };

  const getSkinLabel = (id: string) => {
    const idx = SKIN_IDS.indexOf(id);
    return idx >= 0 ? SKIN_LABELS[idx] : id;
  };

  if (loggedIn && mode === 'profile') return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.logoText}>✦ rituel</Text>
      <View style={styles.profileCard}>
        <TouchableOpacity onPress={() => setMode('editProfile')} style={styles.avatarWrapper}>
          {profile?.avatar_url ? <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} /> : (
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{(profile?.full_name || userEmail).charAt(0).toUpperCase()}</Text>
            </View>
          )}
          <View style={styles.avatarEditBadge}><Text style={styles.avatarEditBadgeText}>📷</Text></View>
        </TouchableOpacity>
        <Text style={styles.profileName}>{profile?.full_name || userEmail.split('@')[0]}</Text>
        <Text style={styles.profileEmail}>{userEmail}</Text>
        {profile?.skin_type && (
          <View style={styles.skinBadge}>
            <Text style={styles.skinBadgeText}>{lang === 'fr' ? `Peau ${getSkinLabel(profile.skin_type)}` : `${getSkinLabel(profile.skin_type)} skin`}</Text>
          </View>
        )}
        {profile?.referral_code && (
          <View style={styles.codeBox}>
            <Text style={styles.codeLabel}>{lang === 'fr' ? 'Code d\'invitation' : 'Invite code'}</Text>
            <Text style={styles.code}>{profile.referral_code}</Text>
          </View>
        )}
      </View>

      <Text style={styles.sectionLabel}>{t.auth.tools}</Text>
      <View style={styles.menuGrid}>
        {MENU_ITEMS.map((item) => (
          <TouchableOpacity key={item.route} onPress={() => router.push(item.route as any)} style={styles.menuItem}>
            <Text style={styles.menuIcon}>{item.icon}</Text>
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Text style={styles.menuDesc}>{item.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.editBtn} onPress={() => setMode('editProfile')}>
        <Text style={styles.editBtnText}>{t.auth.edit_profile}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>{t.auth.logout}</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  if (loggedIn && mode === 'editProfile') return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.logoText}>✦ rituel</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t.auth.edit_profile}</Text>
        <TouchableOpacity onPress={pickAvatar} style={styles.avatarPicker}>
          {avatarUri ? <Image source={{ uri: avatarUri }} style={styles.avatarPickerImage} /> : (
            <View style={styles.avatarPickerPlaceholder}>
              <Text style={styles.avatarPickerIcon}>📷</Text>
              <Text style={styles.avatarPickerText}>{lang === 'fr' ? 'Changer la photo' : 'Change photo'}</Text>
            </View>
          )}
        </TouchableOpacity>
        <Text style={styles.fieldLabel}>{t.auth.firstname}</Text>
        <TextInput style={styles.input} placeholder={lang === 'fr' ? 'Votre prénom' : 'Your first name'} placeholderTextColor={T.textSoft} value={editName} onChangeText={setEditName} autoCorrect={false} blurOnSubmit={false} />
        <Text style={styles.fieldLabel}>{t.auth.skin_type}</Text>
        <View style={styles.skinRow}>
          {SKIN_IDS.map((id, i) => (
            <TouchableOpacity key={id} onPress={() => setEditSkin(id)} style={[styles.skinChip, editSkin===id && styles.skinChipActive]}>
              <Text style={[styles.skinChipText, editSkin===id && styles.skinChipTextActive]}>{SKIN_LABELS[i]}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.modalBtns}>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => setMode('profile')}>
            <Text style={styles.cancelBtnText}>{lang === 'fr' ? 'Annuler' : 'Cancel'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile} disabled={saving || uploading}>
            <Text style={styles.saveBtnText}>{uploading ? 'Upload...' : saving ? '...' : t.auth.save}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  if (mode === 'reset') return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.logo}>
        <Text style={styles.logoText}>✦ rituel</Text>
        <Text style={styles.logoSub}>{t.auth.reset_title}</Text>
      </View>
      {resetSent ? (
        <View style={styles.card}>
          <Text style={styles.successIcon}>📧</Text>
          <Text style={styles.successTitle}>{t.auth.reset_sent_title}</Text>
          <Text style={styles.successSub}>{t.auth.reset_sent_sub}</Text>
          <TouchableOpacity style={styles.btn} onPress={() => { setMode('login'); setResetSent(false); }}>
            <Text style={styles.btnText}>{lang === 'fr' ? 'Retour à la connexion' : 'Back to sign in'}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>{t.auth.email}</Text>
          <TextInput style={styles.input} placeholder="email@example.com" placeholderTextColor={T.textSoft} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoCorrect={false} blurOnSubmit={false} />
          <TouchableOpacity style={styles.btn} onPress={handleReset} disabled={loading}>
            <Text style={styles.btnText}>{loading ? '...' : t.auth.reset_send}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkBtn} onPress={() => setMode('login')}>
            <Text style={styles.linkBtnText}>{lang === 'fr' ? '← Retour' : '← Back'}</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.logo}>
        <Text style={styles.logoText}>✦ rituel</Text>
        <Text style={styles.logoSub}>{lang === 'fr' ? 'Votre archive beauté personnelle' : 'Your personal beauty archive'}</Text>
      </View>
      <View style={styles.card}>
        <View style={styles.tabs}>
          {(['login', 'register'] as const).map(m => (
            <TouchableOpacity key={m} onPress={() => setMode(m)} style={[styles.tab, mode===m && styles.tabActive]}>
              <Text style={[styles.tabText, mode===m && styles.tabTextActive]}>
                {m === 'login' ? t.auth.login : t.auth.register}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {mode === 'register' && (
          <View style={styles.fieldBox}>
            <Text style={styles.fieldLabel}>{t.auth.firstname}</Text>
            <TextInput style={styles.input} placeholder="Sophie" placeholderTextColor={T.textSoft} value={name} onChangeText={setName} autoCapitalize="words" autoCorrect={false} blurOnSubmit={false} />
          </View>
        )}
        <View style={styles.fieldBox}>
          <Text style={styles.fieldLabel}>{t.auth.email}</Text>
          <TextInput style={styles.input} placeholder="sophie@example.com" placeholderTextColor={T.textSoft} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoCorrect={false} blurOnSubmit={false} />
        </View>
        <View style={styles.fieldBox}>
          <Text style={styles.fieldLabel}>{t.auth.password}</Text>
          <TextInput style={styles.input} placeholder="••••••••" placeholderTextColor={T.textSoft} value={password} onChangeText={setPassword} secureTextEntry blurOnSubmit={false} />
        </View>
        <TouchableOpacity style={styles.btn} onPress={handleAuth} disabled={loading}>
          <Text style={styles.btnText}>{loading ? '...' : mode === 'login' ? t.auth.connect : t.auth.signup}</Text>
        </TouchableOpacity>
        {mode === 'login' && (
          <TouchableOpacity style={styles.linkBtn} onPress={() => setMode('reset')}>
            <Text style={styles.linkBtnText}>{t.auth.forgot}</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  content: { padding: 24, paddingTop: 80, paddingBottom: 40 },
  logo: { alignItems: 'center', marginBottom: 40 },
  logoText: { fontSize: 36, fontWeight: '700', color: T.accent, marginBottom: 8, textAlign: 'center' },
  logoSub: { fontSize: 14, color: T.textSoft, textAlign: 'center' },
  card: { backgroundColor: T.surface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: T.border },
  cardTitle: { fontSize: 20, fontWeight: '700', color: T.text, marginBottom: 20 },
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  tab: { flex: 1, padding: 10, borderRadius: 12, backgroundColor: T.bg, alignItems: 'center', borderWidth: 1, borderColor: T.border },
  tabActive: { backgroundColor: T.accent, borderColor: T.accent },
  tabText: { fontSize: 13, fontWeight: '600', color: T.textSoft },
  tabTextActive: { color: '#1A1208' },
  fieldBox: { marginBottom: 16 },
  fieldLabel: { fontSize: 12, color: T.textSoft, marginBottom: 6, fontWeight: '500' },
  input: { backgroundColor: T.bg, borderRadius: 12, padding: 14, color: T.text, fontSize: 14, borderWidth: 1, borderColor: T.border, marginBottom: 14 },
  btn: { backgroundColor: T.accent, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 8 },
  btnText: { fontSize: 15, fontWeight: '700', color: '#1A1208' },
  linkBtn: { alignItems: 'center', marginTop: 14 },
  linkBtnText: { fontSize: 13, color: T.textSoft },
  profileCard: { backgroundColor: T.surface, borderRadius: 20, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: T.border, marginBottom: 20 },
  avatarWrapper: { position: 'relative', marginBottom: 12 },
  avatarImage: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: T.accent },
  avatarCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(201,169,110,0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: T.accent },
  avatarText: { fontSize: 36, fontWeight: '700', color: T.accent },
  avatarEditBadge: { position: 'absolute', bottom: 0, right: -4, backgroundColor: T.accent, borderRadius: 10, width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },
  avatarEditBadgeText: { fontSize: 12 },
  profileName: { fontSize: 20, fontWeight: '700', color: T.text, marginBottom: 4 },
  profileEmail: { fontSize: 13, color: T.textSoft, marginBottom: 12 },
  skinBadge: { backgroundColor: 'rgba(201,169,110,0.12)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(201,169,110,0.2)', marginBottom: 14 },
  skinBadgeText: { fontSize: 12, color: T.accent, fontWeight: '600' },
  codeBox: { backgroundColor: T.bg, borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: T.border, width: '100%' },
  codeLabel: { fontSize: 10, color: T.textSoft, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 },
  code: { fontSize: 14, color: T.accent, fontWeight: '700', letterSpacing: 2 },
  sectionLabel: { fontSize: 10, color: T.textSoft, letterSpacing: 2, marginBottom: 12 },
  menuGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  menuItem: { backgroundColor: T.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: T.border, width: '47%' },
  menuIcon: { fontSize: 24, marginBottom: 8 },
  menuLabel: { fontSize: 13, fontWeight: '700', color: T.text, marginBottom: 4 },
  menuDesc: { fontSize: 11, color: T.textSoft, lineHeight: 16 },
  editBtn: { backgroundColor: 'rgba(201,169,110,0.12)', borderRadius: 14, padding: 14, alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: 'rgba(201,169,110,0.2)' },
  editBtnText: { fontSize: 14, color: T.accent, fontWeight: '600' },
  logoutBtn: { borderWidth: 1, borderColor: T.border, borderRadius: 14, padding: 14, alignItems: 'center' },
  logoutText: { fontSize: 14, color: T.textSoft },
  avatarPicker: { alignItems: 'center', marginBottom: 20 },
  avatarPickerImage: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: T.accent },
  avatarPickerPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: T.bg, borderWidth: 1.5, borderColor: T.border, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  avatarPickerIcon: { fontSize: 28, marginBottom: 4 },
  avatarPickerText: { fontSize: 10, color: T.textSoft, textAlign: 'center' },
  skinRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  skinChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: T.bg, borderWidth: 1, borderColor: T.border },
  skinChipActive: { backgroundColor: T.accent, borderColor: T.accent },
  skinChipText: { fontSize: 12, color: T.textSoft, fontWeight: '500' },
  skinChipTextActive: { color: '#1A1208', fontWeight: '700' },
  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 8 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: T.border, alignItems: 'center' },
  cancelBtnText: { fontSize: 14, color: T.textSoft },
  saveBtn: { flex: 2, padding: 14, borderRadius: 12, backgroundColor: T.accent, alignItems: 'center' },
  saveBtnText: { fontSize: 14, fontWeight: '700', color: '#1A1208' },
  successIcon: { fontSize: 44, textAlign: 'center', marginBottom: 12 },
  successTitle: { fontSize: 20, fontWeight: '700', color: T.text, textAlign: 'center', marginBottom: 8 },
  successSub: { fontSize: 13, color: T.textSoft, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
});