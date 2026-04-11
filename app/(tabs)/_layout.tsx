import { Tabs } from 'expo-router';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Svg, { Circle, Ellipse, Line, Path, Polyline, Rect } from 'react-native-svg';
import { initializePurchases } from '../../utils/purchases';

function HomeIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <Polyline points="9 22 9 12 15 12 15 22" />
    </Svg>
  );
}

function ArchiveIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Polyline points="21 8 21 21 3 21 3 8" />
      <Rect x={1} y={3} width={22} height={5} />
      <Line x1={10} y1={12} x2={14} y2={12} />
    </Svg>
  );
}

function ScannerIcon({ color }: { color: string }) {
  return (
    <Svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round">
      <Path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
      <Circle cx={12} cy={13} r={4} />
    </Svg>
  );
}

function JournalIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Rect x={3} y={3} width={18} height={18} rx={3} />
      <Circle cx={8.5} cy={8.5} r={1.5} />
      <Path d="M21 15l-5-5L5 21" />
    </Svg>
  );
}

function ProfileIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round">
      <Path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <Circle cx={12} cy={7} r={4} />
    </Svg>
  );
}

export default function TabLayout() {
  useEffect(() => {
    initializePurchases();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#FDF8F5',
            borderTopColor: '#E8D5C8',
            borderTopWidth: 0.5,
            height: 80,
            paddingBottom: 16,
            paddingTop: 10,
            elevation: 0,
            shadowOpacity: 0,
          },
          tabBarActiveTintColor: '#B8856A',
          tabBarInactiveTintColor: '#C9B5A8',
          tabBarLabelStyle: {
            fontSize: 9,
            fontWeight: '500',
            textTransform: 'uppercase',
            letterSpacing: 0.6,
            marginTop: 3,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Accueil',
            tabBarIcon: ({ color }) => <HomeIcon color={color} />,
          }}
        />
        <Tabs.Screen
          name="archive"
          options={{
            title: 'Produits',
            tabBarIcon: ({ color }) => <ArchiveIcon color={color} />,
          }}
        />
        <Tabs.Screen
          name="scanner"
          options={{
            title: 'Scanner',
            tabBarIcon: ({ color, focused }) => (
              <Svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke={focused ? '#B8856A' : '#C9B5A8'} strokeWidth={1.8} strokeLinecap="round">
                <Path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                <Circle cx={12} cy={13} r={4} />
              </Svg>
            ),
          }}
        />
        <Tabs.Screen
          name="journal"
          options={{
            title: 'Journal',
            tabBarIcon: ({ color }) => <JournalIcon color={color} />,
          }}
        />
        <Tabs.Screen
          name="auth"
          options={{
            title: 'Profil',
            tabBarIcon: ({ color }) => <ProfileIcon color={color} />,
          }}
        />
        <Tabs.Screen name="discover" options={{ href: null }} />
        <Tabs.Screen name="community" options={{ href: null }} />
        <Tabs.Screen name="routine" options={{ href: null }} />
        <Tabs.Screen name="compatibility" options={{ href: null }} />
        <Tabs.Screen name="onboarding" options={{ href: null }} />
        <Tabs.Screen name="explore" options={{ href: null }} />
        <Tabs.Screen name="skin-analysis" options={{ href: null }} />
      </Tabs>
    </GestureHandlerRootView>
  );
}
