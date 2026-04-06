import { Tabs } from 'expo-router';
import { useTranslation } from '../../hooks/useTranslation';

export default function TabLayout() {
  const { t } = useTranslation();
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarStyle: {
        backgroundColor: '#08080E',
        borderTopColor: '#1C1C2E',
        height: 64,
      },
      tabBarActiveTintColor: '#C9A96E',
      tabBarInactiveTintColor: '#6B6278',
      tabBarLabelStyle: {
        fontSize: 10,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
      },
    }}>
      <Tabs.Screen name="index" options={{ title: t.nav.home, tabBarIcon: () => null }} />
      <Tabs.Screen name="archive" options={{ title: t.nav.archive, tabBarIcon: () => null }} />
      <Tabs.Screen name="discover" options={{ title: t.nav.discover, tabBarIcon: () => null }} />
      <Tabs.Screen name="community" options={{ title: t.nav.community, tabBarIcon: () => null }} />
      <Tabs.Screen name="auth" options={{ title: t.nav.profile, tabBarIcon: () => null }} />
      <Tabs.Screen name="routine" options={{ href: null }} />
      <Tabs.Screen name="journal" options={{ href: null }} />
      <Tabs.Screen name="compatibility" options={{ href: null }} />
      <Tabs.Screen name="scanner" options={{ href: null }} />
      <Tabs.Screen name="onboarding" options={{ href: null }} />
      <Tabs.Screen name="explore" options={{ href: null }} />
      <Tabs.Screen name="skin-analysis" options={{ href: null }} />
    </Tabs>
  );
}