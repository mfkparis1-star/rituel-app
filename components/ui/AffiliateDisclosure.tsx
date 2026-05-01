import { StyleSheet, Text, View } from 'react-native';
import { C, R, Sp } from '../../theme';

type Props = {
  lang?: 'fr' | 'en' | 'tr';
};

export default function AffiliateDisclosure({ lang = 'fr' }: Props) {
  const text =
    lang === 'fr'
      ? 'Liens partenaires. Nous pouvons recevoir une commission sur les achats effectués via ces liens, sans coût supplémentaire pour vous.'
      : lang === 'tr'
      ? 'Ortak bağlantılar. Bu bağlantılar üzerinden yapılan satın almalardan, sizin için ek bir maliyet olmadan komisyon alabiliriz.'
      : 'Affiliate links. We may earn a commission on purchases made through these links at no extra cost to you.';

  return (
    <View style={s.box}>
      <Text style={s.text}>{text}</Text>
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
