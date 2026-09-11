import React from 'react';
import { StyleSheet, View } from 'react-native';
import Text from '../../../components/Text';
import { RiderWalletHistoryItem } from '../../../api/riderWalletTypes';
import { useAppTheme } from '../../../theme/ThemeProvider';
import { useAppCurrency } from '../../../hooks/useCurrency';

type Props = {
  item: RiderWalletHistoryItem;
};

export default function WalletTransactionRow({ item }: Props) {
  const { theme } = useAppTheme();
  const { formatCurrency } = useAppCurrency();

  const date = new Date(item.created_at);
  const dateLabel = Number.isNaN(date.getTime())
    ? item.created_at
    : date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });

  return (
    <View style={styles.row}>
      <View style={styles.iconWrap}>
        <Text style={[styles.icon, { color: theme.colors.gray900 }]}>{'⇧'}</Text>
      </View>
      <View style={styles.contentWrap}>
        <View style={styles.textWrap}>
          <Text weight="semiBold" style={styles.title}>{item.label || 'Cash out'}</Text>
          <Text style={[styles.date, { color: theme.colors.gray900 }]}>{dateLabel}</Text>
        </View>
        <Text weight="bold" style={[styles.amount, { color: theme.colors.gray600 }]}>
          {formatCurrency(item.amount)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 10,
  },
  iconWrap: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 20,
    lineHeight: 20,
  },
  contentWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  textWrap: {
    flex: 1,
    gap: 5,
  },
  title: {
    fontSize: 14,
    lineHeight: 20,
  },
  date: {
    fontSize: 12,
    lineHeight: 16,
  },
  amount: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'right',
  },
});
