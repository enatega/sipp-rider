import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Text from '../../../components/Text';
import { useAppTheme } from '../../../theme/ThemeProvider';
import { useTranslations } from '../../../localization/LocalizationProvider';
import {
  DELIVERY_PROGRESS_ORDER,
  resolveProgressStatusFromOrder,
  RiderDeliveryProgressStatus,
} from '../progress';

type Props = {
  status?: string | null;
  riderStatus?: string | null;
  selectedStatus?: RiderDeliveryProgressStatus | null;
  onSelectStatus?: (status: RiderDeliveryProgressStatus) => void;
};

const STATUS_LABEL_KEY: Record<RiderDeliveryProgressStatus, string> = {
  [RiderDeliveryProgressStatus.ASSIGNED]: 'order_status_assigned',
  [RiderDeliveryProgressStatus.HEADING_TO_STORE]: 'order_status_heading_to_store',
  [RiderDeliveryProgressStatus.ARRIVED_AT_STORE]: 'order_status_arrived_at_store',
  [RiderDeliveryProgressStatus.WAITING_FOR_ORDER]: 'order_status_waiting_for_order',
  [RiderDeliveryProgressStatus.PICKED_UP]: 'order_status_picked_up',
  [RiderDeliveryProgressStatus.OUT_FOR_DELIVERY]: 'order_status_out_for_delivery',
  [RiderDeliveryProgressStatus.ARRIVED_AT_CUSTOMER]: 'order_status_arrived_at_customer',
  [RiderDeliveryProgressStatus.DELIVERED]: 'order_status_delivered',
  [RiderDeliveryProgressStatus.FAILED]: 'order_status_failed',
};

const STATUS_DESC_KEY: Record<RiderDeliveryProgressStatus, string> = {
  [RiderDeliveryProgressStatus.ASSIGNED]: 'order_status_desc_assigned',
  [RiderDeliveryProgressStatus.HEADING_TO_STORE]: 'order_status_desc_heading_to_store',
  [RiderDeliveryProgressStatus.ARRIVED_AT_STORE]: 'order_status_desc_arrived_at_store',
  [RiderDeliveryProgressStatus.WAITING_FOR_ORDER]: 'order_status_desc_waiting_for_order',
  [RiderDeliveryProgressStatus.PICKED_UP]: 'order_status_desc_picked_up',
  [RiderDeliveryProgressStatus.OUT_FOR_DELIVERY]: 'order_status_desc_out_for_delivery',
  [RiderDeliveryProgressStatus.ARRIVED_AT_CUSTOMER]: 'order_status_desc_arrived_at_customer',
  [RiderDeliveryProgressStatus.DELIVERED]: 'order_status_desc_delivered',
  [RiderDeliveryProgressStatus.FAILED]: 'order_status_desc_failed',
};

export default function DeliveryProgressSection({
  status,
  riderStatus,
  selectedStatus,
  onSelectStatus,
}: Props) {
  const { theme } = useAppTheme();
  const { t } = useTranslations('app');
  const [timelineOpen, setTimelineOpen] = useState(false);

  const currentStatus = resolveProgressStatusFromOrder(status, riderStatus);
  const currentIndex = DELIVERY_PROGRESS_ORDER.indexOf(currentStatus);
  const activeStatus = selectedStatus ?? currentStatus;
  const activeIndex = DELIVERY_PROGRESS_ORDER.indexOf(activeStatus);
  const nextStatus = DELIVERY_PROGRESS_ORDER[Math.min(currentIndex + 1, DELIVERY_PROGRESS_ORDER.length - 1)];

  const timelineRows = useMemo(
    () => DELIVERY_PROGRESS_ORDER.map((item, index) => ({
      item,
      index,
      isCompleted: index <= currentIndex,
      isCurrent: index === currentIndex,
      isSelected: selectedStatus === item,
      time: index <= currentIndex ? '--:--' : '--:--',
    })),
    [currentIndex, selectedStatus],
  );

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.gray100,
          borderColor: theme.colors.gray200,
          shadowColor: theme.colors.shadow,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <Text color={theme.colors.gray600}>{t('order_delivery_progress')}</Text>
        <View style={styles.stepWrap}>
          <Text color={theme.colors.gray500}>{t('order_step')}</Text>
          <Text weight="semiBold" color={theme.colors.gray700}>{`${Math.max(1, currentIndex + 2)}/8`}</Text>
        </View>
      </View>

      <View style={styles.currentRow}>
        <View style={[styles.currentDot, { backgroundColor: theme.colors.primary }]} />
        <Text variant="subtitle" weight="semiBold" color={theme.colors.gray900}>{t(STATUS_LABEL_KEY[activeStatus])}</Text>
      </View>

      <Text color={theme.colors.gray500}>{t('order_next', { status: t(STATUS_LABEL_KEY[nextStatus]) })}</Text>

      <View style={styles.segmentsWrap}>
        {DELIVERY_PROGRESS_ORDER.slice(0, 8).map((item, index) => (
          <View
            key={item}
            style={[
              styles.segment,
              { backgroundColor: index <= activeIndex ? theme.colors.primary : theme.colors.gray250 },
            ]}
          />
        ))}
      </View>

      <Pressable
        onPress={() => setTimelineOpen((value) => !value)}
        style={[styles.toggleRow, { backgroundColor: theme.colors.gray150 }]}
      >
        <Text weight="medium" color={theme.colors.gray700}>
          {timelineOpen ? t('order_hide_timeline') : t('order_view_timeline')}
        </Text>
        <ChevronIcon up={timelineOpen} color={theme.colors.gray600} />
      </Pressable>

      {timelineOpen ? (
        <View style={styles.timelineList}>
          {timelineRows.map((row, index) => {
            const isPending = index > currentIndex;
            const isSelected = row.isSelected || (!selectedStatus && row.isCurrent);

            return (
              <Pressable
                key={row.item}
                style={styles.timelineRow}
                onPress={() => onSelectStatus?.(row.item)}
                disabled={!onSelectStatus}
              >
                <View style={styles.timelineRail}>
                  <View
                    style={[
                      styles.timelineDot,
                      {
                        backgroundColor: row.isCompleted ? theme.colors.primary : theme.colors.gray100,
                        borderColor: row.isCompleted ? theme.colors.primary : theme.colors.gray250,
                      },
                    ]}
                  >
                    {row.isCompleted ? <CheckIcon color={theme.colors.white} /> : null}
                  </View>
                  {index < timelineRows.length - 1 ? (
                    <View
                      style={[
                        styles.timelineConnector,
                        { backgroundColor: index < currentIndex ? theme.colors.primary : theme.colors.gray250 },
                      ]}
                    />
                  ) : null}
                </View>

                <View style={styles.timelineTextWrap}>
                  <Text weight={isSelected ? 'semiBold' : 'medium'} color={theme.colors.gray900}>
                    {t(STATUS_LABEL_KEY[row.item])}
                  </Text>
                  <Text color={theme.colors.gray600}>{t(STATUS_DESC_KEY[row.item])}</Text>
                </View>

                <Text weight="medium" color={isPending ? theme.colors.gray500 : theme.colors.gray700}>{row.time}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

function ChevronIcon({ up, color }: { up: boolean; color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 16 16" fill="none" style={up ? undefined : styles.chevronDown}>
      <Path
        d="M4 10L8 6L12 10"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CheckIcon({ color }: { color: string }) {
  return (
    <Svg width={10} height={10} viewBox="0 0 10 10" fill="none">
      <Path
        d="M2 5.2L4 7.2L8 3"
        stroke={color}
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepWrap: {
    alignItems: 'flex-end',
    gap: 2,
  },
  currentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  currentDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  segmentsWrap: {
    flexDirection: 'row',
    gap: 6,
  },
  segment: {
    height: 6,
    flex: 1,
    borderRadius: 999,
  },
  toggleRow: {
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  chevronDown: {
    transform: [{ rotate: '180deg' }],
  },
  timelineList: {
    gap: 10,
    paddingTop: 4,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  timelineRail: {
    width: 18,
    alignItems: 'center',
  },
  timelineDot: {
    width: 18,
    height: 18,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineConnector: {
    width: 2,
    height: 34,
  },
  timelineTextWrap: {
    flex: 1,
    gap: 2,
  },
});
