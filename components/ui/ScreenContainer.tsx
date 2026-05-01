import { ReactNode } from 'react';
import { ScrollView, StatusBar, StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C } from '../../theme';

type Props = {
  children: ReactNode;
  scroll?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
};

export default function ScreenContainer({
  children,
  scroll = true,
  style,
  contentStyle,
  edges = ['top'],
}: Props) {
  return (
    <SafeAreaView style={[s.root, style]} edges={edges}>
      <StatusBar barStyle="dark-content" backgroundColor={C.appBg} />
      {scroll ? (
        <ScrollView
          style={s.scroll}
          contentContainerStyle={[s.scrollContent, contentStyle]}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[s.scrollContent, contentStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.appBg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
});