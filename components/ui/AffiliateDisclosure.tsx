import { StyleSheet, Text, View } from 'react-native';
import { useLanguage } from '../../hooks/useLanguage';
import { C, R, Sp } from '../../theme';

export default function AffiliateDisclosure() {
  const { t } = useLanguage();

  return (
    <View style={s.box}>
      <Text style={s.text}>{t('affiliate.disclosure')}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  box: {
    backgroundColor: C.cream,
    borderRadius: R.sm,
    padding: Sp.sm,
    marginVertical: Sp.sm,
  },
  text: {
    fontSize: 11,
    color: C.textSoft,
    lineHeight: 16,
    textAlign: 'center',
  },
});
