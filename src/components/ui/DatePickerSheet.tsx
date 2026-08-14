import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

/**
 * The app's single date-picking surface. Shared by every booking form so the
 * calendar can never drift between them.
 */
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const startOfLocalDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

export const formatDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatDisplayDate = (date: Date) =>
  date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: '2-digit',
    year: 'numeric'
  });

const formatMonthTitle = (date: Date) =>
  date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

const getCalendarDays = (monthDate: Date) => {
  const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const firstGridDate = new Date(firstDay);
  firstGridDate.setDate(firstDay.getDate() - firstDay.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const value = new Date(firstGridDate);
    value.setDate(firstGridDate.getDate() + index);
    return value;
  });
};

type Props = {
  visible: boolean;
  /** Currently committed date, used to seed the draft when the sheet opens. */
  value: Date | null;
  onCancel: () => void;
  onConfirm: (date: Date) => void;
};

export const DatePickerSheet = ({ visible, value, onCancel, onConfirm }: Props) => {
  const insets = useSafeAreaInsets();
  const today = useMemo(() => startOfLocalDay(new Date()), []);
  const [draftDate, setDraftDate] = useState<Date | null>(value ?? today);
  const [calendarMonth, setCalendarMonth] = useState(() => value ?? today);

  // Re-seed each time the sheet opens so it always reflects the committed value,
  // falling back to today so there is always a highlighted day to confirm.
  useEffect(() => {
    if (!visible) return;
    const initial = value ?? today;
    setDraftDate(initial);
    setCalendarMonth(new Date(initial.getFullYear(), initial.getMonth(), 1));
  }, [today, value, visible]);

  const calendarDays = useMemo(() => getCalendarDays(calendarMonth), [calendarMonth]);
  const draftDateKey = draftDate ? formatDateKey(draftDate) : null;
  const todayKey = formatDateKey(today);

  const moveCalendarMonth = (offset: number) =>
    setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.modalBackdrop} onPress={onCancel}>
        <Pressable style={[styles.calendarSheet, { paddingBottom: Math.max(18, insets.bottom + 12) }]}>
          <View style={styles.calendarHeader}>
            <Pressable
              style={styles.calendarNavButton}
              onPress={() => moveCalendarMonth(-1)}
              accessibilityRole="button"
              accessibilityLabel="Previous month"
            >
              <ChevronLeft color="#0F1E33" size={22} strokeWidth={2.5} />
            </Pressable>
            <Text style={styles.calendarMonthTitle}>{formatMonthTitle(calendarMonth)}</Text>
            <Pressable
              style={styles.calendarNavButton}
              onPress={() => moveCalendarMonth(1)}
              accessibilityRole="button"
              accessibilityLabel="Next month"
            >
              <ChevronRight color="#0F1E33" size={22} strokeWidth={2.5} />
            </Pressable>
          </View>

          <View style={styles.weekdayRow}>
            {WEEKDAYS.map((day) => (
              <Text key={day} style={[styles.weekdayText, day === 'Sun' && styles.sundayText]}>
                {day}
              </Text>
            ))}
          </View>

          <View style={styles.calendarGrid}>
            {calendarDays.map((day) => {
              const dayKey = formatDateKey(day);
              const inCurrentMonth = day.getMonth() === calendarMonth.getMonth();
              const selected = draftDateKey === dayKey;
              const todayDate = todayKey === dayKey;

              return (
                <Pressable
                  key={dayKey}
                  style={[
                    styles.calendarDay,
                    selected && styles.calendarDaySelected,
                    todayDate && !selected && styles.calendarDayToday
                  ]}
                  onPress={() => setDraftDate(startOfLocalDay(day))}
                  accessibilityRole="button"
                  accessibilityLabel={formatDisplayDate(day)}
                >
                  <Text
                    style={[
                      styles.calendarDayText,
                      !inCurrentMonth && styles.calendarDayMuted,
                      todayDate && !selected && styles.calendarDayTodayText,
                      selected && styles.calendarDaySelectedText
                    ]}
                  >
                    {day.getDate()}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.calendarActions}>
            <Pressable style={styles.calendarCancel} onPress={onCancel} accessibilityRole="button">
              <Text style={styles.calendarCancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.calendarConfirm, !draftDate && styles.calendarConfirmDisabled]}
              disabled={!draftDate}
              onPress={() => draftDate && onConfirm(draftDate)}
              accessibilityRole="button"
            >
              <Text style={styles.calendarConfirmText}>Confirm</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15, 23, 42, 0.34)' },
  calendarSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#FFFBF2',
    paddingHorizontal: 18,
    paddingTop: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 10
  },
  calendarHeader: { height: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  calendarNavButton: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E8DED2'
  },
  calendarMonthTitle: { color: '#0F1E33', fontSize: 16, fontWeight: '900' },
  weekdayRow: { flexDirection: 'row', marginTop: 14, marginBottom: 8 },
  weekdayText: { flex: 1, color: '#64748B', textAlign: 'center', fontSize: 11, fontWeight: '900' },
  sundayText: { color: '#B42318' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calendarDay: { width: `${100 / 7}%`, height: 42, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  calendarDaySelected: { borderRadius: 14, backgroundColor: '#F5A400' },
  calendarDayToday: { borderRadius: 14, backgroundColor: '#FFF3D4', borderWidth: 1, borderColor: '#F5A400' },
  calendarDayText: { color: '#0F1E33', fontSize: 13, fontWeight: '800' },
  calendarDayMuted: { color: '#C0B7A8' },
  calendarDayTodayText: { color: '#B77900' },
  calendarDaySelectedText: { color: '#FFFFFF' },
  calendarActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  calendarCancel: {
    flex: 1,
    height: 48,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8DED2',
    alignItems: 'center',
    justifyContent: 'center'
  },
  calendarCancelText: { color: '#64748B', fontSize: 14, fontWeight: '900' },
  calendarConfirm: {
    flex: 1,
    height: 48,
    borderRadius: 15,
    backgroundColor: '#F7B500',
    alignItems: 'center',
    justifyContent: 'center'
  },
  calendarConfirmDisabled: { opacity: 0.5 },
  calendarConfirmText: { color: '#0F1E33', fontSize: 14, fontWeight: '900' }
});
