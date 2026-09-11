import React from 'react';
import { StyleSheet, View } from 'react-native';
import Button from '../../../components/Button';
import Text from '../../../components/Text';
import { useAppTheme } from '../../../theme/ThemeProvider';
import { useAppCurrency } from '../../../hooks/useCurrency';

type Props = {
  currentBalance: number;
  onWithdrawPress: () => void;
  withdrawLabel: string;
  balanceLabel: string;
};

export default function WalletBalanceCard({
  currentBalance,
  onWithdrawPress,
  withdrawLabel,
  balanceLabel,
}: Props) {
  const { theme } = useAppTheme();
  const { formatCurrency } = useAppCurrency();

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.gray50, borderColor: theme.colors.gray100 }]}>
      <View style={styles.balanceWrap}>
        <Text weight="semiBold" style={[styles.balanceLabel, { color: theme.colors.gray600 }]}>
          {balanceLabel}
        </Text>
        <Text weight="bold" style={[styles.balanceValue, { color: theme.colors.gray900 }]}>
          {formatCurrency(currentBalance)}
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
    borderRadius: 8,
    padding: 16,
    gap: 16,
  },
  balanceWrap: {
    gap: 8,
  },
  balanceLabel: {
    fontSize: 16,
    lineHeight: 18,
    textAlign: 'center',
  },
  balanceValue: {
    fontSize: 32,
    lineHeight: 40,
    textAlign: 'center',
  },
  withdrawButton: {
    height: 54,
    borderRadius: 40,
  },
});
