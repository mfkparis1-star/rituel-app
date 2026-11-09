import { useEffect, useRef, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import PillButton from '../ui/PillButton';
import { CREDIT_CHECKOUT_ENABLED, CREDIT_PACKS, isCreditDelivered } from '../../utils/credits';
import { useCredits } from '../../hooks/useCredits';
import type { PurchasesPackage } from 'react-native-purchases';
import { getCurrentOffering, isCurrentPurchaseAccount, purchaseStorePackage } from '../../utils/purchases';
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
  const { refresh, balance, userId } = useCredits();
  const { t } = useLanguage();

  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  const [offering, setOffering] = useState<{ userId: string; packages: PurchasesPackage[] } | null>(null);
  const [reload, setReload] = useState(0);
  const purchaseInProgress = useRef(false);

  useEffect(() => {
    if (!visible || !userId) return;
    let active = true;
    void refresh();
    if (CREDIT_CHECKOUT_ENABLED) {
      setOffering(null);
      void getCurrentOffering('verified-credits-v2').then((result) => {
        if (active) setOffering({ userId, packages: result?.availablePackages ?? [] });
      });
    }
    return () => { active = false; };
  }, [visible, userId, reload, refresh]);

  const packages = offering && offering.userId === userId ? offering.packages : [];
  const creditUnit = (n: number) => (n > 1 ? t('creditPack.creditMany') : t('creditPack.creditOne'));

  const handleBuy = async (pkg: PurchasesPackage, amount: number) => {
    if (!CREDIT_CHECKOUT_ENABLED || purchaseInProgress.current || !userId) return;
    purchaseInProgress.current = true;
    setPurchasingId(pkg.product.identifier);
    try {
      const result = await purchaseStorePackage(pkg, userId);
      if (!isCurrentPurchaseAccount(userId)) return;
      if (result.ok) {
        const delivered = await isCreditDelivered(result.transactionId);
        if (!isCurrentPurchaseAccount(userId)) return;
        if (delivered) {
          await refresh();
          if (!isCurrentPurchaseAccount(userId)) return;
          Alert.alert(
            t('creditPack.addedTitle'),
            t(amount > 1 ? 'creditPack.addedBodyMany' : 'creditPack.addedBodyOne').replace('{n}', String(amount))
          );
          onSuccess?.(amount);
          onClose();
        } else {
          Alert.alert(t('creditPack.pendingTitle'), t('creditPack.pendingBody'));
        }
      } else if (!('userCancelled' in result)) {
        Alert.alert(t('creditPack.errorTitle'), t('creditPack.errorBody'));
      }
    } catch {
      if (isCurrentPurchaseAccount(userId)) {
        Alert.alert(t('creditPack.errorTitle'), t('creditPack.errorBody'));
      }
    } finally {
      purchaseInProgress.current = false;
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

          {CREDIT_PACKS.map((pack) => {
            const pkg = packages.find((item) => item.product.identifier === pack.id && item.product.priceString.trim());
            if (!pkg) return null;
            return (
              <View key={pack.id} style={[s.packCard, Sh.soft]}>
                <View style={s.packLeft}>
                  <Text style={s.packAmount}>{pack.amount} {creditUnit(pack.amount)}</Text>
                  <Text style={s.packPrice}>{pkg.product.priceString}</Text>
                </View>
                <PillButton
                  label={purchasingId === pack.id ? t('creditPack.buying') : t('creditPack.buy')}
                  variant="primary"
                  size="sm"
                  disabled={purchasingId !== null}
                  onPress={() => void handleBuy(pkg, pack.amount)}
                />
              </View>
            );
          })}
          {(!CREDIT_CHECKOUT_ENABLED || !userId || !packages.some((pkg) =>
            CREDIT_PACKS.some((pack) => pack.id === pkg.product.identifier) && pkg.product.priceString.trim()
          )) && <Text style={s.note}>{t('creditPack.unavailable')}</Text>}
          {userId && (
            <PillButton
              label={t('creditPack.refresh')}
              variant="ghost"
              size="sm"
              disabled={purchasingId !== null}
              onPress={() => setReload((value) => value + 1)}
            />
          )}

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
