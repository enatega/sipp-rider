import React from 'react';
import { Modal, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import SwipeableBottomSheet from './SwipeableBottomSheet';
import Text from './Text';
import type { RiderEarningsActivity } from '../api/earningsTypes';
import { useTranslations } from '../localization/LocalizationProvider';
import { lightColors } from '../theme/colors';
import { useAppTheme } from '../theme/ThemeProvider';
import { typography } from '../theme/typography';
import { useAppCurrency } from '../hooks/useCurrency';

type LegacyEarningsBottomSheetItem = {
  amount: number;
  hoursWorked: string;
  tips: number;
  deliveriesCount: number;
  deliveriesAmount: number;
};

export type EarningsBottomSheetItem = LegacyEarningsBottomSheetItem | RiderEarningsActivity;

type Props = {
  visible: boolean;
  item: EarningsBottomSheetItem | null;
  onClose: () => void;
  onPressDeliveries: () => void;
};

const getTotalEarnings = (item: EarningsBottomSheetItem) =>
  'activity_date' in item ? item.total_earnings : item.amount;

const getHoursWorked = (item: EarningsBottomSheetItem) =>
  'activity_date' in item ? item.hours_worked ?? '' : item.hoursWorked;

const getTips = (item: EarningsBottomSheetItem) => item.tips;

const getDeliveriesCount = (item: EarningsBottomSheetItem) =>
  'activity_date' in item ? item.deliveries : item.deliveriesCount;

const getDeliveriesAmount = (item: EarningsBottomSheetItem) =>
  'activity_date' in item ? item.deliveries_earnings : item.deliveriesAmount;

export default function EarningsBottomSheet({
  visible,
  item,
  onClose,
  onPressDeliveries,
}: Props) {
  const { theme } = useAppTheme();
  const { t } = useTranslations('app');
  const { formatCurrency } = useAppCurrency();
  const { height } = useWindowDimensions();
  const sheetHeight = Math.min(height * 0.42, 304);

  if (!item) {
    return null;
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <SwipeableBottomSheet
          expandedHeight={sheetHeight}
          collapsedHeight={0}
          initialState="expanded"
          modal
          enablePanGesture={false}
          style={[styles.sheet, { backgroundColor: theme.colors.white, borderColor: theme.colors.gray300 }]}
        >
          <View style={styles.header}>
            <View style={styles.headerSide} />
            <Text variant="body" weight="semiBold" color={lightColors.black} style={styles.headerTitle}>
              {t('nav_earnings')}
            </Text>
            <Pressable onPress={onClose} hitSlop={8} accessibilityRole="button" accessibilityLabel="Close earnings details">
              <CloseIcon color={theme.colors.gray900} />
            </Pressable>
          </View>

          <View style={styles.body}>
            <View style={[styles.totalRow, { backgroundColor: theme.colors.gray100 }]}>
              <Text variant="body" weight="medium" color={theme.colors.gray700} style={styles.totalText} numberOfLines={1}>
                {t('earnings_total_earnings')}
              </Text>
              <Text variant="body" weight="medium" color={theme.colors.gray700} style={styles.totalAmount} numberOfLines={1}>
                {formatCurrency(getTotalEarnings(item))}
              </Text>
            </View>

            <View style={styles.details}>
              <InfoRow label={t('earnings_hours_worked')} value={getHoursWorked(item)} />
              <InfoRow label={t('earnings_tips')} value={formatCurrency(getTips(item))} />
              <Pressable
                onPress={onPressDeliveries}
                accessibilityRole="button"
                style={({ pressed }) => [styles.deliveriesRow, { opacity: pressed ? 0.65 : 1 }]}
              >
                <Text variant="caption" weight="medium" color={theme.colors.blue500} style={styles.detailText} numberOfLines={1}>
                  {t('earnings_deliveries_count', { count: getDeliveriesCount(item) })}
                </Text>
                <View style={styles.deliveryValue}>
                  <Text variant="caption" weight="semiBold" color={theme.colors.blue400} style={styles.detailValue} numberOfLines={1}>
                    {formatCurrency(getDeliveriesAmount(item))}
                  </Text>
                  <ChevronRight color={theme.colors.blue400} />
                </View>
              </Pressable>
            </View>
          </View>
        </SwipeableBottomSheet>
      </View>
    </Modal>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  const { theme } = useAppTheme();

  return (
    <View style={styles.infoRow}>
      <Text variant="caption" weight="medium" color={theme.colors.gray500} style={styles.detailText} numberOfLines={1}>
        {label}
      </Text>
      <Text variant="caption" weight="semiBold" color={theme.colors.gray900} style={styles.detailValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function CloseIcon({ color }: { color: string }) {
  return (
    <Svg width={32} height={32} viewBox="0 0 32 32" fill="none">
      <Path
        d="M12 12L20 20M20 12L12 20"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Path
        d="M16 27C22.075 27 27 22.075 27 16C27 9.925 22.075 5 16 5C9.925 5 5 9.925 5 16C5 22.075 9.925 27 16 27Z"
        stroke={color}
        strokeWidth={1.8}
      />
    </Svg>
  );
}

function ChevronRight({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
      <Path
        d="M6 3.5L10.5 8L6 12.5"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: lightColors.modalBackdrop,
  },
  sheet: {
    borderTopWidth: 1,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
    shadowColor: lightColors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 8,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    paddingHorizontal: 16,
  },
  headerSide: {
    width: 32,
    height: 32,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: typography.size.md,
    lineHeight: typography.lineHeight.md,
  },
  body: {
    alignItems: 'stretch',
  },
  totalRow: {
    minHeight: 49,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 8,
  },
  totalText: {
    flex: 1,
    fontSize: typography.size.md,
    lineHeight: typography.lineHeight.md,
  },
  totalAmount: {
    flex: 1,
    fontSize: typography.size.md,
    lineHeight: typography.lineHeight.md,
    textAlign: 'right',
  },
  details: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
    gap: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deliveriesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    flex: 1,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
  },
  detailValue: {
    flex: 1,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
    textAlign: 'right',
  },
  deliveryValue: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
});
