import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import PillButton from '../../components/ui/PillButton';
import PremiumCard from '../../components/ui/PremiumCard';
import { C, Sh, Sp, Type } from '../../theme';

function BackArrow({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M19 12H5" />
      <Path d="M12 19l-7-7 7-7" />
    </Svg>
  );
}

function SparkleIcon({ color }: { color: string }) {
  return (
    <Svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 2v6M12 16v6M2 12h6M16 12h6" />
      <Path d="M5 5l3 3M16 16l3 3M5 19l3-3M16 8l3-3" />
    </Svg>
  );
}

export default function ScannerScreen() {
  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.topBar}>
          <Pressable onPress={() => router.back()} style={s.backBtn} hitSlop={8}>
            <BackArrow color={C.espresso} />
          </Pressable>
        </View>

        <View style={s.heroBlock}>
          <View style={s.iconBox}>
            <SparkleIcon color={C.copper} />
          </View>
          <Text style={s.label}>IDENTIFICATION IA</Text>
          <Text style={s.title}>Bientôt disponible</Text>
          <Text style={s.subtitle}>
            La reconnaissance de produit par photo arrive très bientôt.
            En attendant, vous pouvez ajouter vos produits manuellement.
          </Text>
        </View>

        <PremiumCard variant="cream" style={s.card}>
          <Text style={s.cardLabel}>EN ATTENDANT</Text>
          <Text style={s.cardTitle}>Saisie manuelle</Text>
          <Text style={s.cardSub}>
            Renseignez la marque, le nom et la catégorie en quelques secondes.
          </Text>
          <PillButton
            label="Ajouter manuellement"
            variant="primary"
            onPress={() => router.replace('/add-product' as any)}
            style={{ marginTop: Sp.md }}
          />
        </PremiumCard>

        <View style={{ height: Sp.huge }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.appBg },
  scroll: { paddingHorizontal: Sp.lg, paddingTop: Sp.sm, paddingBottom: Sp.xl },

  topBar: { flexDirection: 'row', alignItems: 'center', marginBottom: Sp.md },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: C.white,
    alignItems: 'center', justifyContent: 'center',
    ...Sh.soft,
  },

  heroBlock: {
    alignItems: 'center',
    marginTop: Sp.lg,
    marginBottom: Sp.xl,
    paddingHorizontal: Sp.md,
  },
  iconBox: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: C.cream,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Sp.lg,
  },
  label: {
    fontSize: 11, fontWeight: '700', color: C.copper,
    letterSpacing: 2, marginBottom: Sp.xs,
  },
  title: { ...Type.h1, marginBottom: Sp.xs, textAlign: 'center' },
  subtitle: {
    ...Type.body,
    color: C.textMid,
    textAlign: 'center',
    lineHeight: 21,
  },

  card: {
    marginTop: Sp.md,
  },
  cardLabel: {
    fontSize: 10, fontWeight: '700', color: C.copper,
    letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: Sp.xs,
  },
  cardTitle: {
    fontSize: 18, fontWeight: '600', color: C.text, marginBottom: 4,
  },
  cardSub: {
    fontSize: 13, color: C.textMid, lineHeight: 19,
  },
});