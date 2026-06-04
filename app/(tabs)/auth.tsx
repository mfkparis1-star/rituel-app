import { type Session } from '@supabase/supabase-js';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { pickAvatarFromLibrary, uploadAvatar } from '../../utils/avatar';
import { useProfile } from '../../hooks/useProfile'
import { useFavoriteProducts } from '../../hooks/useFavoriteProducts';
import { useLanguage } from '../../hooks/useLanguage';
import { useMemory } from '../../hooks/useMemory';
import { SUPPORTED_LANGS, type Lang } from '../../utils/i18n';;
import { SafeAreaView } from 'react-native-safe-area-context';
import HeroCard from '../../components/ui/HeroCard';
import ListRow from '../../components/ui/ListRow';
import CreditPackModal from '../../components/credits/CreditPackModal';
import { useCredits } from '../../hooks/useCredits';
import { useRoutineCount } from '../../hooks/useRoutineCount';
import { usePremium } from '../../hooks/usePremium';
import { formatDate } from '../../utils/format';
import PillButton from '../../components/ui/PillButton';
import PremiumCard from '../../components/ui/PremiumCard';
import StatCard from '../../components/ui/StatCard';
import * as WebBrowser from 'expo-web-browser';
import { createURL, parse as parseURL } from 'expo-linking';
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
  const { lang: currentLang, setLanguage, t } = useLanguage();
  const { memory } = useMemory();
  const { products: favoriteProducts } = useFavoriteProducts(profile?.id ?? null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState('');

  const premiumExpiryISO = customerInfo?.entitlements?.active?.['Rituel Pro']?.expirationDate ?? null;
  const premiumExpiryFR = formatDate(premiumExpiryISO, currentLang);
  const premiumSubtitle = premiumExpiryFR
    ? t('auth.alerts.subscription.activeUntil').replace('{date}', premiumExpiryFR)
    : t('auth.alerts.subscription.activeFallback');

  const [restoring, setRestoring] = useState(false);

  const handleRestore = async () => {
    if (restoring) return;
    setRestoring(true);
    try {
      const ok = await restore();
      if (ok) {
        Alert.alert(
          t('auth.alerts.restore.successTitle'),
          t('auth.alerts.restore.successBody')
        );
      } else {
        Alert.alert(
          t('auth.alerts.restore.emptyTitle'),
          t('auth.alerts.restore.emptyBody')
        );
      }
    } catch {
      Alert.alert(
        t('auth.alerts.restore.errorTitle'),
        t('auth.alerts.restore.errorBody')
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
      setError(localizedAuthInfo('empty_field', currentLang));
      return;
    }
    setSubmitting(true);
    const { error: err } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (err) {
      setError(mapAuthError(err, currentLang));
      setSubmitting(false);
    }
  };

  const handleSignUp = async () => {
    clearMessages();
    if (!canSubmitSignup) {
      setError(localizedAuthInfo('empty_field', currentLang));
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
      setError(mapAuthError(err, currentLang));
      return;
    }
    if (!data.session) {
      setInfo(localizedAuthInfo('signup_check_email', currentLang));
      setMode('signin');
      setPassword('');
    }
  };

  const handleResetPassword = async () => {
    clearMessages();
    if (!isEmailValid(email)) {
      setError(localizedAuthInfo('empty_field', currentLang));
      return;
    }
    setSubmitting(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim());
    setSubmitting(false);
    if (err) {
      setError(mapAuthError(err, currentLang));
      return;
    }
    setInfo(localizedAuthInfo('reset_sent', currentLang));
  };

  const handleGoogleSignIn = async () => {
    clearMessages();
    setSubmitting(true);
    try {
      const redirectTo = createURL('auth/callback');
      const { data, error: err } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo, skipBrowserRedirect: true },
      });
      if (err) throw err;
      if (!data?.url) throw new Error('no_oauth_url');

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

      if (result.type !== 'success' || !result.url) {
        if (result.type === 'cancel' || result.type === 'dismiss') {
          Alert.alert(
            t('auth.alerts.oauth.cancelledTitle'),
            t('auth.alerts.oauth.cancelledBody'),
          );
        }
        return;
      }

      // Supabase implicit flow returns tokens in URL fragment (#).
      // expo-linking parseURL does not extract fragment params, so parse manually.
      const fragment = result.url.split('#')[1] ?? '';
      const params = new URLSearchParams(fragment);
      const access_token = params.get('access_token');
      const refresh_token = params.get('refresh_token');
      if (!access_token || !refresh_token) throw new Error('no_tokens');

      const { error: setErr } = await supabase.auth.setSession({ access_token, refresh_token });
      if (setErr) throw setErr;
      // Session change handled by existing onAuthStateChange listener.
    } catch {
      Alert.alert(
        t('auth.alerts.oauth.errorTitle'),
        t('auth.alerts.oauth.errorBody'),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      t('auth.alerts.signOut.title'),
      t('auth.alerts.signOut.body'),
      [
        { text: t('auth.alerts.signOut.cancel'), style: 'cancel' },
        {
          text: t('auth.alerts.signOut.confirm'),
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
      t('auth.alerts.deleteAccount.title'),
      t('auth.alerts.deleteAccount.body'),
      [
        { text: t('auth.alerts.deleteAccount.cancel'), style: 'cancel' },
        {
          text: t('auth.alerts.deleteAccount.continue'),
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              t('auth.alerts.deleteAccount.confirmTitle'),
              t('auth.alerts.deleteAccount.confirmBody'),
              [
                { text: t('auth.alerts.deleteAccount.confirmCancel'), style: 'cancel' },
                {
                  text: t('auth.alerts.deleteAccount.confirmDelete'),
                  style: 'destructive',
                  onPress: async () => {
                    setSubmitting(true);
                    try {
                      const { error: fnErr } = await supabase.functions.invoke('delete-user', {
                        method: 'POST',
                      });
                      if (fnErr) {
                        Alert.alert(
                          t('auth.alerts.deleteAccount.errorTitle'),
                          t('auth.alerts.deleteAccount.errorBody')
                        );
                        return;
                      }
                      await supabase.auth.signOut();
                      setMode('signin');
                      Alert.alert(
                        t('auth.alerts.deleteAccount.successTitle'),
                        t('auth.alerts.deleteAccount.successBody')
                      );
                    } catch {
                      Alert.alert(
                        t('auth.alerts.deleteAccount.retryTitle'),
                        t('auth.alerts.deleteAccount.retryBody')
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
            <Text style={s.brand}>{t('auth.brand')}</Text>
            <Text style={s.title}>
              {mode === 'signin' ? t('auth.signin.title') : t('auth.signup.title')}
            </Text>
            <Text style={s.subtitle}>
              {mode === 'signin'
                ? t('auth.signin.subtitle')
                : t('auth.signup.subtitle')}
            </Text>
          </View>

          <View style={[s.formCard, Sh.soft]}>
            {mode === 'signup' && (
              <>
                <Text style={s.fieldLabel}>{t('auth.fields.nameLabel')}</Text>
                <TextInput
                  style={s.input}
                  placeholder={t('auth.fields.namePlaceholder')}
                  placeholderTextColor={C.textSoft}
                  value={name}
                  onChangeText={(v) => { setName(v); clearMessages(); }}
                  autoCorrect={false}
                  editable={!submitting}
                />
              </>
            )}

            <Text style={s.fieldLabel}>{t('auth.fields.emailLabel')}</Text>
            <TextInput
              style={s.input}
              placeholder={t('auth.fields.emailPlaceholder')}
              placeholderTextColor={C.textSoft}
              value={email}
              onChangeText={(v) => { setEmail(v); clearMessages(); }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!submitting}
            />

            <Text style={s.fieldLabel}>{t('auth.fields.passwordLabel')}</Text>
            <TextInput
              style={s.input}
              placeholder={t('auth.fields.passwordPlaceholder')}
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
              label={mode === 'signin' ? t('auth.signin.submit') : t('auth.signup.submit')}
              variant="primary"
              fullWidth
              loading={submitting}
              disabled={mode === 'signin' ? !canSubmitSignin : !canSubmitSignup}
              onPress={mode === 'signin' ? handleSignIn : handleSignUp}
              style={{ marginTop: Sp.md }}
            />

            <View style={s.oauthDivider}>
              <View style={s.oauthDividerLine} />
              <Text style={s.oauthDividerTxt}>{t('auth.divider.or')}</Text>
              <View style={s.oauthDividerLine} />
            </View>

            <PillButton
              label={t('auth.google.button')}
              variant="outline"
              fullWidth
              disabled={submitting}
              onPress={handleGoogleSignIn}
            />

            {mode === 'signup' && (
              <Text style={s.legalNote}>
                {t('auth.signup.legalPrefix')}
                <Text
                  style={s.legalLink}
                  onPress={() => Linking.openURL('https://rituel.beauty/terms').catch(() => {})}
                >
                  Conditions générales
                </Text>
                {t('auth.signup.legalAnd')}
                <Text
                  style={s.legalLink}
                  onPress={() => Linking.openURL('https://rituel.beauty/privacy').catch(() => {})}
                >
                  Politique de confidentialité
                </Text>
                {t('auth.signup.legalSuffix')}</Text>
            )}

            {mode === 'signin' && (
              <Pressable onPress={handleResetPassword} disabled={submitting} style={s.forgotBtn}>
                <Text style={s.forgotTxt}>{t('auth.signin.forgot')}</Text>
              </Pressable>
            )}
          </View>

          <View style={s.switchRow}>
            <Text style={s.switchTxt}>
              {mode === 'signin' ? t('auth.signin.switchPrompt') : t('auth.signup.switchPrompt')}
            </Text>
            <Pressable
              onPress={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin');
                clearMessages();
              }}
              disabled={submitting}
            >
              <Text style={s.switchLink}>
                {mode === 'signin' ? t('auth.signin.switchLink') : t('auth.signup.switchLink')}
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
          t('auth.alerts.avatar.permissionTitle'),
          t('auth.alerts.avatar.permissionBody'),
          [
            { text: t('auth.alerts.avatar.permissionCancel'), style: 'cancel' },
            {
              text: t('auth.alerts.avatar.permissionOpenSettings'),
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
      Alert.alert(t('auth.alerts.avatar.uploadErrorTitle'), t('auth.alerts.avatar.uploadErrorBody'));
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
      Alert.alert(t('auth.alerts.name.updateErrorTitle'), t('auth.alerts.name.updateErrorBody'));
      return;
    }
    setEditingName(false);
  };

  const avatarLetter = (displayName[0] || 'U').toUpperCase();


  // Phase 19.2 — hidden dev language switcher (__DEV__ only)
  const handleDevLangSwitch = () => {
    Alert.alert(
      'DEV — Language',
      `Active: ${currentLang.toUpperCase()}`,
      [
        ...SUPPORTED_LANGS.map((l) => ({
          text: l.toUpperCase(),
          onPress: () => setLanguage(l as Lang),
        })),
        { text: 'Annuler', style: 'cancel' as const },
      ]
    );
  };

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
                placeholder={t('auth.profile.namePlaceholder')}
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
              <Text style={s.premiumBadgeTxt}>{t('auth.profile.premiumBadge')}</Text>
            </View>
          )}
          {profile?.skin_type && (
            <Text style={s.skinTypeTxt}>{t('auth.profile.skinTypePrefix')}{profile.skin_type}</Text>
          )}
        </View>

        <View style={s.statsRow}>
          <StatCard label={t('auth.profile.stats.products')} value={profileStats.productCount} />
          <View style={s.gap} />
          <StatCard label={t('auth.profile.stats.analysis')} value={profileStats.analysisCount} />
          <View style={s.gap} />
          <StatCard label={t('auth.profile.stats.routine')} value={routineCount} />
        </View>

        <HeroCard
          label={t('auth.profile.analysis.kicker')}
          title={t('auth.profile.analysis.title')}
          subtitle={t('auth.profile.analysis.subtitle')}
          ctaLabel={t('auth.profile.analysis.cta')}
          variant="espresso"
          onPress={() => router.push('/(tabs)/skin-analysis' as any)}
          style={{ marginBottom: Sp.lg }}
        />

        <ListRow
          title={t('auth.profile.credits.title')}
          subtitle={
            creditsLoading
              ? t('auth.profile.credits.loading')
              : (creditBalance === 1
                  ? t('auth.profile.credits.availableOne').replace('{n}', String(creditBalance))
                  : t('auth.profile.credits.availableMany').replace('{n}', String(creditBalance)))
          }
          onPress={() => setCreditModalOpen(true)}
        />

        {!isPremium && (
          <>
            <PremiumCard variant="espresso" style={s.premium}>
              <Text style={s.premiumLabel}>{t('auth.profile.premium.kicker')}</Text>
              <Text style={s.premiumTitle}>{t('auth.profile.premium.title')}</Text>
              <Text style={s.premiumSub}>{t('auth.profile.premium.subtitle')}</Text>
              <PillButton
                label={t('auth.profile.premium.cta')}
                variant="primary"
                size="md"
                onPress={() => router.push('/paywall' as any)}
                textColor={C.espresso}
                style={{ marginTop: Sp.md, backgroundColor: C.white }}
              />
            </PremiumCard>
            <ListRow
              title={t('auth.profile.premium.restoreTitle')}
              subtitle={restoring ? t('auth.profile.premium.restoreLoading') : t('auth.profile.premium.restoreSubtitle')}
              onPress={handleRestore}
            />
          </>
        )}

        {isPremium && (
          <>
            <Text style={s.section}>{t('auth.profile.sections.subscription')}</Text>
            <ListRow
              title={t('auth.profile.subscription.rituelProTitle')}
              subtitle={premiumSubtitle}
              onPress={() =>
                Linking.openURL('https://apps.apple.com/account/subscriptions').catch(() => {})
              }
            />
          </>
        )}

        <Text style={s.section}>{t('auth.profile.sections.forYou')}</Text>

        <PremiumCard variant="cream" style={{ marginBottom: Sp.sm }}>
          <Text style={s.recoLabel}>{t('auth.profile.reco.kicker')}</Text>
          <Text style={s.recoTitle}>{t('auth.profile.reco.title')}</Text>
          <Text style={s.recoSub}>{t('auth.profile.reco.subtitle')}</Text>
        </PremiumCard>

{favoriteProducts.length > 0 ? (
          <View style={s.ritualSection}>
            <Text style={s.section}>{t('auth.profile.sections.inMyRitual')}</Text>
            <View style={s.ritualChipsWrap}>
              {favoriteProducts.map((name) => (
                <Pressable
                  key={name}
                  onPress={() => router.push(`/product-discovery/${encodeURIComponent(name)}` as any)}
                  style={s.ritualChip}
                  hitSlop={4}
                >
                  <Text style={s.ritualChipTxt} numberOfLines={1}>{name}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}
<View style={s.skinQuizSection}>
                  <Text style={s.section}>{t('auth.profile.sections.discoverSkin')}</Text>
                  {(() => {
                    const sp = memory?.skin_profile;
                    const hasProfile = !!(sp?.skin_type || sp?.sensitivity || sp?.goal);
                    const summaryLines: string[] = [];
                    if (sp?.skin_type) {
                      const v = t(`skinQuiz.q.skin_type.choices.${sp.skin_type}`);
                      summaryLines.push(t('auth.profile.skinQuiz.summary.skinType').replace('{value}', v));
                    }
                    if (sp?.sensitivity) {
                      const v = t(`skinQuiz.q.sensitivity.choices.${sp.sensitivity}`);
                      summaryLines.push(t('auth.profile.skinQuiz.summary.sensitivity').replace('{value}', v));
                    }
                    if (sp?.goal) {
                      const v = t(`skinQuiz.q.goal.choices.${sp.goal}`);
                      summaryLines.push(t('auth.profile.skinQuiz.summary.goal').replace('{value}', v));
                    }
                    return (
                      <Pressable
                        onPress={() => router.push('/profile/skin-quiz' as any)}
                        style={s.skinQuizCard}
                        hitSlop={4}
                      >
                        <View style={{ flex: 1 }}>
                          {hasProfile ? (
                            <>
                              <Text style={s.skinQuizTitle}>{t('auth.profile.skinQuiz.title')}</Text>
                              <View style={s.skinQuizSummaryRows}>
                                {summaryLines.map((line) => (
                                  <Text key={line} style={s.skinQuizSummaryLine}>{line}</Text>
                                ))}
                                <Text style={s.skinQuizUpdateCta}>{t('auth.profile.skinQuiz.update')}</Text>
                              </View>
                            </>
                          ) : (
                            <>
                              <Text style={s.skinQuizTitle}>{t('auth.profile.skinQuiz.emptyTitle')}</Text>
                              <Text style={s.skinQuizSub}>
                                {t('auth.profile.skinQuiz.emptySubtitle')}
                              </Text>
                            </>
                          )}
                        </View>
                        <Text style={s.skinQuizArrow}>›</Text>
                      </Pressable>
                    );
                  })()}
                </View>

                                <Text style={s.section}>{t('auth.profile.sections.quickAccess')}</Text>
        <ListRow
          title={t('auth.profile.rows.journal.title')}
          subtitle={t('auth.profile.rows.journal.subtitle')}
          onPress={() => router.push('/glow-timeline' as any)}
        />
        <ListRow
          title={t('auth.profile.rows.energy.title')}
          subtitle={t('auth.profile.rows.energy.subtitle')}
          onPress={() => router.push('/score' as any)}
        />
        <ListRow
          title={t('auth.profile.rows.favorites.title')}
          subtitle={t('auth.profile.rows.favorites.subtitle')}
          onPress={() => router.push('/saved' as any)}
        />

        <ListRow
          title={t('auth.profile.rows.archive.title')}
          subtitle={t('auth.profile.rows.archive.subtitle')}
          onPress={() => router.push('/(tabs)/archive' as any)}
        />
        <ListRow
          title={t('auth.profile.rows.ritual.title')}
          subtitle={t('auth.profile.rows.ritual.subtitle')}
          onPress={() => router.push('/(tabs)/routine' as any)}
        />
        <ListRow
          title={t('auth.profile.rows.signOut.title')}
          subtitle={t('auth.profile.rows.signOut.subtitle')}
          onPress={handleSignOut}
        />
        <ListRow
          title={t('auth.profile.rows.deleteAccount.title')}
          subtitle={t('auth.profile.rows.deleteAccount.subtitle')}
          onPress={handleDeleteAccount}
        />

        <CreditPackModal
          visible={creditModalOpen}
          onClose={() => setCreditModalOpen(false)}
        />

        {__DEV__ ? (
          <Pressable onPress={handleDevLangSwitch} hitSlop={6} style={s.devLangRow}>
            <Text style={s.devLangTxt}>🔧 DEV · Language: {currentLang.toUpperCase()}</Text>
          </Pressable>
        ) : null}
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
  oauthDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Sp.md,
    marginBottom: Sp.sm,
  },
  oauthDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: C.border,
  },
  oauthDividerTxt: {
    marginHorizontal: Sp.sm,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: C.textSoft,
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
  skinQuizSection: {
    marginTop: 24,
    marginBottom: 4,
    paddingHorizontal: 0,
  },
  skinQuizCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginTop: 12,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#EFE6D7',
  },
  skinQuizTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#3A2E25',
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  skinQuizSub: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#7A6555',
    lineHeight: 17,
    letterSpacing: 0.2,
  },
  skinQuizSummaryRows: {
    marginTop: 6,
  },
  skinQuizSummaryLine: {
    fontSize: 13,
    color: '#5A4A3D',
    marginTop: 3,
    letterSpacing: 0.2,
  },
  skinQuizUpdateCta: {
    fontSize: 12,
    fontStyle: 'italic',
    color: C.copper,
    marginTop: 10,
    letterSpacing: 0.5,
  },
  skinQuizArrow: {
    fontSize: 24,
    color: C.copper,
    fontWeight: '300',
    marginLeft: 12,
  },
  devLangRow: {
    alignSelf: 'center',
    marginTop: 24,
    paddingVertical: 8,
    paddingHorizontal: 14,
    opacity: 0.4,
  },
  devLangTxt: {
    fontSize: 10,
    fontStyle: 'italic',
    color: '#A99583',
    letterSpacing: 0.5,
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