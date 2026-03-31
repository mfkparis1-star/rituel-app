import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarStyle: {
        backgroundColor: '#08080E',
        borderTopColor: '#1C1C2E',
        height: 60,
      },
      tabBarActiveTintColor: '#C9A96E',
      tabBarInactiveTintColor: '#6B6278',
      tabBarLabelStyle: {
        fontSize: 9,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
      },
    }}>
      <Tabs.Screen name="index" options={{ title: 'Ana Sayfa', tabBarIcon: () => null }} />
      <Tabs.Screen name="archive" options={{ title: 'Arşiv', tabBarIcon: () => null }} />
      <Tabs.Screen name="routine" options={{ title: 'Rutin', tabBarIcon: () => null }} />
      <Tabs.Screen name="community" options={{ title: 'Topluluk', tabBarIcon: () => null }} />
      <Tabs.Screen name="explore" options={{ href: null }} />
    </Tabs>
  );
}