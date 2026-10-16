import React from 'react';
import { StyleSheet, View } from 'react-native';
import Button from '../../../components/Button';
import Text from '../../../components/Text';
import { useAppTheme } from '../../../theme/ThemeProvider';
import { useAppCurrency } from '../../../hooks/useCurrency';

type Props = {
  currentBalance: number;
  availableBalance: number;
  availableLabel: string;
  onWithdrawPress: () => void;
  withdrawLabel: string;
  balanceLabel: string;
};

export default function WalletBalanceCard({
  currentBalance,
  availableBalance,
  availableLabel,
  onWithdrawPress,
  withdrawLabel,
  balanceLabel,
}: Props) {
  const { theme } = useAppTheme();
  const { formatCurrency } = useAppCurrency();

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.gray300 }]}>
      <View style={styles.balanceWrap}>
        <Text weight="semiBold" style={[styles.balanceLabel, { color: theme.colors.gray600 }]}>
          {balanceLabel}
        </Text>
        <Text weight="bold" style={[styles.balanceValue, { color: theme.colors.gray900 }]} numberOfLines={1} adjustsFontSizeToFit>
          {formatCurrency(currentBalance)}
        </Text>
      </View>

      <View style={[styles.availableRow, { borderTopColor: theme.colors.gray200 }]}>
        <Text style={{ color: theme.colors.gray600 }}>{availableLabel}</Text>
        <Text weight="semiBold" style={{ color: theme.colors.gray900 }} numberOfLines={1} adjustsFontSizeToFit>
          {formatCurrency(availableBalance)}
        </Text>
      </View>

      <Button
        label={withdrawLabel}
        onPress={onWithdrawPress}
        textColor={theme.colors.gray900}
        containerStyle={styles.withdrawButton}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    gap: 20,
  },
  balanceWrap: {
    gap: 8,
  },
  balanceLabel: {
    fontSize: 16,
    lineHeight: 18,
    textAlign: 'left',
  },
  balanceValue: {
    fontSize: 32,
    lineHeight: 40,
    textAlign: 'left',
    fontVariant: ['tabular-nums'],
  },
  withdrawButton: {
    height: 54,
    borderRadius: 12,
  },
  availableRow: { borderTopWidth: 1, paddingTop: 16, flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
});
