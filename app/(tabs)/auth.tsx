import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import HeroCard from '../../components/ui/HeroCard';
import ListRow from '../../components/ui/ListRow';
import PillButton from '../../components/ui/PillButton';
import PremiumCard from '../../components/ui/PremiumCard';
import StatCard from '../../components/ui/StatCard';
import { C, R, Sh, Sp, Type } from '../../theme';

type AuthMode = 'login' | 'register' | 'profile';

export default function AuthScreen() {
  const [mode, setMode] = useState<AuthMode>('profile');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const profile = {
    displayName: 'Demo',
    email: 'demo@rituel.app',
    lastAnalysisDays: 3,
    productCount: 0,
    analysisCount: 1,
    routineActive: true,
    creditBalance: 0,
    isPremium: false,
  };

  if (mode === 'login' || mode === 'register') {
    return (
      <SafeAreaView style={s.root} edges={['top']}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          <View style={s.header}>
            <Text style={s.brand}>RITUEL</Text>
            <Text style={s.title}>
              {mode === 'login' ? 'Connexion' : 'Inscription'}
            </Text>
            <Text style={s.subtitle}>
              {mode === 'login'
                ? 'Retrouve ton rituel beauté'
                : 'Crée ton compte pour commencer'}
            </Text>
          </View>

          <View style={[s.formCard, Sh.soft]}>
            {mode === 'register' && (
              <>
                <Text style={s.fieldLabel}>NOM</Text>
                <TextInput
                  style={s.input}
                  placeholder="Votre nom"
                  placeholderTextColor={C.textSoft}
                  value={name}
                  onChangeText={setName}
                  autoCorrect={false}
                />
              </>
            )}

            <Text style={s.fieldLabel}>EMAIL</Text>
            <TextInput
              style={s.input}
              placeholder="vous@email.com"
              placeholderTextColor={C.textSoft}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={s.fieldLabel}>MOT DE PASSE</Text>
            <TextInput
              style={s.input}
              placeholder="••••••••"
              placeholderTextColor={C.textSoft}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />

            <PillButton
              label={mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
              variant="primary"
              fullWidth
              style={{ marginTop: Sp.md }}
            />
          </View>

          <View style={s.switchRow}>
            <Text style={s.switchTxt}>
              {mode === 'login' ? 'Pas encore de compte ?' : 'Déjà inscrite ?'}
            </Text>
            <Text
              style={s.switchLink}
              onPress={() => setMode(mode === 'login' ? 'register' : 'login')}
            >
              {mode === 'login' ? 'S\'inscrire' : 'Se connecter'}
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={[s.profileCard, Sh.soft]}>
          <View style={s.avatar}>
            <Text style={s.avatarLetter}>{profile.displayName[0]}</Text>
          </View>
          <Text style={s.profileName}>{profile.displayName}</Text>
          <Text style={s.profileEmail}>{profile.email}</Text>
          <Text style={s.profileMeta}>
            Dernière analyse : il y a {profile.lastAnalysisDays}j
          </Text>
        </View>

        <View style={s.statsRow}>
          <StatCard label="Produit" value={profile.productCount} />
          <View style={s.gap} />
          <StatCard label="Analyse" value={profile.analysisCount} />
          <View style={s.gap} />
          <StatCard label="Routine" value={profile.routineActive ? 'Active' : '—'} />
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
            profile.isPremium
              ? 'Inclus avec Rituel Pro'
              : `${profile.creditBalance} crédit${profile.creditBalance !== 1 ? 's' : ''} disponible${profile.creditBalance !== 1 ? 's' : ''}`
          }
          onPress={() => router.push('/paywall' as any)}
        />

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
            style={{ marginTop: Sp.md, backgroundColor: C.white }}
          />
        </PremiumCard>

        <Text style={s.section}>POUR TOI</Text>

        <PremiumCard variant="cream" style={{ marginBottom: Sp.sm }}>
          <Text style={s.recoLabel}>RECOMMANDATION</Text>
          <Text style={s.recoTitle}>Hydrate ta peau ce soir</Text>
          <Text style={s.recoSub}>
            Une routine apaisante adaptée à ton rituel du soir.
          </Text>
        </PremiumCard>

        <Text style={s.section}>ACCÈS RAPIDE</Text>

        <ListRow
          title="Mon archive"
          subtitle="Tes produits, ton suivi"
          onPress={() => router.push('/(tabs)/archive' as any)}
        />
        <ListRow
          title="Journal de peau"
          subtitle="Évolution semaine après semaine"
          onPress={() => router.push('/(tabs)/journal' as any)}
        />
        <ListRow
          title="Mon rituel"
          subtitle="Routine matin et soir"
          onPress={() => router.push('/(tabs)/routine' as any)}
        />
        <ListRow
          title="Compte"
          subtitle="Paramètres et confidentialité"
          onPress={() => setMode('login')}
        />

        <View style={{ height: Sp.huge }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.appBg },
  scroll: { paddingHorizontal: Sp.lg, paddingTop: Sp.sm, paddingBottom: Sp.xl },
  header: { marginBottom: Sp.xl, marginTop: Sp.sm, alignItems: 'center' },
  brand: {
    fontSize: 11,
    fontWeight: '700',
    color: C.copper,
    letterSpacing: 2.4,
    marginBottom: Sp.lg,
  },
  title: { ...Type.h1, marginBottom: 4, textAlign: 'center' },
  subtitle: { ...Type.body, color: C.textMid, textAlign: 'center' },
  formCard: {
    backgroundColor: C.white,
    borderRadius: R.lg,
    padding: Sp.lg,
    marginBottom: Sp.md,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: C.copper,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: Sp.xs,
    marginTop: Sp.sm,
  },
  input: {
    backgroundColor: C.cream,
    borderRadius: R.sm,
    paddingHorizontal: Sp.md,
    paddingVertical: 12,
    fontSize: 14,
    color: C.text,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Sp.md,
  },
  switchTxt: {
    fontSize: 13,
    color: C.textMid,
    marginRight: 6,
  },
  switchLink: {
    fontSize: 13,
    fontWeight: '600',
    color: C.copper,
  },
  profileCard: {
    backgroundColor: C.white,
    borderRadius: R.lg,
    padding: Sp.xl,
    alignItems: 'center',
    marginBottom: Sp.lg,
    marginTop: Sp.sm,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: C.cream,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Sp.sm,
  },
  avatarLetter: {
    fontSize: 24,
    fontWeight: '600',
    color: C.espresso,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '600',
    color: C.text,
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 13,
    color: C.textMid,
    marginBottom: Sp.xs,
  },
  profileMeta: {
    fontSize: 11,
    color: C.textSoft,
    letterSpacing: 0.4,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: Sp.lg,
  },
  gap: { width: Sp.xs },
  premium: {
    marginTop: Sp.md,
    marginBottom: Sp.md,
  },
  premiumLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: C.copper,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    marginBottom: Sp.xs,
  },
  premiumTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: C.white,
    marginBottom: Sp.xs,
  },
  premiumSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.78)',
    lineHeight: 19,
  },
  section: {
    fontSize: 11,
    fontWeight: '700',
    color: C.copper,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    marginTop: Sp.lg,
    marginBottom: Sp.sm,
  },
  recoLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: C.copper,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: Sp.xs,
  },
  recoTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: C.text,
    marginBottom: 4,
  },
  recoSub: {
    fontSize: 13,
    color: C.textMid,
    lineHeight: 19,
  },
});
