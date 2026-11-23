import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import Text from '../components/Text';
import type { MainStackParamList } from '../navigation/types';
import { useAppTheme } from '../theme/ThemeProvider';
import { useAppCurrency } from '../hooks/useCurrency';
import { useTranslations } from '../localization/LocalizationProvider';
import WalletHeader from './wallet/components/WalletHeader';
import { getRiderWalletTransactionLabel, isOutgoingWalletTransaction, walletDateTime } from './wallet/walletFormatting';

export default function WalletTransactionDetailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const route = useRoute<RouteProp<MainStackParamList, 'WalletTransactionDetail'>>();
  const { transaction } = route.params;
  const { theme } = useAppTheme();
  const { formatCurrency } = useAppCurrency();
  const { t } = useTranslations('app');
  const isOutgoing = isOutgoingWalletTransaction(transaction);
  const directionColor = isOutgoing ? theme.colors.red500 : theme.colors.green600;
  const signedAmount = `${isOutgoing ? '−' : '+'}${formatCurrency(Math.abs(transaction.amount))}`;
  const detailRows: Array<[string, string]> = [
    [t('wallet_transaction_direction'), t(isOutgoing ? 'wallet_transaction_outgoing' : 'wallet_transaction_incoming')],
    [t('wallet_transaction_id'), transaction.transaction_id],
    ...(transaction.order_id ? [[t('wallet_order_id'), transaction.order_id] as [string, string]] : []),
    [t('wallet_transaction_date_time'), walletDateTime(transaction.created_at)],
    [t('wallet_transaction_status'), t('wallet_transaction_completed')],
  ];

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <WalletHeader title={t('wallet_transaction_details')} onBackPress={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, { backgroundColor: isOutgoing ? theme.colors.red100 : theme.colors.green50 }]}>
          <View style={[styles.icon, { backgroundColor: theme.colors.surface }]}>
            <Feather name={isOutgoing ? 'arrow-up-right' : 'arrow-down-left'} size={28} color={directionColor} />
          </View>
          <Text weight="bold" style={[styles.amount, { color: directionColor }]}>{signedAmount}</Text>
          <Text weight="semiBold" color={theme.colors.gray900} style={styles.label}>{getRiderWalletTransactionLabel(transaction, t)}</Text>
        </View>

        <View style={[styles.card, { borderColor: theme.colors.gray200 }]}>
          {detailRows.map(([label, value], index) => (
            <View key={label} style={[styles.detailRow, index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.gray200 }]}>
              <Text variant="caption" color={theme.colors.gray600}>{label}</Text>
              <Text selectable weight="medium" color={theme.colors.gray900} style={styles.detailValue}>{value}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, gap: 18 },
  hero: { borderRadius: 22, padding: 24, alignItems: 'center', gap: 10 },
  icon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  amount: { fontSize: 36, lineHeight: 44, fontVariant: ['tabular-nums'] },
  label: { fontSize: 16, lineHeight: 22, textAlign: 'center' },
  card: { borderWidth: 1, borderRadius: 18, paddingHorizontal: 16 },
  detailRow: { paddingVertical: 14, gap: 5 },
  detailValue: { flexShrink: 1, lineHeight: 21 },
});
