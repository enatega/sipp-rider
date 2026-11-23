import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Text from '../../../components/Text';
import { RiderWalletHistoryItem } from '../../../api/riderWalletTypes';
import { useAppTheme } from '../../../theme/ThemeProvider';
import { useAppCurrency } from '../../../hooks/useCurrency';
import { useTranslations } from '../../../localization/LocalizationProvider';
import { getRiderWalletTransactionLabel, isOutgoingWalletTransaction, walletDate } from '../walletFormatting';

type Props = {
  item: RiderWalletHistoryItem;
  onPress: () => void;
};

export default function WalletTransactionRow({ item, onPress }: Props) {
  const { theme } = useAppTheme();
  const { formatCurrency } = useAppCurrency();
  const { t } = useTranslations('app');
  const isOutgoing = isOutgoingWalletTransaction(item);
  const directionColor = isOutgoing ? theme.colors.red500 : theme.colors.green600;

  const dateLabel = walletDate(item.created_at);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('wallet_view_transaction_details')}
      onPress={onPress}
      style={({ pressed }) => [styles.row, { borderBottomColor: theme.colors.gray200, opacity: pressed ? 0.65 : 1 }]}
    >
      <View style={[styles.iconWrap, { backgroundColor: isOutgoing ? theme.colors.red100 : theme.colors.green50 }]}>
        <Feather name={isOutgoing ? 'arrow-up-right' : 'arrow-down-left'} size={19} color={directionColor} />
      </View>
      <View style={styles.contentWrap}>
        <View style={styles.textWrap}>
          <Text weight="semiBold" style={[styles.title, { color: theme.colors.gray900 }]} numberOfLines={2}>{getRiderWalletTransactionLabel(item, t)}</Text>
          <Text style={[styles.date, { color: theme.colors.gray600 }]}>{dateLabel} · {t('wallet_transaction_completed')}</Text>
        </View>
        <Text weight="semiBold" style={[styles.amount, { color: directionColor }]}>
          {isOutgoing ? '−' : '+'}{formatCurrency(Math.abs(item.amount))}
        </Text>
        <Feather name="chevron-right" size={18} color={theme.colors.gray400} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  textWrap: {
    flex: 1,
    minWidth: 120,
    gap: 5,
  },
  title: {
    fontSize: 15,
    lineHeight: 20,
  },
  date: {
    fontSize: 12,
    lineHeight: 16,
  },
  amount: {
    fontSize: 16,
    lineHeight: 22,
    fontVariant: ['tabular-nums'],
    textAlign: 'right',
  },
});
