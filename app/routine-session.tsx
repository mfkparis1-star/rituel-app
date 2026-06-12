/**
 * Guided "Rituel du Soir" session (Phase 1.2).
 *
 * Dark, calm, full-screen flow over the day's evening steps:
 *   intro  -> shows the steps, "Commencer"
 *   step   -> copper countdown ring (duration from category), large
 *             gesture hint; user confirms each step ("Étape terminée")
 *             — never auto-advances; "Passer" skips
 *   done   -> "Rituel accompli" + Garance-toned line + Lune badge
 *
 * Read-only on routine_steps. Lune badge + reflection line are
 * visual placeholders here; wired to real data in 1.4 / 1.5.
 */
import { router, Stack } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../hooks/useLanguage';
import { categoryInfo } from '../utils/routineGestures';
import { C } from '../theme';

const NIGHT = '#1D100A';
const NIGHT_LINE = '#3A2820';
const NIGHT_SOFT = '#9C8678';
const RING = 90;
const CIRC = 2 * Math.PI * RING;

type SessionStep = {
  id: string;
  product_name: string;
  brand: string | null;
  duration: string;
  category: string | null;
};

function durationSeconds(d: string): number {
  const n = parseInt(String(d).replace(/\D/g, ''), 10) || 60;
  return /min/i.test(String(d)) ? n * 60 : n;
}

export default function RoutineSessionScreen() {
  const { t } = useLanguage();
  const [steps, setSteps] = useState<SessionStep[]>([]);
  const [phase, setPhase] = useState<'intro' | 'step' | 'done'>('intro');
  const [idx, setIdx] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      const uid = sess.session?.user?.id;
      if (!uid) return;
      const { data } = await supabase
        .from('routine_steps')
        .select('id, product_name, brand, duration, category')
        .eq('user_id', uid)
        .eq('routine_type', 'soir')
        .order('step_order', { ascending: true });
      if (data) setSteps(data as SessionStep[]);
    })();
  }, []);

  // countdown for the active step
  useEffect(() => {
    if (phase !== 'step') return;
    const total = durationSeconds(steps[idx]?.duration ?? '60s');
    setRemaining(total);
    timerRef.current && clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setRemaining((r) => (r > 0 ? r - 1 : 0));
    }, 1000);
    return () => {
      timerRef.current && clearInterval(timerRef.current);
    };
  }, [phase, idx, steps]);

  const totalMin = useMemo(
    () =>
      Math.max(
        1,
        Math.round(steps.reduce((a, st) => a + durationSeconds(st.duration), 0) / 60)
      ),
    [steps]
  );

  const close = () => {
    timerRef.current && clearInterval(timerRef.current);
    router.replace('/(tabs)' as any);
  };

  const advance = () => {
    if (idx + 1 < steps.length) {
      setIdx(idx + 1);
    } else {
      timerRef.current && clearInterval(timerRef.current);
      setPhase('done');
    }
  };

  const mmss = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const current = steps[idx];
  const elapsed = current ? durationSeconds(current.duration) - remaining : 0;
  const total = current ? durationSeconds(current.duration) : 1;
  const dashoffset = CIRC * (1 - elapsed / total);
  const hint = current
    ? (() => {
        const info = categoryInfo(current.category);
        return info.hintKey ? t(info.hintKey) : '';
      })()
    : '';

  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false, animation: 'fade' }} />

      <View style={s.topbar}>
        <Pressable onPress={close} style={s.close} hitSlop={10}>
          <Text style={s.closeTxt}>✕</Text>
        </Pressable>
        <View style={s.progressMini}>
          {steps.map((_, i) => (
            <View
              key={i}
              style={[
                s.pm,
                (phase === 'done' || i < idx || (phase === 'step' && i === idx)) && s.pmOn,
              ]}
            />
          ))}
        </View>
      </View>

      {phase === 'intro' && (
        <>
          <Text style={s.eyebrow}>{t('session.eyebrow')}</Text>
          <Text style={s.bigTitle}>{t('session.introTitle')}</Text>
          <Text style={s.subtle}>
            ≈ {totalMin} {t('session.minutes')} · {t('session.atYourPace')}
          </Text>

          <View style={s.introList}>
            {steps.map((st, i) => (
              <View key={st.id} style={[s.introStep, i === steps.length - 1 && s.introStepLast]}>
                <Text style={s.introIdx}>{String(i + 1).padStart(2, '0')}</Text>
                <Text style={s.introNm}>{st.product_name}</Text>
                <Text style={s.introDu}>{st.duration}</Text>
              </View>
            ))}
          </View>

          <View style={s.controls}>
            <Pressable
              style={s.ctaMain}
              onPress={() => {
                if (steps.length === 0) { close(); return; }
                setPhase('step');
              }}
            >
              <Text style={s.ctaMainTxt}>{t('session.begin')}</Text>
            </Pressable>
            <Pressable onPress={close} hitSlop={8}>
              <Text style={s.ctaSkip}>{t('session.later')}</Text>
            </Pressable>
          </View>
        </>
      )}

      {phase === 'step' && current && (
        <>
          <Text style={s.eyebrow}>
            {t('session.stepOf').replace('{i}', String(idx + 1)).replace('{n}', String(steps.length))}
          </Text>
          <Text style={s.bigTitle}>{current.product_name}</Text>
          {current.brand ? <Text style={s.subtle}>{current.brand.toUpperCase()}</Text> : null}

          <View style={s.ringWrap}>
            <Svg width={200} height={200} viewBox="0 0 200 200">
              <Circle cx={100} cy={100} r={RING} fill="none" stroke={NIGHT_LINE} strokeWidth={3} />
              <Circle
                cx={100}
                cy={100}
                r={RING}
                fill="none"
                stroke={C.copper}
                strokeWidth={3}
                strokeLinecap="round"
                strokeDasharray={CIRC}
                strokeDashoffset={dashoffset}
                transform="rotate(-90 100 100)"
              />
            </Svg>
            <View style={s.ringCenter}>
              <Text style={s.ringTime}>{mmss(remaining)}</Text>
            </View>
          </View>

          {hint ? <Text style={s.gesture}>{hint}</Text> : <View style={{ flex: 1 }} />}

          <View style={s.controls}>
            <Pressable style={s.ctaMain} onPress={advance}>
              <Text style={s.ctaMainTxt}>{t('session.stepDone')}</Text>
            </Pressable>
            <Pressable onPress={advance} hitSlop={8}>
              <Text style={s.ctaSkip}>{t('session.skipStep')}</Text>
            </Pressable>
          </View>
        </>
      )}

      {phase === 'done' && (
        <>
          <View style={s.doneCenter}>
            <Text style={s.doneMoon}>☾</Text>
            <Text style={s.doneTitle}>{t('session.doneTitle')}</Text>
            <Text style={s.doneBody}>{t('session.doneBody')}</Text>
            <View style={s.doneLune}>
              <Text style={s.doneLuneTxt}>☾ +1 · {t('session.luneNote')}</Text>
            </View>
          </View>
          <View style={s.controls}>
            <Pressable style={s.ctaMain} onPress={close}>
              <Text style={s.ctaMainTxt}>{t('session.finish')}</Text>
            </Pressable>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: NIGHT, paddingHorizontal: 22, paddingBottom: 12 },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 18 },
  close: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  closeTxt: { fontSize: 15, color: C.cream },
  progressMini: { flexDirection: 'row', gap: 5 },
  pm: { width: 22, height: 3, borderRadius: 2, backgroundColor: NIGHT_LINE },
  pmOn: { backgroundColor: C.copper },

  eyebrow: { fontSize: 11, letterSpacing: 2, color: C.copper, textAlign: 'center', textTransform: 'uppercase', marginTop: 12 },
  bigTitle: { fontSize: 27, fontWeight: '300', color: C.cream, textAlign: 'center', marginTop: 8, marginBottom: 4 },
  subtle: { fontSize: 12, color: NIGHT_SOFT, textAlign: 'center', letterSpacing: 0.4 },

  introList: { marginTop: 28, marginBottom: 'auto' },
  introStep: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: NIGHT_LINE },
  introStepLast: { borderBottomWidth: 0 },
  introIdx: { fontSize: 13, color: C.copper, width: 18 },
  introNm: { fontSize: 15, color: C.cream, flex: 1 },
  introDu: { fontSize: 12, color: NIGHT_SOFT },

  ringWrap: { alignItems: 'center', justifyContent: 'center', marginVertical: 36, position: 'relative' },
  ringCenter: { position: 'absolute', alignItems: 'center' },
  ringTime: { fontSize: 46, fontWeight: '200', color: C.cream, letterSpacing: -1 },
  gesture: { textAlign: 'center', fontSize: 14, color: C.cream, lineHeight: 21, opacity: 0.85, marginBottom: 'auto', paddingHorizontal: 10 },

  controls: { marginTop: 24 },
  ctaMain: { backgroundColor: C.cream, borderRadius: 999, paddingVertical: 16, alignItems: 'center' },
  ctaMainTxt: { fontSize: 15, fontWeight: '600', color: NIGHT },
  ctaSkip: { textAlign: 'center', fontSize: 13, color: NIGHT_SOFT, marginTop: 16 },

  doneCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  doneMoon: { fontSize: 42, color: C.copper },
  doneTitle: { fontSize: 24, fontWeight: '300', color: C.cream, marginTop: 18, marginBottom: 8 },
  doneBody: { fontSize: 14, color: NIGHT_SOFT, textAlign: 'center', lineHeight: 22, paddingHorizontal: 16 },
  doneLune: { flexDirection: 'row', marginTop: 22, backgroundColor: 'rgba(192,138,106,0.14)', borderWidth: 1, borderColor: C.copper, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 18 },
  doneLuneTxt: { fontSize: 13, color: C.copper },
});
