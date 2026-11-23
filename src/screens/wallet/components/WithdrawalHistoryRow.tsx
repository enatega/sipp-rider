import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Text from '../../../components/Text';
import { WithdrawalHistoryItem } from '../../../api/riderWalletTypes';
import { useAppCurrency } from '../../../hooks/useCurrency';
import { useTranslations } from '../../../localization/LocalizationProvider';
import { useAppTheme } from '../../../theme/ThemeProvider';
import { walletDate } from '../walletFormatting';
import WithdrawalStatus from './WithdrawalStatus';

type Props = { item: WithdrawalHistoryItem; onPress: () => void };

export default function WithdrawalHistoryRow({ item, onPress }: Props) {
  const { theme } = useAppTheme();
  const { t } = useTranslations('app');
  const { formatCurrency } = useAppCurrency();
  const amount = formatCurrency(Number(item.approved_amount ?? item.requested_amount ?? item.amount));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${t('wallet_withdrawal_details')}, ${amount}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, { borderColor: theme.colors.gray200, backgroundColor: pressed ? theme.colors.gray100 : theme.colors.surface }]}
    >
      <View style={styles.topRow}>
        <View style={styles.amountBlock}>
          <Text weight="bold" color={theme.colors.gray900} style={styles.amount}>{amount}</Text>
          <Text variant="caption" color={theme.colors.gray600}>{walletDate(item.updated_at || item.createdAt)}</Text>
        </View>
        <WithdrawalStatus status={item.status} />
      </View>
      <View style={[styles.footer, { borderTopColor: theme.colors.gray200 }]}>
        <Feather name={item.has_payment_proof ? 'paperclip' : 'file-text'} size={14} color={theme.colors.gray600} />
        <Text variant="caption" color={theme.colors.gray600} style={styles.footerText}>
          {t(item.has_payment_proof ? 'wallet_proof_attached' : 'wallet_view_details')}
        </Text>
        <Feather name="chevron-right" size={18} color={theme.colors.gray500} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 12, borderWidth: 1, borderRadius: 18, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, gap: 12 },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  amountBlock: { flex: 1, gap: 4 },
  amount: { fontSize: 24, lineHeight: 30, fontVariant: ['tabular-nums'] },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 6, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 10 },
  footerText: { flex: 1 },
});
