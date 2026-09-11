import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Text from './Text';
import { useTranslations } from '../localization/LocalizationProvider';
import { lightColors } from '../theme/colors';
import { typography } from '../theme/typography';
import { RiderEarningsActivity } from '../api/earningsTypes';
import { useAppCurrency } from '../hooks/useCurrency';

export type EarningsActivityRowItem = {
  id: string;
  date: string;
  amount: number;
};

type EarningsActivityRenderableItem = EarningsActivityRowItem | RiderEarningsActivity;

type Props<T extends EarningsActivityRenderableItem> = {
  item: T;
  onPress?: (item: T) => void;
};

const getActivityDate = (item: EarningsActivityRenderableItem) =>
  'activity_date' in item ? item.activity_date : item.date;

const getActivityTitle = (
  item: EarningsActivityRenderableItem,
  fallbackTitle: string,
) => ('title' in item ? item.title : fallbackTitle);

const getActivityAmount = (item: EarningsActivityRenderableItem) =>
  'total_earnings' in item ? item.total_earnings : item.amount;

export default function EarningsActivityRow<T extends EarningsActivityRenderableItem>({
  item,
  onPress,
}: Props<T>) {
  const { t } = useTranslations('app');
  const { formatCurrency } = useAppCurrency();

  return (
    <Pressable
      onPress={() => onPress?.(item)}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.row,
        {
          borderBottomColor: lightColors.gray300,
          opacity: pressed ? 0.65 : 1,
        },
      ]}
    >
      <View style={styles.rowContent}>
        <View style={styles.leftGroup}>
          <Text variant="caption" color={lightColors.gray900} style={styles.metaText} numberOfLines={1}>
            {getActivityDate(item)}
          </Text>
          <Text variant="caption" weight="semiBold" color={lightColors.gray900} style={[styles.metaText, { fontWeight: 'bold' }]} numberOfLines={1}>
            {getActivityTitle(item, t('earnings_total_earning'))}
          </Text>
        </View>
        <Text variant="caption" weight="semiBold" color={lightColors.gray900} style={styles.amount} numberOfLines={1}>
          {formatCurrency(getActivityAmount(item))}
        </Text>
      </View>
      <ChevronRight color={lightColors.gray900} />
    </Pressable>
  );
}

function ChevronRight({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 5L16 12L9 19"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  rowContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minWidth: 0,
  },
  leftGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  metaText: {
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
  },
  amount: {
    flex: 1,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
    textAlign: 'right',
    fontWeight: 'bold',
  },
});
