import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useCredits } from '../../hooks/useCredits';
import { useLanguage } from '../../hooks/useLanguage';
import { C, R, Sh, Sp, Type } from '../../theme';

type Props = {
  visible: boolean;
  onClose: () => void;
};

function CloseIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M18 6L6 18M6 6l12 12" />
    </Svg>
  );
}

export default function CreditPackModal({ visible, onClose }: Props) {
  const { balance } = useCredits();
  const { t } = useLanguage();
  const creditUnit = balance === 1 ? t('creditPack.creditOne') : t('creditPack.creditMany');


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
            <Pressable accessibilityRole="button" accessibilityLabel={t('common.cancel')} onPress={onClose} style={s.closeBtn} hitSlop={8}>
              <CloseIcon color={C.espresso} />
            </Pressable>
          </View>

          <View style={s.header}>
            <Text style={s.label}>{t('creditPack.label')}</Text>
            <Text style={s.title}>{t('creditPack.title')}</Text>
            <Text style={s.subtitle}>
              {t('creditPack.checkoutPaused')}
            </Text>
            <Text style={s.balance}>
              {t('creditPack.balancePrefix')} : {balance} {creditUnit}
            </Text>
          </View>

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
  note: {
    fontSize: 11,
    color: C.textSoft,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: Sp.lg,
    paddingHorizontal: Sp.md,
  },
});
