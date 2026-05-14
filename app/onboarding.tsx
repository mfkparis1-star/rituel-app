/**
 * Phase 16F.1 — Welcome onboarding screen
 *
 * 3 luxury full-screen slides, swipeable. "Passer" top-right on every
 * slide. "Commencer" CTA at the bottom of the final slide. Both flip
 * profiles.onboarded to true and navigate to /(tabs).
 *
 * Triggered from the root layout when profile.onboarded === false.
 */
import { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import OnboardingSlide from '../components/onboarding/OnboardingSlide';
import PillButton from '../components/ui/PillButton';
import { useOnboarded } from '../hooks/useOnboarded';
import { C, Sp } from '../theme';

const { width: SCREEN_W } = Dimensions.get('window');

const SLIDES = [
  {
    kind: 'BIENVENUE',
    headline: 'Votre journal de beauté\nvous attend.',
    subtitle: "Un espace intime, pensé pour vous. Pas un coach, pas un réseau social — juste votre histoire, jour après jour.",
    mark: '✦',
  },
  {
    kind: 'VOTRE RYTHME',
    headline: 'Chaque check-in\ncompte.',
    subtitle: 'Un emoji, une note libre. Rituel se rappelle de chaque instant pour mieux vous accompagner. La Glow Timeline garde votre histoire.',
    mark: '❀',
  },
  {
    kind: 'COMMUNAUTÉ',
    headline: 'Inspirée par celles\nqui vous ressemblent.',
    subtitle: 'Partagez vos rituels, sauvegardez vos inspirations. Pas de comparaisons, pas d\'algorithme agressif — un journal collectif.',
    mark: '♡',
  },
];

export default function OnboardingScreen() {
  const [session, setSession] = useState<Session | null>(null);
  const [index, setIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const { markOnboarded } = useOnboarded(session?.user?.id);

  const finish = async () => {
    await markOnboarded();
    router.replace('/(tabs)');
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const i = Math.round(x / SCREEN_W);
    if (i !== index && i >= 0 && i < SLIDES.length) {
      setIndex(i);
    }
  };

  const isLast = index === SLIDES.length - 1;

  return (
    <View style={s.root}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        bounces={false}
      >
        {SLIDES.map((slide, i) => (
          <View key={i} style={{ width: SCREEN_W }}>
            <OnboardingSlide
              kind={slide.kind}
              headline={slide.headline}
              subtitle={slide.subtitle}
              mark={<Text style={s.markChar}>{slide.mark}</Text>}
            />
          </View>
        ))}
      </ScrollView>

      {/* Top-right Passer */}
      <SafeAreaView style={s.topBar} edges={['top']} pointerEvents="box-none">
        <Pressable onPress={finish} hitSlop={16} style={s.skipBtn}>
          <Text style={s.skipTxt}>Passer</Text>
        </Pressable>
      </SafeAreaView>

      {/* Bottom — dots + CTA on last */}
      <SafeAreaView style={s.bottomBar} edges={['bottom']} pointerEvents="box-none">
        <View style={s.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                s.dot,
                i === index ? s.dotActive : null,
              ]}
            />
          ))}
        </View>

        {isLast ? (
          <View style={s.ctaWrap}>
            <PillButton
              label="Commencer"
              variant="primary"
              fullWidth
              onPress={finish}
            />
          </View>
        ) : (
          <View style={s.ctaWrap}>
            <Text style={s.hint}>Glissez pour découvrir</Text>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FBF6F1',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'flex-end',
    paddingHorizontal: Sp.lg,
  },
  skipBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 100,
  },
  skipTxt: {
    fontSize: 14,
    fontWeight: '500',
    color: '#7A6555',
    letterSpacing: 0.3,
  },
  markChar: {
    fontSize: 48,
    color: C.copper,
    opacity: 0.85,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Sp.xl,
    paddingBottom: Sp.lg,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: Sp.lg,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 100,
    backgroundColor: '#D4C5B0',
  },
  dotActive: {
    backgroundColor: C.copper,
    width: 24,
  },
  ctaWrap: {
    minHeight: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hint: {
    fontSize: 13,
    color: '#A99583',
    fontStyle: 'italic',
    letterSpacing: 0.3,
  },
});
