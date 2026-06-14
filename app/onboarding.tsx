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
import { trackEvent } from '../utils/analytics';
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
import { useLanguage } from '../hooks/useLanguage';

const { width: SCREEN_W } = Dimensions.get('window');

export default function OnboardingScreen() {
  const { t } = useLanguage();
  const SLIDES = [
    {
      kind: t('onboarding.slide1.kicker'),
      headline: t('onboarding.slide1.headline'),
      subtitle: t('onboarding.slide1.subtitle'),
      mark: '✦',
    },
    {
      kind: t('onboarding.slide2.kicker'),
      headline: t('onboarding.slide2.headline'),
      subtitle: t('onboarding.slide2.subtitle'),
      mark: '❀',
    },
    {
      kind: t('onboarding.slide3.kicker'),
      headline: t('onboarding.slide3.headline'),
      subtitle: t('onboarding.slide3.subtitle'),
      mark: '♡',
    },
  ];
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
    trackEvent('onboarding_completed');
    await markOnboarded();
    // Lead straight into the skin quiz so the first run personalizes
    // and shows value, instead of dropping onto an empty Accueil. The
    // quiz is fully skippable and exits to Accueil when reached this way.
    router.replace('/profile/skin-quiz?from=onboarding' as any);
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
          <Text style={s.skipTxt}>{t('onboarding.skip')}</Text>
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
              label={t('onboarding.start')}
              variant="primary"
              fullWidth
              onPress={finish}
            />
          </View>
        ) : (
          <View style={s.ctaWrap}>
            <Text style={s.hint}>{t('onboarding.swipeHint')}</Text>
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
