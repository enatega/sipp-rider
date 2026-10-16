import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Text from '../../../components/Text';
import { RiderWalletHistoryItem } from '../../../api/riderWalletTypes';
import { useAppTheme } from '../../../theme/ThemeProvider';
import { useAppCurrency } from '../../../hooks/useCurrency';
import { useTranslations } from '../../../localization/LocalizationProvider';

type Props = {
  item: RiderWalletHistoryItem;
};

export default function WalletTransactionRow({ item }: Props) {
  const { theme } = useAppTheme();
  const { formatCurrency } = useAppCurrency();
  const { t } = useTranslations('app');
  const isOutgoing = item.type === 'debit' || item.type === 'withdrawal';

  const date = new Date(item.created_at);
  const dateLabel = Number.isNaN(date.getTime())
    ? item.created_at
    : date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <View style={[styles.row, { borderBottomColor: theme.colors.gray200 }]}>
      <View style={[styles.iconWrap, { backgroundColor: isOutgoing ? theme.colors.gray100 : theme.colors.green50 }]}>
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
          <Path d={isOutgoing ? 'M5 17L17 5M8 5h9v9' : 'M5 7l12 12M17 10v9H8'} stroke={isOutgoing ? theme.colors.gray700 : theme.colors.green600} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </View>
      <View style={styles.contentWrap}>
        <View style={styles.textWrap}>
          <Text weight="semiBold" style={[styles.title, { color: theme.colors.gray900 }]} numberOfLines={2}>{item.label || (isOutgoing ? t('wallet_withdraw_now') : t('wallet_recent_transactions'))}</Text>
          <Text style={[styles.date, { color: theme.colors.gray600 }]}>{dateLabel} · {t('wallet_transaction_completed')}</Text>
        </View>
        <Text weight="semiBold" style={[styles.amount, { color: isOutgoing ? theme.colors.gray900 : theme.colors.green600 }]} numberOfLines={1} adjustsFontSizeToFit>
          {isOutgoing ? '−' : '+'}{formatCurrency(Math.abs(item.amount))}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
