/**
 * WeekStrip — Monday-based 7-day strip for the home header.
 *
 * Pure presentational: receives localized day labels and a
 * `completed` boolean per day. Past days show a copper dot when
 * completed, a soft dot when missed (no punishment language —
 * Lune philosophy). Today is a filled copper circle; future days
 * are muted with no dot.
 */
import { StyleSheet, Text, View } from 'react-native';
import { C, Sp } from '../../theme';

type Props = {
  dayLabels: readonly string[];
  completed?: boolean[];
};

export default function WeekStrip({ dayLabels, completed = [] }: Props) {
  const now = new Date();
  const todayIdx = (now.getDay() + 6) % 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - todayIdx);
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.getDate();
  });

  return (
    <View style={s.row}>
      {dayLabels.map((label, i) => {
        const isToday = i === todayIdx;
        const isPast = i < todayIdx;
        const done = !!completed[i];
        return (
          <View key={`${label}-${i}`} style={s.col}>
            <Text style={s.day}>{label}</Text>
            {isToday ? (
              <View style={s.todayCircle}>
                <Text style={s.todayText}>{dates[i]}</Text>
              </View>
            ) : (
              <Text style={[s.date, !isPast && s.future]}>{dates[i]}</Text>
            )}
            <View
              style={[
                s.dot,
                isPast ? (done ? s.dotDone : s.dotMissed) : s.dotNone,
              ]}
            />
          </View>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Sp.md,
  },
  col: {
    alignItems: 'center',
    width: 36,
  },
  day: {
    fontSize: 10,
    fontWeight: '500',
    color: C.textSoft,
    letterSpacing: 0.4,
    marginBottom: Sp.xxs,
  },
  date: {
    fontSize: 13,
    color: C.text,
    height: 26,
    lineHeight: 26,
  },
  future: {
    color: C.textSoft,
  },
  todayCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: C.copper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayText: {
    fontSize: 13,
    color: C.appBg,
    fontWeight: '500',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: Sp.xxs,
  },
  dotDone: {
    backgroundColor: C.copper,
  },
  dotMissed: {
    backgroundColor: C.border,
  },
  dotNone: {
    backgroundColor: 'transparent',
  },
});
