import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAIUnlock, AIScope } from '../../hooks/useAIUnlock';
import CreditPackModal from './CreditPackModal';
import { useLanguage } from '../../hooks/useLanguage';
import { C, G, R, Sh, Sp, Type } from '../../theme';

type Props = {
  scope: AIScope;
  resultId: string;
  onUnlocked: () => void;
  title?: string;
  description?: string;
};

function SparkleIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 2l2.5 6 6 .5-4.5 4 1.5 6-5.5-3-5.5 3 1.5-6-4.5-4 6-.5z" />
    </Svg>
  );
}

export default function LockedAICard({ scope, resultId, onUnlocked, title, description }: Props) {
  const { unlock, balance, isPremium } = useAIUnlock(scope);
  const { t } = useLanguage();
  const [unlocking, setUnlocking] = useState(false);
  const [packsVisible, setPacksVisible] = useState(false);

  const displayTitle = title || t(`lockedAI.scopes.${scope}.title`);
  const displayDesc = description || t(`lockedAI.scopes.${scope}.description`);

  const handleUnlock = async () => {
    if (unlocking) return;
    if (isPremium) {
      onUnlocked();
      return;
    }
    setUnlocking(true);
    try {
      const r = await unlock(resultId);
      if (r.ok) {
        onUnlocked();
      } else if (r.reason === 'insufficient') {
        setPacksVisible(true);
      } else {
        Alert.alert(
          t('lockedAI.errorTitle'),
          t('lockedAI.errorBody')
        );
      }
    } finally {
      setUnlocking(false);
    }
  };

  const handlePremium = () => {
    router.push('/paywall' as any);
  };

  return (
    <>
      <LinearGradient colors={G.espresso} style={[s.card, Sh.medium]}>
        <View style={s.iconBox}>
          <SparkleIcon color={C.copper} />
        </View>

        <Text style={s.label}>{t('lockedAI.label')}</Text>
        <Text style={s.title}>{displayTitle}</Text>
        <Text style={s.desc}>{displayDesc}</Text>

        <Pressable
          onPress={handleUnlock}
          disabled={unlocking}
          style={({ pressed }) => [
            s.cta,
            pressed && { opacity: 0.92 },
            unlocking && { opacity: 0.7 },
          ]}
        >
          {unlocking ? (
            <ActivityIndicator color={C.espresso} />
          ) : (
            <Text style={s.ctaTxt}>
              {isPremium ? t('lockedAI.unlockPremium') : t('lockedAI.unlockCredit')}
            </Text>
          )}
        </Pressable>

        {!isPremium && (
          <>
            <Text style={s.balanceTxt}>
              {t('lockedAI.balancePrefix')} : {balance} {balance > 1 ? t('lockedAI.creditMany') : t('lockedAI.creditOne')}
            </Text>
            <Pressable onPress={handlePremium} hitSlop={8}>
              <Text style={s.premiumLink}>{t('lockedAI.premiumLink')}</Text>
            </Pressable>
          </>
        )}
      </LinearGradient>

      <CreditPackModal
        visible={packsVisible}
        onClose={() => setPacksVisible(false)}
        onSuccess={() => {
          setPacksVisible(false);
        }}
      />
    </>
  );
}

const s = StyleSheet.create({
  card: {
    borderRadius: R.lg,
    padding: Sp.xl,
    alignItems: 'center',
    marginVertical: Sp.md,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Sp.md,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: C.copper,
    letterSpacing: 2,
    marginBottom: Sp.xs,
  },
  title: {
    fontSize: 18,
    fontWeight: '500',
    color: C.white,
    marginBottom: Sp.xs,
    textAlign: 'center',
  },
  desc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.78)',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: Sp.lg,
    paddingHorizontal: Sp.md,
  },
  cta: {
    backgroundColor: C.copper,
    borderRadius: R.full,
    paddingHorizontal: Sp.xl,
    paddingVertical: Sp.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 200,
    marginBottom: Sp.sm,
  },
  ctaTxt: {
    fontSize: 14,
    fontWeight: '600',
    color: C.espresso,
  },
  balanceTxt: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: Sp.xs,
  },
  premiumLink: {
    fontSize: 12,
    color: C.copper,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
});
