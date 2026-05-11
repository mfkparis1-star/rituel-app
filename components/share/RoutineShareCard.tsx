/**
 * Routine share card (Phase 16E E3).
 *
 * Renders the user's matin OR soir routine as a luxury list at
 * 1080×1920. Step names + optional brand are stacked vertically.
 */
import { forwardRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { C } from '../../theme';
import ShareCardFrame from './ShareCardFrame';

export type RoutineSlot = 'matin' | 'soir';

export type RoutineStepLite = {
  step_order: number;
  name: string;
  brand?: string | null;
};

type Props = {
  slot: RoutineSlot;
  steps: RoutineStepLite[];
};

const SLOT_COPY: Record<RoutineSlot, { kind: string; title: string }> = {
  matin: { kind: 'RITUEL DU MATIN', title: 'Mon rituel du matin' },
  soir:  { kind: 'RITUEL DU SOIR',  title: 'Mon rituel du soir' },
};

// Defensive fallback if slot is somehow not matched
const FALLBACK_COPY = { kind: 'RITUEL', title: 'Mon rituel' };

const RoutineShareCard = forwardRef<View, Props>(function RoutineShareCard(
  { slot, steps },
  ref
) {
  const copy = SLOT_COPY[slot] ?? FALLBACK_COPY;
  const visible = steps.slice(0, 8);
  const remaining = Math.max(0, steps.length - visible.length);

  return (
    <ShareCardFrame ref={ref} kind={copy.kind}>
      <View style={s.center}>
        <Text style={s.title}>{copy.title}</Text>
        <View style={s.divider} />

        <View style={s.list}>
          {visible.map((st, i) => (
            <View key={`${st.step_order}-${i}`} style={s.row}>
              <Text style={s.num}>{String(i + 1).padStart(2, '0')}</Text>
              <View style={s.rowText}>
                <Text style={s.name}>{st.name}</Text>
                {st.brand ? <Text style={s.brand}>{st.brand}</Text> : null}
              </View>
            </View>
          ))}
          {remaining > 0 && (
            <Text style={s.more}>+ {remaining} autre{remaining > 1 ? 's' : ''}</Text>
          )}
        </View>
      </View>
    </ShareCardFrame>
  );
});

export default RoutineShareCard;

const s = StyleSheet.create({
  center: { alignItems: 'center', flex: 1 },
  title: {
    fontSize: 56,
    color: C.espresso,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 40,
    fontStyle: 'italic',
  },
  divider: {
    width: 120,
    height: 1,
    backgroundColor: C.copper,
    marginBottom: 60,
  },
  list: {
    width: '100%',
    paddingHorizontal: 40,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 36,
  },
  num: {
    fontSize: 36,
    color: C.copper,
    fontWeight: '300',
    width: 80,
    letterSpacing: 1,
  },
  rowText: { flex: 1 },
  name: {
    fontSize: 38,
    color: C.espresso,
    fontWeight: '500',
    lineHeight: 48,
  },
  brand: {
    fontSize: 24,
    color: C.textMid,
    marginTop: 6,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  more: {
    fontSize: 26,
    color: C.textSoft,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 16,
  },
});
