import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Button from '../components/Button';
import Sidebar from '../components/Sidebar';
import Text from '../components/Text';
import TextInput from '../components/TextInput';
import VerticalList from '../components/VerticalList';
import { useSidebar } from '../hooks/useSidebar';
import { useUpdateWorkScheduleMutation } from '../hooks/useWorkScheduleMutations';
import { useWorkScheduleQuery } from '../hooks/useWorkScheduleQuery';
import { useTranslations } from '../localization/LocalizationProvider';
import { MainStackParamList } from '../navigation/types';
import { useAppTheme } from '../theme/ThemeProvider';
import { WorkScheduleData, WorkScheduleDay, WorkScheduleSlot } from '../api/workScheduleTypes';
type WorkScheduleRow = [keyof WorkScheduleData, WorkScheduleDay];
const DEFAULT_SLOT: WorkScheduleSlot = { open: '00:00', close: '23:59' };

export default function WorkScheduleScreen() {
  const { theme } = useAppTheme();
  const { t } = useTranslations('app');
  const sidebar = useSidebar();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const workScheduleQuery = useWorkScheduleQuery();
  const updateWorkScheduleMutation = useUpdateWorkScheduleMutation();
  const insets = useSafeAreaInsets();
  const [weeklyShifts, setWeeklyShifts] = useState<WorkScheduleData | null>(null);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const scheduleRows = (Object.entries(weeklyShifts ?? {}) as WorkScheduleRow[]);

  useEffect(() => {
    if (workScheduleQuery.data?.data) {
      setWeeklyShifts(workScheduleQuery.data.data);
    }
  }, [workScheduleQuery.data]);

  const updateDay = (dayKey: keyof WorkScheduleData, next: WorkScheduleDay) => {
    setWeeklyShifts((prev) => (prev ? { ...prev, [dayKey]: next } : prev));
    setFormError('');
    setSuccessMessage('');
  };

  const onToggleDay = (dayKey: keyof WorkScheduleData) => {
    const dayData = weeklyShifts?.[dayKey];
    if (!dayData) return;
    updateDay(dayKey, { ...dayData, is_active: !dayData.is_active });
  };

  const onChangeTime = (dayKey: keyof WorkScheduleData, slotIndex: number, field: 'open' | 'close', value: string) => {
    const dayData = weeklyShifts?.[dayKey];
    if (!dayData) return;
    const nextSlots = [...(dayData.slots ?? [])];
    const currentSlot = nextSlots[slotIndex] ?? DEFAULT_SLOT;
    nextSlots[slotIndex] = { ...currentSlot, [field]: value };
    updateDay(dayKey, { ...dayData, slots: nextSlots });
  };

  const onAddSlot = (dayKey: keyof WorkScheduleData) => {
    const dayData = weeklyShifts?.[dayKey];
    if (!dayData) return;
    const nextSlots = [...(dayData.slots ?? []), { ...DEFAULT_SLOT }];
    updateDay(dayKey, { ...dayData, slots: nextSlots });
  };

  const onRemoveSlot = (dayKey: keyof WorkScheduleData, slotIndex: number) => {
    const dayData = weeklyShifts?.[dayKey];
    if (!dayData) return;
    const slots = dayData.slots ?? [];
    if (!slots.length) return;
    const nextSlots = slots.filter((_, index) => index !== slotIndex);
    updateDay(dayKey, { ...dayData, slots: nextSlots.length ? nextSlots : [{ ...DEFAULT_SLOT }] });
  };

  const onAddSlotFromMulti = (dayKey: keyof WorkScheduleData) => {
    const dayData = weeklyShifts?.[dayKey];
    if (!dayData) return;
    const nextSlots = [...(dayData.slots ?? [{ ...DEFAULT_SLOT }]), { ...DEFAULT_SLOT }];
    updateDay(dayKey, { ...dayData, slots: nextSlots });
  };

  const validate = (): boolean => {
    if (!weeklyShifts) return false;
    const hasInvalid = Object.values(weeklyShifts).some((day) => {
      if (!day.is_active) return false;
      return (day.slots ?? []).some((slot) => !slot?.open?.trim() || !slot?.close?.trim());
    });
    if (hasInvalid) {
      setFormError(t('work_schedule_required_field'));
      return false;
    }
    setFormError('');
    return true;
  };

  const onUpdateSchedule = async () => {
    if (!weeklyShifts || !validate()) return;
    try {
      const response = await updateWorkScheduleMutation.mutateAsync({ weeklyShifts });
      setSuccessMessage(response.message);
    } catch {
      // Mutation error is displayed from hook state.
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top', 'bottom']}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <Pressable onPress={sidebar.openSidebar} style={styles.menuButton}>
          <HamburgerIcon color={theme.colors.gray900} />
        </Pressable>
        <Text
          weight="semiBold"
          style={{ color: theme.colors.gray900, fontSize: theme.typography.size.md, lineHeight: theme.typography.lineHeight.md }}
        >
          {t('menu_work_schedule')}
        </Text>
        <View style={styles.menuButton} />
      </View>

      <View style={styles.listWrap}>
        {workScheduleQuery.isLoading ? (
          <View style={styles.centerState}>
            <ActivityIndicator color={theme.colors.primary} />
          </View>
        ) : workScheduleQuery.isError ? (
          <View style={styles.centerState}>
            <Text style={{ color: theme.colors.gray600 }}>{t('status_unknown')}</Text>
          </View>
        ) : (
          <VerticalList
            data={scheduleRows}
            keyExtractor={(item) => item[0]}
            contentContainerStyle={[styles.cardsWrap, { paddingBottom: insets.bottom + 98 }]}
            renderItem={({ item }) => (
              <DayScheduleCard
                dayKey={item[0]}
                dayData={item[1]}
                onToggle={() => onToggleDay(item[0])}
                onOpenChange={(slotIndex, value) => onChangeTime(item[0], slotIndex, 'open', value)}
                onCloseChange={(slotIndex, value) => onChangeTime(item[0], slotIndex, 'close', value)}
                onAddSlot={() => onAddSlot(item[0])}
                onRemoveSlot={(slotIndex) => onRemoveSlot(item[0], slotIndex)}
                onAddSlotFromMulti={() => onAddSlotFromMulti(item[0])}
              />
            )}
          />
        )}
      </View>

      <View
        style={[
          styles.footer,
          {
            bottom: insets.bottom + 12,
          },
        ]}
      >
        <Button
          label={updateWorkScheduleMutation.isPending ? t('work_schedule_updating_button') : t('work_schedule_update_button')}
          onPress={onUpdateSchedule}
          disabled={updateWorkScheduleMutation.isPending || workScheduleQuery.isLoading || !weeklyShifts}
          textColor={theme.colors.gray900}
          containerStyle={styles.updateButton}
        />
        {formError ? (
          <Text variant="caption" color={theme.colors.red500} style={styles.feedbackText}>
            {formError}
          </Text>
        ) : null}
        {updateWorkScheduleMutation.error?.message ? (
          <Text variant="caption" color={theme.colors.red500} style={styles.feedbackText}>
            {updateWorkScheduleMutation.error.message}
          </Text>
        ) : null}
        {successMessage ? (
          <Text variant="caption" color={theme.colors.emerald900} style={styles.feedbackText}>
            {successMessage}
          </Text>
        ) : null}
      </View>

      <Sidebar
        visible={sidebar.sidebarOpen}
        availability={sidebar.availability}
        onAvailabilityChange={sidebar.setAvailability}
        onClose={sidebar.closeSidebar}
        onNavigate={(screen) => navigation.navigate(screen)}
        onSwitchTab={() => navigation.navigate('Home', { screen: 'ProfileTab' })}
      />
    </SafeAreaView>
  );
}

function DayScheduleCard({
  dayKey,
  dayData,
  onToggle,
  onOpenChange,
  onCloseChange,
  onAddSlot,
  onRemoveSlot,
  onAddSlotFromMulti,
}: {
  dayKey: keyof WorkScheduleData;
  dayData: WorkScheduleDay;
  onToggle: () => void;
  onOpenChange: (slotIndex: number, value: string) => void;
  onCloseChange: (slotIndex: number, value: string) => void;
  onAddSlot: () => void;
  onRemoveSlot: (slotIndex: number) => void;
  onAddSlotFromMulti: () => void;
}) {
  const { theme } = useAppTheme();
  const { t } = useTranslations('app');
  const dayLabel = dayKey.slice(0, 3).toUpperCase();
  const slots = dayData.slots?.length ? dayData.slots : [{ ...DEFAULT_SLOT }];
  const hasMultipleSlots = slots.length > 1;

  return (
    <View style={[styles.dayCard, { borderColor: theme.colors.gray200, backgroundColor: theme.colors.surface }]}>
      <View style={styles.dayHeaderRow}>
        <Text
          weight="bold"
          style={{ color: theme.colors.black, fontSize: theme.typography.size.sm, lineHeight: 20 }}
        >
          {dayLabel}
        </Text>
        <Pressable
          onPress={onToggle}
          style={[
            styles.switchTrack,
            { backgroundColor: dayData.is_active ? theme.colors.primary : theme.colors.gray300 },
          ]}
        >
          <View
            style={[
              styles.switchThumb,
              {
                backgroundColor: theme.colors.white,
                shadowColor: theme.colors.black,
                transform: [{ translateX: dayData.is_active ? 0 : -27 }],
              },
            ]}
          />
        </Pressable>
      </View>

      {slots.map((slot, slotIndex) => (
        <View key={`${dayKey}-${slotIndex}`} style={styles.timeRow}>
          <View style={styles.timeInputsGroup}>
            <TimeInput value={slot.open ?? '00:00'} onChangeText={(value) => onOpenChange(slotIndex, value)} />
            <View style={[styles.timeDash, { backgroundColor: theme.colors.gray300 }]} />
            <TimeInput value={slot.close ?? '23:59'} onChangeText={(value) => onCloseChange(slotIndex, value)} />
          </View>
          <Pressable onPress={hasMultipleSlots ? () => onRemoveSlot(slotIndex) : onAddSlot} style={styles.addButton} hitSlop={6}>
            {hasMultipleSlots ? (
              <RemoveIcon color={theme.colors.red500} iconColor={theme.colors.white} />
            ) : (
              <AddIcon color={theme.colors.primary} iconColor={theme.colors.white} />
            )}
          </Pressable>
        </View>
      ))}
      {hasMultipleSlots ? (
        <Pressable
          onPress={onAddSlotFromMulti}
          style={[styles.addSlotRow, { borderColor: theme.colors.primary, backgroundColor: theme.colors.surface }]}
          hitSlop={6}
        >
          <Text weight="medium" style={{ color: theme.colors.primary, fontSize: theme.typography.size.md }}>
            + {t('work_schedule_add_slot')}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function TimeInput({ value, onChangeText }: { value: string; onChangeText: (value: string) => void }) {
  const { theme } = useAppTheme();
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      containerStyle={styles.timeInputWrap}
      style={{ textAlign: 'center', color: theme.colors.gray900, fontSize: 16, lineHeight: 24 }}
    />
  );
}

function HamburgerIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M4.5 7.5H19.5M4.5 12H19.5M4.5 16.5H19.5" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function AddIcon({ color, iconColor }: { color: string; iconColor: string }) {
  return (
    <Svg width={28} height={28} viewBox="0 0 28 28" fill="none">
      <Circle cx={14} cy={14} r={12.5} fill={color} />
      <Path d="M14 8.5V19.5M8.5 14H19.5" stroke={iconColor} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

function RemoveIcon({ color, iconColor }: { color: string; iconColor: string }) {
  return (
    <Svg width={28} height={28} viewBox="0 0 28 28" fill="none">
      <Circle cx={14} cy={14} r={12.5} fill={color} />
      <Path d="M8.5 14H19.5" stroke={iconColor} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    minHeight: 56,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuButton: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  listWrap: {
    flex: 1,
    paddingTop: 32,
  },
  cardsWrap: {
    paddingHorizontal: 16,
    gap: 16,
  },
  dayCard: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingTop: 12,
    paddingBottom: 10,
    gap: 14,
  },
  dayHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  switchTrack: {
    width: 51,
    height: 24,
    borderRadius: 12,
    marginLeft: 'auto',
    paddingHorizontal: 2,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  switchThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 1.5,
    elevation: 1,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timeInputsGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeInput: {
    flex: 1,
    height: 42,
  },
  timeInputWrap: {
    height: 42,
    minWidth: 104,
    maxWidth: 124,
  },
  timeDash: {
    width: 25,
    height: 2,
  },
  addButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addSlotRow: {
    height: 52,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  footer: {
    position: 'absolute',
    left: 16,
    right: 16,
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  updateButton: {
    height: 54,
    borderRadius: 40,
  },
  feedbackText: {
    marginTop: 6,
    textAlign: 'center',
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
