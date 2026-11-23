import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Button from '../../../components/Button';
import Text from '../../../components/Text';
import { useAppTheme } from '../../../theme/ThemeProvider';
import { useAppCurrency } from '../../../hooks/useCurrency';

type Props = {
  currentBalance: number; availableBalance: number; availableLabel: string;
  onWithdrawPress: () => void; withdrawLabel: string; balanceLabel: string;
  loading?: boolean; disabled?: boolean;
};

export default function WalletBalanceCard({ currentBalance, availableBalance, availableLabel, onWithdrawPress, withdrawLabel, balanceLabel, loading, disabled }: Props) {
  const { theme } = useAppTheme();
  const { formatCurrency } = useAppCurrency();
  const ink = theme.colors.black;
  const softOverlay = `${theme.colors.white}59`;

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.primary }]}>
      <View style={styles.labelRow}>
        <View style={[styles.iconTile, { backgroundColor: softOverlay }]}>
          <Feather name="credit-card" size={16} color={ink} />
        </View>
        <Text weight="semiBold" color={ink}>{availableLabel}</Text>
      </View>
      {loading
        ? <ActivityIndicator style={styles.loader} color={ink} />
        : <Text weight="bold" color={ink} numberOfLines={1} style={styles.amount}>{formatCurrency(availableBalance)}</Text>}
      <View style={[styles.currentPill, { backgroundColor: softOverlay }]}>
        <Text variant="caption" color={ink}>{balanceLabel}</Text>
        <Text variant="caption" weight="bold" color={ink}>{loading ? '—' : formatCurrency(currentBalance)}</Text>
      </View>
      <Button
        label={withdrawLabel}
        onPress={onWithdrawPress}
        disabled={loading || disabled}
        textColor={theme.colors.white}
        containerStyle={[styles.button, { backgroundColor: ink }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 20, padding: 20, gap: 14 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconTile: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  amount: { fontSize: 40, lineHeight: 48, fontVariant: ['tabular-nums'] },
  loader: { alignSelf: 'flex-start', height: 48 },
  currentPill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  button: { minHeight: 52, height: undefined, paddingVertical: 14, borderRadius: 14, marginTop: 6 },
});
