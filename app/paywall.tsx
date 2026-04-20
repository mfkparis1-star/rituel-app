import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PurchasesPackage } from 'react-native-purchases';
import { useTranslation } from '../hooks/useTranslation';
import { getOfferings, isPremium, purchasePackage, restorePurchases } from '../utils/purchases';

const T = {
  bg: '#FDF8F5', bg2: '#F5EDE6', surface: '#FFFFFF',
  accent: '#B8856A', accent2: '#8C5E46',
  dark: '#1A1310', mid: '#6B5245', light: '#E8D5C8',
  white: '#FFFFFF',
};

export default function PaywallScreen() {
  const { lang } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null);

  const lbl = (fr: string, tr: string, en: string) => lang === 'fr' ? fr : lang === 'tr' ? tr : en;

  useEffect(() => {
    loadOfferings();
  }, []);

  const loadOfferings = async () => {
    setLoading(true);
    const offering = await getOfferings();
    if (offering && offering.availablePackages.length > 0) {
      setPackages(offering.availablePackages);
      // Varsayılan olarak yıllık seçili (en karlı)
      const annual = offering.availablePackages.find(p => p.packageType === 'ANNUAL');
      setSelectedPackage(annual || offering.availablePackages[0]);
    }
    setLoading(false);
  };

  const handlePurchase = async () => {
    if (!selectedPackage) return;
    setPurchasing(true);
    try {
      const customerInfo = await purchasePackage(selectedPackage);
      if (customerInfo && isPremium(customerInfo)) {
        Alert.alert(
          '✨',
          lbl(
            'Bienvenue dans Rituel Premium !',
            'Rituel Premium\'a hoş geldin!',
            'Welcome to Rituel Premium!'
          ),
          [{ text: 'OK', onPress: () => router.back() }]
        );
      }
    } catch (e: any) {
      Alert.alert(
        lbl('Erreur', 'Hata', 'Error'),
        e?.message || lbl('Achat échoué', 'Satın alma başarısız', 'Purchase failed')
      );
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setPurchasing(true);
    const customerInfo = await restorePurchases();
    setPurchasing(false);
    if (customerInfo && isPremium(customerInfo)) {
      Alert.alert(
        '✨',
        lbl(
          'Vos achats ont été restaurés !',
          'Satın almaların geri yüklendi!',
          'Your purchases have been restored!'
        ),
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } else {
      Alert.alert(
        lbl('Info', 'Bilgi', 'Info'),
        lbl(
          'Aucun achat précédent trouvé.',
          'Önceki satın alma bulunamadı.',
          'No previous purchases found.'
        )
      );
    }
  };

  const getPackageDisplay = (pkg: PurchasesPackage) => {
    const product = pkg.product;
    const priceString = product.priceString;
    if (pkg.packageType === 'ANNUAL') {
      const monthlyEquiv = (product.price / 12).toFixed(2);
      return {
        title: lbl('Annuel', 'Yıllık', 'Annual'),
        subtitle: lbl(`Soit ${monthlyEquiv}€/mois`, `Aylık ${monthlyEquiv}€`, `That's ${monthlyEquiv}€/month`),
        price: priceString,
        period: lbl('/ an', '/ yıl', '/ year'),
        highlight: true,
      };
    }
    if (pkg.packageType === 'MONTHLY') {
      return {
        title: lbl('Mensuel', 'Aylık', 'Monthly'),
        subtitle: lbl('Facturé chaque mois', 'Her ay ücretlendirilir', 'Billed monthly'),
        price: priceString,
        period: lbl('/ mois', '/ ay', '/ month'),
        highlight: false,
      };
    }
    if (pkg.packageType === 'LIFETIME') {
      return {
        title: lbl('À vie', 'Ömür boyu', 'Lifetime'),
        subtitle: lbl('Un seul paiement', 'Tek seferlik ödeme', 'One-time payment'),
        price: priceString,
        period: '',
        highlight: false,
      };
    }
    return {
      title: product.title,
      subtitle: product.description || '',
      price: priceString,
      period: '',
      highlight: false,
    };
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false, presentation: 'modal' }} />
      <StatusBar barStyle="dark-content" backgroundColor={T.bg} />
      <SafeAreaView style={styles.container}>
        {/* Close button */}
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={T.mid} />
        </TouchableOpacity>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Brand tag */}
          <View style={styles.brandRow}>
            <View style={styles.brandDot} />
            <Text style={styles.brandText}>rituel</Text>
          </View>

          {/* Title */}
          <Text style={styles.title}>
            {lbl('Passez à', 'Geç', 'Go')}
          </Text>
          <Text style={styles.title}>
            {lbl('Rituel Premium.', 'Rituel Premium\'a.', 'Rituel Premium.')}
          </Text>
          <Text style={styles.subtitle}>
            {lbl(
              'Sans limite · Sans publicité · Sans engagement',
              'Sınırsız · Reklamsız · Taahhütsüz',
              'Unlimited · Ad-free · No commitment'
            )}
          </Text>

          {/* Hero dark card */}
          <View style={styles.heroCard}>
            <Text style={styles.heroIcon}>✨</Text>
            <Text style={styles.heroTitle}>
              {lbl('Tout débloquer', 'Her şeyin kilidini aç', 'Unlock everything')}
            </Text>
            <Text style={styles.heroText}>
              {lbl(
                'Analyses IA illimitées, journal complet, routines personnalisées et plus encore.',
                'Sınırsız AI analizi, tam journal, kişisel rutinler ve daha fazlası.',
                'Unlimited AI analyses, full journal, personalized routines and more.'
              )}
            </Text>
          </View>

          {/* Features */}
          <View style={styles.featuresContainer}>
            <FeatureRow
              icon="sparkles"
              title={lbl('Analyses IA illimitées', 'Sınırsız AI analizi', 'Unlimited AI analyses')}
              subtitle={lbl('Suivi quotidien de votre peau', 'Günlük cilt takibi', 'Daily skin tracking')}
            />
            <FeatureRow
              icon="journal"
              title={lbl('Journal peau complet', 'Tam cilt journali', 'Full skin journal')}
              subtitle={lbl('Évolution semaine après semaine', 'Haftalık ilerleme', 'Week-by-week progress')}
            />
            <FeatureRow
              icon="flash"
              title={lbl('Routines personnalisées', 'Kişisel rutinler', 'Custom routines')}
              subtitle={lbl('Conseils experts sur mesure', 'Uzman tavsiyeleri', 'Expert advice tailored to you')}
            />
            <FeatureRow
              icon="shield-checkmark"
              title={lbl('Sans publicité', 'Reklamsız', 'No ads')}
              subtitle={lbl('Une expérience pure', 'Saf deneyim', 'Pure experience')}
            />
          </View>

          {/* Pricing packages */}
          {loading ? (
            <ActivityIndicator color={T.accent} size="large" style={{ marginVertical: 40 }} />
          ) : packages.length === 0 ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>
                {lbl(
                  'Abonnements non disponibles pour le moment.',
                  'Abonelikler şu an kullanılamıyor.',
                  'Subscriptions unavailable right now.'
                )}
              </Text>
            </View>
          ) : (
            <View style={styles.packagesContainer}>
              {packages.map((pkg) => {
                const display = getPackageDisplay(pkg);
                const isSelected = selectedPackage?.identifier === pkg.identifier;
                return (
                  <TouchableOpacity
                    key={pkg.identifier}
                    style={[
                      styles.packageCard,
                      isSelected && styles.packageCardSelected,
                    ]}
                    onPress={() => setSelectedPackage(pkg)}
                    activeOpacity={0.8}
                  >
                    {display.highlight && (
                      <View style={styles.savingsBadge}>
                        <Text style={styles.savingsBadgeText}>
                          {lbl('ÉCONOMISEZ 50%', '%50 TASARRUF', 'SAVE 50%')}
                        </Text>
                      </View>
                    )}
                    <View style={styles.packageLeft}>
                      <Text style={styles.packageTitle}>{display.title}</Text>
                      <Text style={styles.packageSubtitle}>{display.subtitle}</Text>
                    </View>
                    <View style={styles.packageRight}>
                      <Text style={styles.packagePrice}>{display.price}</Text>
                      <View style={[styles.radio, isSelected && styles.radioSelected]}>
                        {isSelected && <Ionicons name="checkmark" size={16} color={T.white} />}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* CTA */}
          <TouchableOpacity
            style={[styles.ctaBtn, (!selectedPackage || purchasing) && styles.ctaBtnDisabled]}
            onPress={handlePurchase}
            disabled={!selectedPackage || purchasing}
          >
            {purchasing ? (
              <ActivityIndicator color={T.white} />
            ) : (
              <Text style={styles.ctaText}>
                {lbl('Commencer', 'Başla', 'Get started')}
              </Text>
            )}
          </TouchableOpacity>

          <Text style={styles.renewalNote}>
            {lbl(
              'Renouvellement automatique. Annulez à tout moment.',
              'Otomatik yenileme. İstediğin zaman iptal et.',
              'Auto-renews. Cancel anytime.'
            )}
          </Text>

          {/* Bottom links */}
          <View style={styles.bottomLinks}>
            <TouchableOpacity onPress={handleRestore}>
              <Text style={styles.bottomLink}>
                {lbl('Restaurer', 'Geri yükle', 'Restore')}
              </Text>
            </TouchableOpacity>
            <Text style={styles.bottomDot}>·</Text>
            <TouchableOpacity onPress={() => Linking.openURL('https://mfkparis1-star.github.io/rituel-app/privacy')}>
              <Text style={styles.bottomLink}>
                {lbl('Confidentialité', 'Gizlilik', 'Privacy')}
              </Text>
            </TouchableOpacity>
            <Text style={styles.bottomDot}>·</Text>
            <TouchableOpacity onPress={() => Linking.openURL('https://www.apple.com/legal/internet-services/itunes/dev/stdeula/')}>
              <Text style={styles.bottomLink}>
                {lbl('Conditions', 'Şartlar', 'Terms')}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

function FeatureRow({ icon, title, subtitle }: { icon: any; title: string; subtitle: string }) {
  return (
    <View style={styles.featureRow}>
      <View style={styles.featureIconBox}>
        <Ionicons name={icon} size={20} color={T.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureSubtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  scroll: { paddingHorizontal: 22, paddingTop: 60, paddingBottom: 40 },
  closeBtn: { position: 'absolute', top: 60, right: 22, zIndex: 10, width: 44, height: 44, borderRadius: 22, backgroundColor: T.white, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 24 },
  brandDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: T.accent },
  brandText: { fontSize: 16, color: T.dark, fontWeight: '400', letterSpacing: 0.3 },
  title: { fontSize: 34, fontWeight: '800', color: T.dark, lineHeight: 42 },
  subtitle: { fontSize: 14, color: T.accent2, marginTop: 12, marginBottom: 24, lineHeight: 20 },
  heroCard: { backgroundColor: T.dark, borderRadius: 22, padding: 22, marginBottom: 20 },
  heroIcon: { fontSize: 28, marginBottom: 8 },
  heroTitle: { fontSize: 20, fontWeight: '700', color: T.bg, marginBottom: 6 },
  heroText: { fontSize: 13, color: '#C9B5A8', lineHeight: 20 },
  featuresContainer: { marginBottom: 24 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: T.white, borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: T.light },
  featureIconBox: { width: 44, height: 44, borderRadius: 22, backgroundColor: T.bg2, alignItems: 'center', justifyContent: 'center' },
  featureTitle: { fontSize: 15, fontWeight: '600', color: T.dark, marginBottom: 2 },
  featureSubtitle: { fontSize: 12, color: T.mid },
  packagesContainer: { marginBottom: 20 },
  packageCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: T.white, borderRadius: 16, padding: 18, marginBottom: 10, borderWidth: 2, borderColor: T.light, position: 'relative' },
  packageCardSelected: { borderColor: T.accent, backgroundColor: T.white },
  savingsBadge: { position: 'absolute', top: -10, right: 16, backgroundColor: T.accent, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  savingsBadgeText: { fontSize: 10, fontWeight: '700', color: T.white, letterSpacing: 0.8 },
  packageLeft: { flex: 1 },
  packageTitle: { fontSize: 18, fontWeight: '700', color: T.dark, marginBottom: 4 },
  packageSubtitle: { fontSize: 12, color: T.mid },
  packageRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  packagePrice: { fontSize: 20, fontWeight: '600', color: T.dark },
  radio: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: T.light, alignItems: 'center', justifyContent: 'center' },
  radioSelected: { borderColor: T.accent, backgroundColor: T.accent },
  ctaBtn: { backgroundColor: T.accent, borderRadius: 100, padding: 18, alignItems: 'center', marginBottom: 12, shadowColor: T.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 },
  ctaBtnDisabled: { opacity: 0.5 },
  ctaText: { fontSize: 16, fontWeight: '700', color: T.white, letterSpacing: 0.3 },
  renewalNote: { fontSize: 11, color: T.mid, textAlign: 'center', marginBottom: 24, lineHeight: 16 },
  bottomLinks: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  bottomLink: { fontSize: 12, color: T.accent2, fontWeight: '500' },
  bottomDot: { fontSize: 12, color: T.light },
  errorBox: { padding: 20, backgroundColor: T.bg2, borderRadius: 14, marginBottom: 20 },
  errorText: { fontSize: 13, color: T.mid, textAlign: 'center' },
});
