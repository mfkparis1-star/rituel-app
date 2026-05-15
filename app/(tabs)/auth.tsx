import { type Session } from '@supabase/supabase-js';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { pickAvatarFromLibrary, uploadAvatar } from '../../utils/avatar';
import { useProfile } from '../../hooks/useProfile'
import { useFavoriteProducts } from '../../hooks/useFavoriteProducts';;
import { SafeAreaView } from 'react-native-safe-area-context';
import HeroCard from '../../components/ui/HeroCard';
import ListRow from '../../components/ui/ListRow';
import CreditPackModal from '../../components/credits/CreditPackModal';
import { useCredits } from '../../hooks/useCredits';
import { useRoutineCount } from '../../hooks/useRoutineCount';
import { usePremium } from '../../hooks/usePremium';
import { formatDateFR } from '../../utils/format';
import PillButton from '../../components/ui/PillButton';
import PremiumCard from '../../components/ui/PremiumCard';
import StatCard from '../../components/ui/StatCard';
import { supabase } from '../../lib/supabase';
import { C, R, Sh, Sp, Type } from '../../theme';
import { localizedAuthInfo, mapAuthError } from '../../utils/authErrors';

type AuthMode = 'signin' | 'signup' | 'profile';

export default function AuthScreen() {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [creditModalOpen, setCreditModalOpen] = useState(false);
  const { balance: creditBalance, loading: creditsLoading } = useCredits();
  const { count: routineCount } = useRoutineCount();
  const { isPremium, customerInfo, restore } = usePremium();
  const { profile, update: updateProfile } = useProfile();
  const { products: favoriteProducts } = useFavoriteProducts(profile?.id ?? null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState('');

  const premiumExpiryISO = customerInfo?.entitlements?.active?.['Rituel Pro']?.expirationDate ?? null;
  const premiumExpiryFR = formatDateFR(premiumExpiryISO);
  const premiumSubtitle = premiumExpiryFR
    ? `Actif jusqu’au ${premiumExpiryFR}`
    : 'Abonnement actif';

  const [restoring, setRestoring] = useState(false);

  const handleRestore = async () => {
    if (restoring) return;
    setRestoring(true);
    try {
      const ok = await restore();
      if (ok) {
        Alert.alert(
          'Achats restaurés',
          'Ton abonnement Rituel Pro est actif.'
        );
      } else {
        Alert.alert(
          'Aucun achat trouvé',
          "Nous n'avons pas trouvé d'achat actif lié à ton compte."
        );
      }
    } catch {
      Alert.alert(
        'Restauration impossible',
        'Une erreur est survenue. Réessaye plus tard.'
      );
    } finally {
      setRestoring(false);
    }
  };
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  // ----- Session bootstrap + listener -----
  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setMode(data.session ? 'profile' : 'signin');
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!mounted) return;
      setSession(newSession);
      setMode(newSession ? 'profile' : 'signin');
      setSubmitting(false);
      setError(null);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  // ----- Validators -----
  const isEmailValid = (v: string) => v.trim().includes('@') && v.trim().length >= 5;
  const isPasswordValid = (v: string) => v.length >= 6;

  const canSubmitSignin = isEmailValid(email) && isPasswordValid(password) && !submitting;
  const canSubmitSignup = isEmailValid(email) && isPasswordValid(password) && name.trim().length > 0 && !submitting;

  // ----- Actions -----
  const clearMessages = () => {
    setError(null);
    setInfo(null);
  };

  const handleSignIn = async () => {
    clearMessages();
    if (!canSubmitSignin) {
      setError(localizedAuthInfo('empty_field'));
      return;
    }
    setSubmitting(true);
    const { error: err } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (err) {
      setError(mapAuthError(err));
      setSubmitting(false);
    }
  };

  const handleSignUp = async () => {
    clearMessages();
    if (!canSubmitSignup) {
      setError(localizedAuthInfo('empty_field'));
      return;
    }
    setSubmitting(true);
    const { data, error: err } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { display_name: name.trim() },
      },
    });
    setSubmitting(false);
    if (err) {
      setError(mapAuthError(err));
      return;
    }
    if (!data.session) {
      setInfo(localizedAuthInfo('signup_check_email'));
      setMode('signin');
      setPassword('');
    }
  };

  const handleResetPassword = async () => {
    clearMessages();
    if (!isEmailValid(email)) {
      setError(localizedAuthInfo('empty_field'));
      return;
    }
    setSubmitting(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim());
    setSubmitting(false);
    if (err) {
      setError(mapAuthError(err));
      return;
    }
    setInfo(localizedAuthInfo('reset_sent'));
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Déconnexion',
      'Vous voulez vraiment vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Se déconnecter',
          style: 'destructive',
          onPress: async () => {
            setSubmitting(true);
            await supabase.auth.signOut();
            setEmail('');
            setPassword('');
            setName('');
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Supprimer mon compte',
      'Cette action est définitive. Toutes tes données — produits, routines, analyses, achats — seront supprimées.\n\nTon abonnement Apple, s\'il existe, continue d\'être facturé jusqu\'à la prochaine date de renouvellement. Tu peux l\'annuler depuis Réglages > Apple ID > Abonnements.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Continuer',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirmer la suppression',
              'Es-tu absolument sûr ? Cette action ne peut pas être annulée.',
              [
                { text: 'Annuler', style: 'cancel' },
                {
                  text: 'Supprimer définitivement',
                  style: 'destructive',
                  onPress: async () => {
                    setSubmitting(true);
                    try {
                      const { error: fnErr } = await supabase.functions.invoke('delete-user', {
                        method: 'POST',
                      });
                      if (fnErr) {
                        Alert.alert(
                          'Suppression impossible',
                          'Une erreur est survenue. Réessaye dans un instant ou contacte-nous.'
                        );
                        return;
                      }
                      await supabase.auth.signOut();
                      setMode('signin');
                      Alert.alert(
                        'Compte supprimé',
                        'Toutes tes données ont été supprimées. Merci d\'avoir essayé Rituel.'
                      );
                    } catch {
                      Alert.alert(
                        'Suppression impossible',
                        'Une erreur est survenue. Réessaye dans un instant.'
                      );
                    } finally {
                      setSubmitting(false);
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };


  // ----- Loading splash -----
  if (loading) {
    return (
      <SafeAreaView style={s.root} edges={['top']}>
        <View style={s.centerWrap}>
          <ActivityIndicator color={C.copper} />
        </View>
      </SafeAreaView>
    );
  }

  // ----- SIGNIN / SIGNUP MODE -----
  if (mode === 'signin' || mode === 'signup') {
    return (
      <SafeAreaView style={s.root} edges={['top']}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={s.header}>
            <Text style={s.brand}>RITUEL</Text>
            <Text style={s.title}>
              {mode === 'signin' ? 'Connexion' : 'Inscription'}
            </Text>
            <Text style={s.subtitle}>
              {mode === 'signin'
                ? 'Retrouve ton rituel beauté'
                : 'Crée ton compte pour commencer'}
            </Text>
          </View>

          <View style={[s.formCard, Sh.soft]}>
            {mode === 'signup' && (
              <>
                <Text style={s.fieldLabel}>NOM</Text>
                <TextInput
                  style={s.input}
                  placeholder="Votre nom"
                  placeholderTextColor={C.textSoft}
                  value={name}
                  onChangeText={(v) => { setName(v); clearMessages(); }}
                  autoCorrect={false}
                  editable={!submitting}
                />
              </>
            )}

            <Text style={s.fieldLabel}>EMAIL</Text>
            <TextInput
              style={s.input}
              placeholder="vous@email.com"
              placeholderTextColor={C.textSoft}
              value={email}
              onChangeText={(v) => { setEmail(v); clearMessages(); }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!submitting}
            />

            <Text style={s.fieldLabel}>MOT DE PASSE</Text>
            <TextInput
              style={s.input}
              placeholder="••••••••"
              placeholderTextColor={C.textSoft}
              value={password}
              onChangeText={(v) => { setPassword(v); clearMessages(); }}
              secureTextEntry
              autoCapitalize="none"
              editable={!submitting}
            />

            {error && (
              <View style={s.errorBox}>
                <Text style={s.errorTxt}>{error}</Text>
              </View>
            )}
            {info && !error && (
              <View style={s.infoBox}>
                <Text style={s.infoTxt}>{info}</Text>
              </View>
            )}

            <PillButton
              label={mode === 'signin' ? 'Se connecter' : 'Créer mon compte'}
              variant="primary"
              fullWidth
              loading={submitting}
              disabled={mode === 'signin' ? !canSubmitSignin : !canSubmitSignup}
              onPress={mode === 'signin' ? handleSignIn : handleSignUp}
              style={{ marginTop: Sp.md }}
            />

            {mode === 'signup' && (
              <Text style={s.legalNote}>
                En vous inscrivant, vous acceptez nos{' '}
                <Text
                  style={s.legalLink}
                  onPress={() => Linking.openURL('https://rituel.beauty/terms').catch(() => {})}
                >
                  Conditions générales
                </Text>
                {' '}et notre{' '}
                <Text
                  style={s.legalLink}
                  onPress={() => Linking.openURL('https://rituel.beauty/privacy').catch(() => {})}
                >
                  Politique de confidentialité
                </Text>
                .
              </Text>
            )}

            {mode === 'signin' && (
              <Pressable onPress={handleResetPassword} disabled={submitting} style={s.forgotBtn}>
                <Text style={s.forgotTxt}>Mot de passe oublié ?</Text>
              </Pressable>
            )}
          </View>

          <View style={s.switchRow}>
            <Text style={s.switchTxt}>
              {mode === 'signin' ? 'Pas encore de compte ?' : 'Déjà inscrite ?'}
            </Text>
            <Pressable
              onPress={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin');
                clearMessages();
              }}
              disabled={submitting}
            >
              <Text style={s.switchLink}>
                {mode === 'signin' ? 'S\'inscrire' : 'Se connecter'}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ----- PROFILE MODE -----
  const userEmail = session?.user?.email ?? '';
  const displayName =
    (session?.user?.user_metadata as any)?.display_name ||
    userEmail.split('@')[0] ||
    'Utilisateur';
  const handleAvatarTap = async () => {
    if (uploadingAvatar || !session) return;
    const pick = await pickAvatarFromLibrary();
    if (!pick.ok) {
      if (pick.reason === 'no_permission') {
        Alert.alert(
          'Accès aux photos refusé',
          'Active l’accès aux photos dans Réglages pour ajouter une photo de profil.',
          [
            { text: 'Annuler', style: 'cancel' },
            {
              text: 'Ouvrir Réglages',
              onPress: () => {
                Linking.openSettings().catch(() => {
                  // graceful no-op if openSettings fails on this device
                });
              },
            },
          ]
        );
      }
      return;
    }
    setUploadingAvatar(true);
    const url = await uploadAvatar(session.user.id, pick.uri);
    if (!url) {
      setUploadingAvatar(false);
      Alert.alert('Erreur', 'Téléchargement impossible. Réessaye dans un instant.');
      return;
    }
    await updateProfile({ avatar_url: url });
    setUploadingAvatar(false);
  };

  const handleStartEditName = () => {
    setDraftName(profile?.full_name ?? displayName ?? '');
    setEditingName(true);
  };

  const handleSaveName = async () => {
    const trimmed = draftName.trim();
    if (!trimmed) {
      setEditingName(false);
      return;
    }
    const ok = await updateProfile({ full_name: trimmed });
    if (!ok) {
      Alert.alert('Erreur', 'Mise à jour impossible.');
      return;
    }
    setEditingName(false);
  };

  const avatarLetter = (displayName[0] || 'U').toUpperCase();

  const profileStats = {
    productCount: 0,
    analysisCount: 0,
    routineActive: false,
  };

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={[s.profileCard, Sh.soft]}>
          <Pressable
            onPress={handleAvatarTap}
            disabled={uploadingAvatar}
            style={s.avatarRing}
          >
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={s.avatarImg} />
            ) : (
              <View style={s.avatar}>
                <Text style={s.avatarLetter}>{avatarLetter}</Text>
              </View>
            )}
            {uploadingAvatar && (
              <View style={s.avatarOverlay}>
                <Text style={s.avatarOverlayTxt}>…</Text>
              </View>
            )}
          </Pressable>

          {editingName ? (
            <View style={s.nameEditRow}>
              <TextInput
                value={draftName}
                onChangeText={setDraftName}
                placeholder="Ton prénom"
                placeholderTextColor={C.textSoft}
                style={s.nameInput}
                autoFocus
                onSubmitEditing={handleSaveName}
                returnKeyType="done"
                maxLength={40}
              />
              <Pressable onPress={handleSaveName} hitSlop={8}>
                <Text style={s.nameSaveTxt}>OK</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable onPress={handleStartEditName} hitSlop={8}>
              <Text style={s.profileName}>
                {profile?.full_name || displayName}
              </Text>
            </Pressable>
          )}
          <Text style={s.profileEmail}>{userEmail}</Text>
          {isPremium && (
            <View style={s.premiumBadge}>
              <Text style={s.premiumBadgeTxt}>RITUEL PRO</Text>
            </View>
          )}
          {profile?.skin_type && (
            <Text style={s.skinTypeTxt}>Peau {profile.skin_type}</Text>
          )}
        </View>

        <View style={s.statsRow}>
          <StatCard label="Produit" value={profileStats.productCount} />
          <View style={s.gap} />
          <StatCard label="Analyse" value={profileStats.analysisCount} />
          <View style={s.gap} />
          <StatCard label="Routine" value={routineCount} />
        </View>

        <HeroCard
          label="ANALYSE"
          title="Mettre à jour l'analyse"
          subtitle="Garde tes recommandations synchronisées avec ta peau."
          ctaLabel="Lancer"
          variant="espresso"
          onPress={() => router.push('/(tabs)/skin-analysis' as any)}
          style={{ marginBottom: Sp.lg }}
        />

        <ListRow
          title="Crédits IA"
          subtitle={
            creditsLoading
              ? 'Chargement...'
              : `${creditBalance} crédit${creditBalance !== 1 ? 's' : ''} disponible${creditBalance !== 1 ? 's' : ''}`
          }
          onPress={() => setCreditModalOpen(true)}
        />

        {!isPremium && (
          <>
            <PremiumCard variant="espresso" style={s.premium}>
              <Text style={s.premiumLabel}>PREMIUM</Text>
              <Text style={s.premiumTitle}>Active toute la puissance IA</Text>
              <Text style={s.premiumSub}>
                Analyses complètes, routines IA, crédits et recommandations premium.
              </Text>
              <PillButton
                label="Découvrir Premium"
                variant="primary"
                size="md"
                onPress={() => router.push('/paywall' as any)}
                textColor={C.espresso}
                style={{ marginTop: Sp.md, backgroundColor: C.white }}
              />
            </PremiumCard>
            <ListRow
              title="Restaurer mes achats"
              subtitle={restoring ? 'Restauration en cours...' : 'Tu as déjà acheté Rituel Pro ?'}
              onPress={handleRestore}
            />
          </>
        )}

        {isPremium && (
          <>
            <Text style={s.section}>ABONNEMENT</Text>
            <ListRow
              title="Rituel Pro"
              subtitle={premiumSubtitle}
              onPress={() =>
                Linking.openURL('https://apps.apple.com/account/subscriptions').catch(() => {})
              }
            />
          </>
        )}

        <Text style={s.section}>POUR TOI</Text>

        <PremiumCard variant="cream" style={{ marginBottom: Sp.sm }}>
          <Text style={s.recoLabel}>RECOMMANDATION</Text>
          <Text style={s.recoTitle}>Commence ton rituel ce soir</Text>
          <Text style={s.recoSub}>
            Une routine apaisante pour prendre soin de toi.
          </Text>
        </PremiumCard>

{favoriteProducts.length > 0 ? (
          <View style={s.ritualSection}>
            <Text style={s.section}>DANS MON RITUEL</Text>
            <View style={s.ritualChipsWrap}>
              {favoriteProducts.map((name) => (
                <View key={name} style={s.ritualChip}>
                  <Text style={s.ritualChipTxt} numberOfLines={1}>{name}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}
                <Text style={s.section}>ACCÈS RAPIDE</Text>
        <ListRow
          title="Mon journal"
          subtitle="Ton parcours beauté, jour après jour"
          onPress={() => router.push('/glow-timeline' as any)}
        />
        <ListRow
          title="Mon énergie"
          subtitle="Ton reflet du moment"
          onPress={() => router.push('/score' as any)}
        />
        <ListRow
          title="Mes favoris"
          subtitle="Tes inspirations sauvegardées"
          onPress={() => router.push('/saved' as any)}
        />

        <ListRow
          title="Mon archive"
          subtitle="Tes produits, ton suivi"
          onPress={() => router.push('/(tabs)/archive' as any)}
        />
        <ListRow
          title="Mon rituel"
          subtitle="Routine matin et soir"
          onPress={() => router.push('/(tabs)/routine' as any)}
        />
        <ListRow
          title="Se déconnecter"
          subtitle="Quitter cette session"
          onPress={handleSignOut}
        />
        <ListRow
          title="Supprimer mon compte"
          subtitle="Action définitive — toutes tes données seront effacées"
          onPress={handleDeleteAccount}
        />

        <CreditPackModal
          visible={creditModalOpen}
          onClose={() => setCreditModalOpen(false)}
        />

        <View style={{ height: Sp.huge }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.appBg },
  scroll: { paddingHorizontal: Sp.lg, paddingTop: Sp.sm, paddingBottom: Sp.xl },
  centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: { marginBottom: Sp.xl, marginTop: Sp.sm, alignItems: 'center' },
  brand: {
    fontSize: 11, fontWeight: '700', color: C.copper,
    letterSpacing: 2.4, marginBottom: Sp.lg,
  },
  title: { ...Type.h1, marginBottom: 4, textAlign: 'center' },
  subtitle: { ...Type.body, color: C.textMid, textAlign: 'center' },

  formCard: {
    backgroundColor: C.white, borderRadius: R.lg,
    padding: Sp.lg, marginBottom: Sp.md,
  },
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
  errorTxt: {
    fontSize: 12, color: C.red, lineHeight: 17,
  },
  infoBox: {
    backgroundColor: C.cream, borderRadius: R.sm,
    padding: Sp.sm, marginTop: Sp.sm,
  },
  infoTxt: {
    fontSize: 12, color: C.espresso, lineHeight: 17,
  },
  forgotBtn: {
    alignSelf: 'center', marginTop: Sp.sm, padding: Sp.xs,
  },
  forgotTxt: {
    fontSize: 12, color: C.copper, fontWeight: '500',
  },
  legalNote: {
    marginTop: Sp.md,
    fontSize: 12,
    lineHeight: 18,
    color: C.textMid,
    textAlign: 'center',
    paddingHorizontal: Sp.sm,
  },
  legalLink: {
    color: C.copper,
    textDecorationLine: 'underline',
  },

  switchRow: {
    flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', marginTop: Sp.md,
  },
  switchTxt: {
    fontSize: 13, color: C.textMid, marginRight: 6,
  },
  switchLink: {
    fontSize: 13, fontWeight: '600', color: C.copper,
  },

  profileCard: {
    backgroundColor: C.white, borderRadius: R.lg,
    padding: Sp.xl, alignItems: 'center',
    marginBottom: Sp.lg, marginTop: Sp.sm,
  },
  avatar: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: C.cream,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Sp.sm,
  },
  avatarLetter: {
    fontSize: 24, fontWeight: '600', color: C.espresso,
  },
  profileName: {
    fontSize: 20, fontWeight: '600', color: C.text, marginBottom: 2,
  },
  profileEmail: {
    fontSize: 13, color: C.textMid,
  },

  statsRow: {
    flexDirection: 'row', marginBottom: Sp.lg,
  },
  gap: { width: Sp.xs },

  premium: { marginTop: Sp.md, marginBottom: Sp.md },
  premiumLabel: {
    fontSize: 10, fontWeight: '700', color: C.copper,
    letterSpacing: 1.6, textTransform: 'uppercase', marginBottom: Sp.xs,
  },
  premiumTitle: {
    fontSize: 22, fontWeight: '600', color: C.white, marginBottom: Sp.xs,
  },
  premiumSub: {
    fontSize: 13, color: 'rgba(255,255,255,0.78)', lineHeight: 19,
  },

  section: {
    fontSize: 11, fontWeight: '700', color: C.copper,
    letterSpacing: 1.6, textTransform: 'uppercase',
    marginTop: Sp.lg, marginBottom: Sp.sm,
  },
  ritualSection: {
    marginTop: 24,
    marginBottom: 4,
  },
  ritualChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 16,
  },
  ritualChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 100,
    backgroundColor: '#FBF6F1',
    borderWidth: 1,
    borderColor: '#E8DFD2',
    maxWidth: 220,
  },
  ritualChipTxt: {
    fontSize: 12,
    fontStyle: 'italic',
    color: C.copper,
    letterSpacing: 0.3,
  },
  recoLabel: {
    fontSize: 10, fontWeight: '700', color: C.copper,
    letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: Sp.xs,
  },
  recoTitle: {
    fontSize: 17, fontWeight: '600', color: C.text, marginBottom: 4,
  },
  recoSub: {
    fontSize: 13, color: C.textMid, lineHeight: 19,
  },
  avatarRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: C.copper,
    padding: 3,
    marginBottom: Sp.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.cream,
  },
  avatarImg: {
    width: 86,
    height: 86,
    borderRadius: 43,
  },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  avatarOverlayTxt: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '600',
  },
  nameEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Sp.sm,
    marginBottom: 4,
  },
  nameInput: {
    fontSize: 20,
    fontWeight: '500',
    color: C.text,
    borderBottomWidth: 1,
    borderBottomColor: C.copper,
    paddingVertical: 4,
    minWidth: 160,
    textAlign: 'center',
  },
  nameSaveTxt: {
    fontSize: 14,
    color: C.copper,
    fontWeight: '600',
  },
  premiumBadge: {
    backgroundColor: C.copper,
    paddingHorizontal: Sp.md,
    paddingVertical: 4,
    borderRadius: 999,
    marginTop: Sp.xs,
  },
  premiumBadgeTxt: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  skinTypeTxt: {
    fontSize: 12,
    color: C.textMid,
    marginTop: Sp.xs,
    textTransform: 'capitalize',
  },
});