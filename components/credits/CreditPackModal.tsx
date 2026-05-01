import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import PillButton from '../ui/PillButton';
import { CREDIT_PACKS } from '../../utils/credits';
import { useCredits } from '../../hooks/useCredits';
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

  const handleBuy = async (amount: number, label: string) => {
    // Phase 14: real RevenueCat purchase wiring goes here.
    // For now: simulate a successful credit grant via local helper.
    const r = await add(amount, `pack_${amount}`);
    if (r.ok) {
      Alert.alert('✨', `${amount} crédit${amount > 1 ? 's' : ''} ajouté${amount > 1 ? 's' : ''}.`);
      onSuccess?.(amount);
      onClose();
    } else {
      Alert.alert('Erreur', 'Impossible d\'ajouter les crédits pour le moment.');
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
            <Text style={s.label}>CRÉDITS IA</Text>
            <Text style={s.title}>Débloquez des analyses IA</Text>
            <Text style={s.subtitle}>
              Achat unique. Pas d'abonnement. Crédits valables sans limite de temps.
            </Text>
            <Text style={s.balance}>
              Solde actuel : {balance} crédit{balance > 1 ? 's' : ''}
            </Text>
          </View>

          {CREDIT_PACKS.map((p) => (
            <View key={p.id} style={[s.packCard, Sh.soft]}>
              {p.popular && (
                <View style={s.badge}>
                  <Text style={s.badgeTxt}>POPULAIRE</Text>
                </View>
              )}
              {p.best && (
                <View style={[s.badge, s.badgeBest]}>
                  <Text style={s.badgeTxt}>MEILLEURE OFFRE</Text>
                </View>
              )}

              <View style={s.packLeft}>
                <Text style={s.packAmount}>
                  {p.amount} crédit{p.amount > 1 ? 's' : ''}
                </Text>
                <Text style={s.packPrice}>{p.priceLabel}</Text>
              </View>

              <PillButton
                label="Acheter"
                variant="primary"
                size="sm"
                onPress={() => handleBuy(p.amount, p.priceLabel)}
              />
            </View>
          ))}

          <Text style={s.note}>
            Premium = accès illimité (les crédits ne sont pas nécessaires).
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
