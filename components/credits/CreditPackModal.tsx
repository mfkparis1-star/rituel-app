import { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import PillButton from '../ui/PillButton';
import { CREDIT_PACKS } from '../../utils/credits';
import { useCredits } from '../../hooks/useCredits';
import { purchaseProduct, addPendingGrant } from '../../utils/purchases';
import { useLanguage } from '../../hooks/useLanguage';
import { C, R, Sh, Sp, Type } from '../../theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSuccess?: (amount: number) => void;
};

function CloseIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M18 6L6 18M6 6l12 12" />
    </Svg>
  );
}

export default function CreditPackModal({ visible, onClose, onSuccess }: Props) {
  const { add, balance } = useCredits();
  const { t } = useLanguage();

  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  const creditUnit = (n: number) => (n > 1 ? t('creditPack.creditMany') : t('creditPack.creditOne'));

  const handleBuy = async (productId: string, amount: number) => {
    if (purchasingId) return;
    setPurchasingId(productId);
    try {
      const result = await purchaseProduct(productId);
      if (result.ok) {
        const grantResult = await add(amount, productId);
        if (grantResult.ok) {
          Alert.alert(
            t('creditPack.addedTitle'),
            t(amount > 1 ? 'creditPack.addedBodyMany' : 'creditPack.addedBodyOne').replace('{n}', String(amount))
          );
          onSuccess?.(amount);
          onClose();
        } else {
          await addPendingGrant({ productId, amount, timestamp: Date.now() });
          Alert.alert(
            t('creditPack.pendingTitle'),
            t('creditPack.pendingBody')
          );
          onClose();
        }
      } else if ('userCancelled' in result && result.userCancelled) {
        // silent
      } else {
        Alert.alert(
          t('creditPack.errorTitle'),
          t('creditPack.errorBody')
        );
      }
    } catch (e: any) {
      Alert.alert(
        t('creditPack.errorTitle'),
        t('creditPack.errorBody')
      );
    } finally {
      setPurchasingId(null);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={s.root}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          <View style={s.topBar}>
            <Pressable onPress={onClose} style={s.closeBtn} hitSlop={8}>
              <CloseIcon color={C.espresso} />
            </Pressable>
          </View>

          <View style={s.header}>
            <Text style={s.label}>{t('creditPack.label')}</Text>
            <Text style={s.title}>{t('creditPack.title')}</Text>
            <Text style={s.subtitle}>
              {t('creditPack.subtitle')}
            </Text>
            <Text style={s.balance}>
              {t('creditPack.balancePrefix')} : {balance} {creditUnit(balance)}
            </Text>
          </View>

          {CREDIT_PACKS.map((p) => (
            <View key={p.id} style={[s.packCard, Sh.soft]}>
              {p.popular && (
                <View style={s.badge}>
                  <Text style={s.badgeTxt}>{t('creditPack.badgePopular')}</Text>
                </View>
              )}
              {p.best && (
                <View style={[s.badge, s.badgeBest]}>
                  <Text style={s.badgeTxt}>{t('creditPack.badgeBest')}</Text>
                </View>
              )}

              <View style={s.packLeft}>
                <Text style={s.packAmount}>
                  {p.amount} {creditUnit(p.amount)}
                </Text>
                <Text style={s.packPrice}>{p.priceLabel}</Text>
              </View>

              <PillButton
                label={purchasingId === p.id ? t('creditPack.buying') : t('creditPack.buy')}
                variant="primary"
                size="sm"
                disabled={purchasingId !== null}
                onPress={() => handleBuy(p.id, p.amount)}
              />
            </View>
          ))}

          <Text style={s.note}>
            {t('creditPack.note')}
          </Text>

          <View style={{ height: Sp.huge }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.appBg },
  scroll: { paddingHorizontal: Sp.lg, paddingTop: Sp.sm, paddingBottom: Sp.xl },
  topBar: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: Sp.md },
  closeBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: C.white,
    alignItems: 'center', justifyContent: 'center',
    ...Sh.soft,
  },
  header: { marginBottom: Sp.lg },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: C.copper,
    letterSpacing: 2,
    marginBottom: Sp.sm,
  },
  title: { ...Type.h1, marginBottom: 4 },
  subtitle: {
    ...Type.body,
    color: C.textMid,
    marginBottom: Sp.sm,
  },
  balance: {
    fontSize: 12,
    color: C.copper,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  packCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.white,
    borderRadius: R.lg,
    padding: Sp.lg,
    marginBottom: Sp.sm,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -10,
    right: Sp.lg,
    backgroundColor: C.copper,
    paddingHorizontal: Sp.sm,
    paddingVertical: 4,
    borderRadius: R.full,
  },
  badgeBest: { backgroundColor: C.espresso },
  badgeTxt: {
    fontSize: 9,
    fontWeight: '700',
    color: C.white,
    letterSpacing: 1.2,
  },
  packLeft: { flex: 1 },
  packAmount: {
    fontSize: 17,
    fontWeight: '600',
    color: C.text,
    marginBottom: 2,
  },
  packPrice: {
    fontSize: 14,
    color: C.copper,
    fontWeight: '500',
  },
  note: {
    fontSize: 11,
    color: C.textSoft,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: Sp.lg,
    paddingHorizontal: Sp.md,
  },
});
