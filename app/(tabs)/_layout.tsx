import { Tabs, router } from 'expo-router';
import Svg, { Circle, Path, Polyline, Rect } from 'react-native-svg';
import { C } from '../../theme';
import { useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import { useOnboarded } from '../../hooks/useOnboarded';

function HomeIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <Polyline points="9 22 9 12 15 12 15 22" />
    </Svg>
  );
}

function ArchiveIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <Polyline points="21 8 21 21 3 21 3 8" />
      <Rect x={1} y={3} width={22} height={5} />
      <Path d="M10 12h4" />
    </Svg>
  );
}

function StudioIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 2l2.5 6 6 .5-4.5 4 1.5 6-5.5-3-5.5 3 1.5-6-4.5-4 6-.5z" />
    </Svg>
  );
}

function CommunityIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <Circle cx={9} cy={7} r={4} />
      <Path d="M23 21v-2a4 4 0 00-3-3.87" />
      <Path d="M16 3.13a4 4 0 010 7.75" />
    </Svg>
  );
}

function ProfileIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <Circle cx={12} cy={7} r={4} />
    </Svg>
  );
}

export default function TabLayout() {
  const [session, setSession] = useState<Session | null>(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);
  const { onboarded, loading: onboardedLoading } = useOnboarded(session?.user?.id);
  useEffect(() => {
    if (!onboardedLoading && session?.user?.id && onboarded === false) {
      router.replace('/onboarding' as any);
    }
  }, [onboarded, onboardedLoading, session?.user?.id]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: C.appBg,
          borderTopColor: C.border,
          borderTopWidth: 0.5,
          height: 80,
          paddingBottom: 16,
          paddingTop: 10,
          elevation: 0,
        },
        tabBarActiveTintColor: C.copper,
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
      <Tabs.Screen name="index" options={{ title: 'Accueil', tabBarIcon: ({ color }) => <HomeIcon color={color} /> }} />
      <Tabs.Screen name="archive" options={{ title: 'Produits', tabBarIcon: ({ color }) => <ArchiveIcon color={color} /> }} />
      <Tabs.Screen name="ai-studio" options={{ title: 'Studio IA', tabBarIcon: ({ color }) => <StudioIcon color={color} /> }} />
      <Tabs.Screen name="community" options={{ title: 'Communauté', tabBarIcon: ({ color }) => <CommunityIcon color={color} /> }} />
      <Tabs.Screen name="auth" options={{ title: 'Profil', tabBarIcon: ({ color }) => <ProfileIcon color={color} /> }} />

      <Tabs.Screen name="skin-analysis" options={{ href: null }} />
      <Tabs.Screen name="makeup" options={{ href: null }} />
      <Tabs.Screen name="routine" options={{ href: null }} />
      <Tabs.Screen name="compatibility" options={{ href: null }} />
    </Tabs>
  );
}
