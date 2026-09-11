import React from 'react';
import { StyleSheet, View } from 'react-native';
import Text from './Text';
import { typography } from '../theme/typography';
import { RiderEarningsChartPoint } from '../api/earningsTypes';
import { useAppCurrency } from '../hooks/useCurrency';
import { useAppTheme } from '../theme/ThemeProvider';

export type EarningsChartDataPoint = {
  label: string;
  amount: number;
  barHeight?: number;
};

type Props = {
  data?: ReadonlyArray<EarningsChartDataPoint | RiderEarningsChartPoint>;
};

const getChartAmount = (item: EarningsChartDataPoint | RiderEarningsChartPoint) =>
  'total_earnings' in item ? item.total_earnings : item.amount;

const getChartKey = (item: EarningsChartDataPoint | RiderEarningsChartPoint) =>
  'bucket_start' in item ? `${item.bucket_start}-${item.total_earnings}` : `${item.label}-${item.amount}`;

export default function EarningsChart({ data }: Props) {
  const chartData = data ?? [];
  const { formatCurrency } = useAppCurrency();
  const { theme } = useAppTheme();
  const maxAmount = Math.max(...chartData.map(getChartAmount), 1);

  return (
    <View style={styles.container}>
      {chartData.map((item) => {
        const amount = getChartAmount(item);
        const barHeight = 'barHeight' in item && item.barHeight
          ? item.barHeight
          : Math.max((amount / maxAmount) * 167, 16);

        return (
          <View key={getChartKey(item)} style={styles.column}>
            <Text variant="caption" color={theme.colors.gray600} style={styles.amount}>
              {formatCurrency(amount)}
            </Text>
            <View
              style={[
                styles.bar,
                {
                  height: barHeight,
                  width: typography.size.xxl,
                  backgroundColor: theme.colors.primary,
                  borderColor: theme.colors.gray100,
                },
              ]}
            />
            <Text variant="caption" color={theme.colors.gray600} style={styles.label}>
              {item.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    gap: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    minHeight: 253,
  },
  column: {
    width: 72,
    alignItems: 'center',
    gap: 8,
  },
  amount: {
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    textAlign: 'center',
  },
  bar: {
    width: '100%',
    borderWidth: 1,
  },
  label: {
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    textAlign: 'center',
  },
});
