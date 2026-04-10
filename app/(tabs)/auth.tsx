import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTranslation } from '../../hooks/useTranslation';
import { supabase } from '../../lib/supabase';

const T = {
  bg: '#FDF8F5', bg2: '#F5EDE6', accent: '#B8856A', accent2: '#8C5E46',
  dark: '#1A1310', mid: '#6B5245', light: '#E8D5C8', white: '#FFFFFF',
  green: '#5B9B6B',
};

const SKIN_TYPES_FR = ['Sèche', 'Grasse', 'Mixte', 'Normale', 'Sensible'];
const SKIN_TYPES_EN = ['Dry', 'Oily', 'Combination', 'Normal', 'Sensitive'];
const SKIN_TYPES_TR = ['Kuru', 'Yağlı', 'Karma', 'Normal', 'Hassas'];
const SKIN_IDS = ['dry', 'oily', 'combination', 'normal', 'sensitive'];

WebBrowser.maybeCompleteAuthSession();

export default function AuthScreen() {
  const { t, lang } = useTranslation();
  const [mode, setMode] = useState<'login' | 'register' | 'reset' | 'profile' | 'editProfile' | 'deleteAccount'>('login');
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
  const [avatarBase64, setAvatarBase64] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);

  const SKIN_LABELS = lang === 'tr' ? SKIN_TYPES_TR : lang === 'fr' ? SKIN_TYPES_FR : SKIN_TYPES_EN;
  const lbl = (fr: string, tr: string, en: string) => lang === 'fr' ? fr : lang === 'tr' ? tr : en;

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
        setMode('profile');
      } else {
        setLoggedIn(false); setUserEmail(''); setUserId('');
        setProfile(null); setMode('login');
      }
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const loadProfile = async (id: string) => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
    if (error && error.code !== 'PGRST116') { console.warn('loadProfile error:', error.message); return; }
    if (data) { setProfile(data); setEditName(data.full_name || ''); setEditSkin(data.skin_type || ''); setAvatarUri(data.avatar_url || null); }
  };

  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.6, base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
      setAvatarBase64(result.assets[0].base64 ? `data:image/jpeg;base64,${result.assets[0].base64}` : null);
    }
  };

  const uploadAvatar = async (base64: string, uid: string): Promise<string | null> => {
    try {
      setUploading(true);
      const fileName = `${uid}/avatar.jpg`;
      const base64Data = base64.replace(/^data:image\/\w+;base64,/, '');
      const byteArray = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      const { error } = await supabase.storage.from('avatars').upload(fileName, byteArray, { contentType: 'image/jpeg', upsert: true });
      if (error) { console.warn('uploadAvatar error:', error.message); return null; }
      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
      return data.publicUrl + '?t=' + Date.now();
    } catch (e) { console.warn('uploadAvatar exception:', e); return null; }
    finally { setUploading(false); }
  };

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('', lbl('Veuillez remplir tous les champs', 'Tüm alanları doldurun', 'Please fill in all fields'));
      return;
    }
    setLoading(true);
    try {
      if (mode === 'register') {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.user) {
          await supabase.from('profiles').upsert({ id: data.user.id, email, full_name: name, referral_code: 'RITUEL-' + Math.random().toString(36).slice(2, 8).toUpperCase() });
          Alert.alert('', lbl('Compte créé! Connectez-vous.', 'Hesap oluşturuldu! Giriş yapın.', 'Account created! Sign in now.'));
          setMode('login');
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.user) {
          setLoggedIn(true); setUserEmail(data.user.email || '');
          setUserId(data.user.id); setMode('profile'); loadProfile(data.user.id);
        }
      }
    } catch (e: any) { Alert.alert('Erreur', e.message); }
    finally { setLoading(false); }
  };

  const handleReset = async () => {
    if (!email) { Alert.alert('', lbl('Entrez votre email', 'E-posta girin', 'Enter your email')); return; }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) Alert.alert('Erreur', error.message);
    else setResetSent(true);
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: 'rituel://auth/callback', skipBrowserRedirect: true },
      });
      if (error) throw error;
      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, 'rituel://auth/callback');
        if (result.type === 'success' && result.url) {
          const urlObj = new URL(result.url);
          const access_token = urlObj.searchParams.get('access_token');
          const refresh_token = urlObj.searchParams.get('refresh_token');
          if (access_token && refresh_token) {
            await supabase.auth.setSession({ access_token, refresh_token });
          }
        }
      }
    } catch (e: any) { Alert.alert('Erreur', e.message); }
  };

  const handleSaveProfile = async () => {
    if (!userId) return;
    setSaving(true);
    let avatarUrl = profile?.avatar_url || null;
    if (avatarBase64) avatarUrl = await uploadAvatar(avatarBase64, userId);
    const { error } = await supabase.from('profiles').upsert({ id: userId, full_name: editName, skin_type: editSkin, avatar_url: avatarUrl });
    if (error) Alert.alert('Erreur', error.message);
    else {
      setAvatarBase64(null);
      Alert.alert('', lbl('Profil mis à jour ✓', 'Profil güncellendi ✓', 'Profile updated ✓'), [{ text: 'OK', onPress: () => { loadProfile(userId); setMode('profile'); } }]);
    }
    setSaving(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setLoggedIn(false); setUserEmail(''); setUserId(''); setProfile(null); setMode('login');
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      Alert.alert('', lbl('Entrez votre mot de passe', 'Şifrenizi girin', 'Enter your password'));
      return;
    }
    setDeleting(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: userEmail, password: deletePassword });
      if (signInError) { Alert.alert('Erreur', lbl('Mot de passe incorrect', 'Yanlış şifre', 'Incorrect password')); setDeleting(false); return; }
      await supabase.from('products').delete().eq('user_id', userId);
      await supabase.from('profiles').delete().eq('id', userId);
      await supabase.auth.signOut();
    } catch (e: any) { Alert.alert('Erreur', e.message); }
    finally { setDeleting(false); }
  };

  const getSkinLabel = (id: string) => {
    const idx = SKIN_IDS.indexOf(id);
    return idx >= 0 ? SKIN_LABELS[idx] : id;
  };

  // ── DELETE ACCOUNT ──
  if (loggedIn && mode === 'deleteAccount') return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
      <View style={s.page}>
        <Text style={s.logoSmall}>Rituel</Text>
        <View style={s.card}>
          <Text style={s.cardTitle}>{lbl('Supprimer mon compte', 'Hesabı sil', 'Delete account')}</Text>
          <Text style={s.deleteWarning}>
            {lbl('Cette action est irréversible. Toutes vos données seront supprimées.', 'Bu işlem geri alınamaz. Tüm verileriniz silinecek.', 'This is irreversible. All your data will be deleted.')}
          </Text>
          <Text style={s.fieldLabel}>{lbl('Confirmez votre mot de passe', 'Şifrenizi onaylayın', 'Confirm your password')}</Text>
          <TextInput style={s.input} placeholder="••••••••" placeholderTextColor={T.light} value={deletePassword} onChangeText={setDeletePassword} secureTextEntry />
          <TouchableOpacity style={s.deleteConfirmBtn} onPress={handleDeleteAccount} disabled={deleting}>
            <Text style={s.deleteConfirmText}>{deleting ? '...' : lbl('Supprimer définitivement', 'Kalıcı olarak sil', 'Permanently delete')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.outlineBtn} onPress={() => { setDeletePassword(''); setMode('profile'); }}>
            <Text style={s.outlineBtnText}>{lbl('Annuler', 'İptal', 'Cancel')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  // ── EDIT PROFILE ──
  if (loggedIn && mode === 'editProfile') return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
      <View style={s.page}>
        <Text style={s.logoSmall}>Rituel</Text>
        <View style={s.card}>
          <Text style={s.cardTitle}>{t.auth.edit_profile}</Text>
          <TouchableOpacity onPress={pickAvatar} style={s.avatarPicker}>
            {avatarUri
              ? <Image source={{ uri: avatarUri }} style={s.avatarPickerImg} />
              : <View style={s.avatarPickerPlaceholder}>
                  <Text style={s.avatarPickerLabel}>{lbl('Changer la photo', 'Fotoğraf değiştir', 'Change photo')}</Text>
                </View>
            }
          </TouchableOpacity>
          <Text style={s.fieldLabel}>{t.auth.firstname}</Text>
          <TextInput style={s.input} placeholder={lbl('Votre prénom', 'Adınız', 'Your name')} placeholderTextColor={T.light} value={editName} onChangeText={setEditName} autoCorrect={false} />
          <Text style={s.fieldLabel}>{t.auth.skin_type}</Text>
          <View style={s.skinRow}>
            {SKIN_IDS.map((id, i) => (
              <TouchableOpacity key={id} onPress={() => setEditSkin(id)} style={[s.skinChip, editSkin === id && s.skinChipActive]}>
                <Text style={[s.skinChipText, editSkin === id && s.skinChipTextActive]}>{SKIN_LABELS[i]}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={s.rowBtns}>
            <TouchableOpacity style={s.outlineBtn} onPress={() => setMode('profile')}>
              <Text style={s.outlineBtnText}>{lbl('Annuler', 'İptal', 'Cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.primaryBtn} onPress={handleSaveProfile} disabled={saving || uploading}>
              <Text style={s.primaryBtnText}>{uploading ? '...' : saving ? '...' : t.auth.save}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  // ── PROFILE ──
  if (loggedIn && mode === 'profile') return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
      <View style={s.page}>
        <View style={s.profileHeader}>
          <Text style={s.logoSmall}>Rituel</Text>
        </View>

        <View style={s.userCard}>
          <TouchableOpacity onPress={() => setMode('editProfile')} style={s.avatarWrap}>
            {profile?.avatar_url
              ? <Image source={{ uri: profile.avatar_url }} style={s.avatarImg} />
              : <View style={s.avatarCircle}>
                  <Text style={s.avatarLetter}>{(profile?.full_name || userEmail).charAt(0).toUpperCase()}</Text>
                </View>
            }
            <View style={s.avatarEditDot} />
          </TouchableOpacity>
          <Text style={s.profileName}>{profile?.full_name || userEmail.split('@')[0]}</Text>
          <Text style={s.profileEmail}>{userEmail}</Text>
          {profile?.skin_type && (
            <View style={s.skinBadge}>
              <Text style={s.skinBadgeText}>
                {lbl(`Peau ${getSkinLabel(profile.skin_type)}`, `${getSkinLabel(profile.skin_type)} cilt`, `${getSkinLabel(profile.skin_type)} skin`)}
              </Text>
            </View>
          )}
        </View>

        <View style={s.statsRow}>
          <View style={s.statBox}><Text style={s.statNum}>—</Text><Text style={s.statLbl}>{lbl('Produits', 'Ürünler', 'Products')}</Text></View>
          <View style={s.statBox}><Text style={s.statNum}>—</Text><Text style={s.statLbl}>{lbl('Analyses', 'Analizler', 'Analyses')}</Text></View>
          <View style={s.statBox}><Text style={s.statNum}>—</Text><Text style={s.statLbl}>{lbl('Actifs', 'Aktif', 'Active')}</Text></View>
        </View>

        <TouchableOpacity style={s.aiCard} onPress={() => router.push('/skin-analysis' as any)}>
          <Text style={s.aiCardTitle}>{lbl('Analyse IA de ma peau', 'AI Cilt Analizim', 'AI Skin Analysis')}</Text>
          <Text style={s.aiCardSub}>{lbl('Découvrez votre type de peau en 1 photo', '1 fotoğrafla cilt tipinizi öğrenin', 'Discover your skin type in 1 photo')}</Text>
        </TouchableOpacity>

        <View style={s.settingsCard}>
          <TouchableOpacity style={s.settingRow} onPress={() => setMode('editProfile')}>
            <View style={s.settingIcon}><Text style={s.settingIconText}>◎</Text></View>
            <Text style={s.settingLabel}>{t.auth.edit_profile}</Text>
            <Text style={s.settingArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.settingRow} onPress={() => router.push('/skin-analysis' as any)}>
            <View style={s.settingIcon}><Text style={s.settingIconText}>◈</Text></View>
            <Text style={s.settingLabel}>{lbl('Analyse peau', 'Cilt analizi', 'Skin analysis')}</Text>
            <Text style={s.settingArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.settingRow} onPress={() => router.push('/routine' as any)}>
            <View style={s.settingIcon}><Text style={s.settingIconText}>◇</Text></View>
            <Text style={s.settingLabel}>{t.routine.title}</Text>
            <Text style={s.settingArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.settingRow, { borderBottomWidth: 0 }]} onPress={() => router.push('/compatibility' as any)}>
            <View style={s.settingIcon}><Text style={s.settingIconText}>◉</Text></View>
            <Text style={s.settingLabel}>{t.compatibility.title}</Text>
            <Text style={s.settingArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {profile?.referral_code && (
          <View style={s.inviteCard}>
            <Text style={s.inviteLabel}>{lbl("Code d'invitation", 'Davet kodu', 'Invite code')}</Text>
            <Text style={s.inviteCode}>{profile.referral_code}</Text>
          </View>
        )}

        <TouchableOpacity style={s.outlineBtnFull} onPress={handleLogout}>
          <Text style={s.outlineBtnText}>{t.auth.logout}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.deleteBtn} onPress={() => setMode('deleteAccount')}>
          <Text style={s.deleteBtnText}>{lbl('Supprimer mon compte', 'Hesabı sil', 'Delete account')}</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </View>
    </ScrollView>
  );

  // ── RESET ──
  if (mode === 'reset') return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
      <View style={s.page}>
        <Text style={s.logoSmall}>Rituel</Text>
        {resetSent
          ? <View style={s.card}>
              <Text style={s.cardTitle}>{t.auth.reset_sent_title}</Text>
              <Text style={s.cardSub}>{t.auth.reset_sent_sub}</Text>
              <TouchableOpacity style={s.primaryBtn} onPress={() => { setMode('login'); setResetSent(false); }}>
                <Text style={s.primaryBtnText}>{lbl('Retour à la connexion', 'Giriş sayfasına dön', 'Back to sign in')}</Text>
              </TouchableOpacity>
            </View>
          : <View style={s.card}>
              <Text style={s.cardTitle}>{t.auth.reset_title}</Text>
              <Text style={s.fieldLabel}>{t.auth.email}</Text>
              <TextInput style={s.input} placeholder="email@example.com" placeholderTextColor={T.light} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoCorrect={false} />
              <TouchableOpacity style={s.primaryBtn} onPress={handleReset} disabled={loading}>
                <Text style={s.primaryBtnText}>{loading ? '...' : t.auth.reset_send}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.linkBtn} onPress={() => setMode('login')}>
                <Text style={s.linkBtnText}>{lbl('← Retour', '← Geri', '← Back')}</Text>
              </TouchableOpacity>
            </View>
        }
      </View>
    </ScrollView>
  );

  // ── LOGIN / REGISTER ──
  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
      <View style={s.page}>
        <View style={s.logoBlock}>
          <Text style={s.logoLarge}>Rituel</Text>
          <Text style={s.logoTagline}>{lbl('votre archive beauté', 'güzellik arşiviniz', 'your beauty archive')}</Text>
        </View>

        <View style={s.card}>
          <View style={s.tabs}>
            {(['login', 'register'] as const).map(m => (
              <TouchableOpacity key={m} onPress={() => setMode(m)} style={[s.tab, mode === m && s.tabActive]}>
                <Text style={[s.tabText, mode === m && s.tabTextActive]}>
                  {m === 'login' ? t.auth.login : t.auth.register}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {mode === 'register' && (
            <>
              <Text style={s.fieldLabel}>{t.auth.firstname}</Text>
              <TextInput style={s.input} placeholder="Sophie" placeholderTextColor={T.light} value={name} onChangeText={setName} autoCapitalize="words" autoCorrect={false} />
            </>
          )}

          <Text style={s.fieldLabel}>{t.auth.email}</Text>
          <TextInput style={s.input} placeholder="sophie@example.com" placeholderTextColor={T.light} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoCorrect={false} />

          <Text style={s.fieldLabel}>{t.auth.password}</Text>
          <TextInput style={s.input} placeholder="••••••••" placeholderTextColor={T.light} value={password} onChangeText={setPassword} secureTextEntry />

          <TouchableOpacity style={s.primaryBtn} onPress={handleAuth} disabled={loading}>
            <Text style={s.primaryBtnText}>{loading ? '...' : mode === 'login' ? t.auth.connect : t.auth.signup}</Text>
          </TouchableOpacity>

          {mode === 'login' && (
            <TouchableOpacity style={s.linkBtn} onPress={() => setMode('reset')}>
              <Text style={s.linkBtnText}>{t.auth.forgot}</Text>
            </TouchableOpacity>
          )}

          <View style={s.divider}>
            <View style={s.dividerLine} />
            <Text style={s.dividerText}>{lbl('ou continuer avec', 'veya devam et', 'or continue with')}</Text>
            <View style={s.dividerLine} />
          </View>

          <TouchableOpacity style={s.socialBtn} onPress={handleGoogleLogin}>
            <View style={s.socialIconWrap}>
              <Text style={s.socialIconG}>G</Text>
            </View>
            <Text style={s.socialBtnText}>{lbl('Continuer avec Google', 'Google ile devam et', 'Continue with Google')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  page: { padding: 22, paddingTop: 64, paddingBottom: 40 },
  logoSmall: { fontSize: 20, fontWeight: '300', color: T.dark, letterSpacing: 3, marginBottom: 24 },
  logoBlock: { alignItems: 'center', marginBottom: 36 },
  logoLarge: { fontSize: 40, fontWeight: '300', color: T.dark, letterSpacing: 4, marginBottom: 6 },
  logoTagline: { fontSize: 13, fontStyle: 'italic', color: T.mid, letterSpacing: 2 },
  card: { backgroundColor: T.white, borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardTitle: { fontSize: 18, fontWeight: '300', color: T.dark, marginBottom: 6, letterSpacing: 0.3 },
  cardSub: { fontSize: 12, color: T.mid, marginBottom: 20, lineHeight: 18 },
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  tab: { flex: 1, padding: 10, borderRadius: 12, backgroundColor: T.bg2, alignItems: 'center', borderWidth: 1, borderColor: T.light },
  tabActive: { backgroundColor: T.dark, borderColor: T.dark },
  tabText: { fontSize: 12, color: T.mid },
  tabTextActive: { color: 'rgba(184,133,106,0.9)' },
  fieldLabel: { fontSize: 9, color: T.mid, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 6 },
  input: { backgroundColor: T.bg2, borderRadius: 12, padding: 13, color: T.dark, fontSize: 13, borderWidth: 1, borderColor: T.light, marginBottom: 14 },
  primaryBtn: { backgroundColor: T.accent, borderRadius: 100, padding: 15, alignItems: 'center', marginTop: 4 },
  primaryBtnText: { fontSize: 13, fontWeight: '500', color: T.white, letterSpacing: 0.5 },
  outlineBtn: { flex: 1, borderRadius: 100, padding: 13, alignItems: 'center', borderWidth: 1, borderColor: T.light },
  outlineBtnFull: { borderRadius: 100, padding: 13, alignItems: 'center', borderWidth: 1, borderColor: T.light, marginBottom: 10 },
  outlineBtnText: { fontSize: 12, color: T.mid },
  rowBtns: { flexDirection: 'row', gap: 10, marginTop: 8 },
  linkBtn: { alignItems: 'center', marginTop: 14 },
  linkBtnText: { fontSize: 12, color: T.mid },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 18 },
  dividerLine: { flex: 1, height: 1, backgroundColor: T.light },
  dividerText: { fontSize: 10, color: T.mid, letterSpacing: 0.5 },
  socialBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: T.bg2, borderRadius: 100, padding: 13, borderWidth: 1, borderColor: T.light },
  socialIconWrap: { width: 22, height: 22, borderRadius: 11, backgroundColor: T.white, alignItems: 'center', justifyContent: 'center' },
  socialIconG: { fontSize: 12, fontWeight: '700', color: '#4285F4' },
  socialBtnText: { fontSize: 13, color: T.dark, flex: 1, textAlign: 'center' },
  profileHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  userCard: { backgroundColor: T.white, borderRadius: 20, padding: 22, alignItems: 'center', marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  avatarWrap: { position: 'relative', marginBottom: 12 },
  avatarImg: { width: 72, height: 72, borderRadius: 36, borderWidth: 2, borderColor: T.accent },
  avatarCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: T.bg2, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: T.accent },
  avatarLetter: { fontSize: 28, fontWeight: '300', color: T.accent },
  avatarEditDot: { position: 'absolute', bottom: 0, right: 0, width: 18, height: 18, borderRadius: 9, backgroundColor: T.accent, borderWidth: 2, borderColor: T.white },
  profileName: { fontSize: 17, fontWeight: '300', color: T.dark, marginBottom: 3, letterSpacing: 0.3 },
  profileEmail: { fontSize: 11, color: T.mid, marginBottom: 10 },
  skinBadge: { backgroundColor: 'rgba(184,133,106,0.1)', borderRadius: 100, paddingHorizontal: 14, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(184,133,106,0.2)' },
  skinBadgeText: { fontSize: 10, color: T.accent, letterSpacing: 0.5 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  statBox: { flex: 1, backgroundColor: T.white, borderRadius: 14, padding: 14, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  statNum: { fontSize: 22, fontWeight: '300', color: T.dark, marginBottom: 3 },
  statLbl: { fontSize: 8, color: T.mid, textTransform: 'uppercase', letterSpacing: 0.8 },
  aiCard: { backgroundColor: T.dark, borderRadius: 16, padding: 18, marginBottom: 14 },
  aiCardTitle: { fontSize: 14, fontWeight: '300', color: T.accent, marginBottom: 4, letterSpacing: 0.3 },
  aiCardSub: { fontSize: 11, color: 'rgba(184,133,106,0.5)' },
  settingsCard: { backgroundColor: T.white, borderRadius: 18, padding: 4, marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderBottomWidth: 1, borderBottomColor: T.bg2 },
  settingIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: T.bg2, alignItems: 'center', justifyContent: 'center' },
  settingIconText: { fontSize: 14, color: T.accent },
  settingLabel: { flex: 1, fontSize: 13, color: T.dark },
  settingArrow: { fontSize: 18, color: T.light },
  inviteCard: { backgroundColor: T.bg2, borderRadius: 14, padding: 14, marginBottom: 14, alignItems: 'center', borderWidth: 1, borderColor: T.light },
  inviteLabel: { fontSize: 9, color: T.mid, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 5 },
  inviteCode: { fontSize: 14, color: T.accent, fontWeight: '500', letterSpacing: 2 },
  deleteBtn: { borderRadius: 100, padding: 13, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(192,57,43,0.2)', marginBottom: 10 },
  deleteBtnText: { fontSize: 12, color: '#C0392B' },
  deleteWarning: { fontSize: 12, color: T.mid, lineHeight: 18, marginBottom: 20, textAlign: 'center' },
  deleteConfirmBtn: { backgroundColor: 'rgba(192,57,43,0.08)', borderRadius: 100, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(192,57,43,0.2)', marginBottom: 10, marginTop: 4 },
  deleteConfirmText: { fontSize: 13, color: '#C0392B', fontWeight: '500' },
  avatarPicker: { alignItems: 'center', marginBottom: 20 },
  avatarPickerImg: { width: 90, height: 90, borderRadius: 45, borderWidth: 2, borderColor: T.accent },
  avatarPickerPlaceholder: { width: 90, height: 90, borderRadius: 45, backgroundColor: T.bg2, borderWidth: 1.5, borderColor: T.light, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  avatarPickerLabel: { fontSize: 10, color: T.mid, textAlign: 'center' },
  skinRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  skinChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 100, backgroundColor: T.bg2, borderWidth: 1, borderColor: T.light },
  skinChipActive: { backgroundColor: T.dark, borderColor: T.dark },
  skinChipText: { fontSize: 11, color: T.mid },
  skinChipTextActive: { color: 'rgba(184,133,106,0.9)' },
});