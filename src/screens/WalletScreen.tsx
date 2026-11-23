import WithdrawalHistorySheet from './wallet/components/WithdrawalHistorySheet';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  ListRenderItem,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Text from '../components/Text';
import Button from '../components/Button';
import { RiderWalletHistoryItem } from '../api/riderWalletTypes';
import { useTranslations } from '../localization/LocalizationProvider';
import { useAppTheme } from '../theme/ThemeProvider';
import { useAppCurrency } from '../hooks/useCurrency';
import {
  useRiderWalletBalanceQuery,
  useRiderWalletHistoryInfiniteQuery,
  useRiderWalletWithdrawMutation,
} from '../hooks/useRiderWalletQueries';
import WalletHeader from './wallet/components/WalletHeader';
import WalletBalanceCard from './wallet/components/WalletBalanceCard';
import PendingWithdrawalCard from './wallet/components/PendingWithdrawalCard';
import WalletHistoryLink from './wallet/components/WalletHistoryLink';
import { walletDate } from './wallet/walletFormatting';
import WalletTransactionRow from './wallet/components/WalletTransactionRow';
import WithdrawBottomSheet from './wallet/components/WithdrawBottomSheet';
import WithdrawSuccessModal from './wallet/components/WithdrawSuccessModal';
import { parseWithdrawAmount, validateWithdraw } from './wallet/withdrawValidation';
import type { RiderTabParamList } from '../navigation/MainTabsNavigator';
import type { MainStackParamList } from '../navigation/types';

export default function WalletScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<RiderTabParamList>>();
  const { t } = useTranslations('app');
  const { theme } = useAppTheme();
  const { formatCurrency } = useAppCurrency();
  const insets = useSafeAreaInsets();

  const [isHistoryVisible, setHistoryVisible] = useState(false);
  const [isWithdrawSheetVisible, setIsWithdrawSheetVisible] = useState(false);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
  const [withdrawAmountInput, setWithdrawAmountInput] = useState('');
  const [withdrawError, setWithdrawError] = useState('');
  const [successMessage, setSuccessMessage] = useState(t('wallet_withdraw_success_subtitle'));

  const balanceQuery = useRiderWalletBalanceQuery();
  const historyQuery = useRiderWalletHistoryInfiniteQuery('all');
  const withdrawMutation = useRiderWalletWithdrawMutation();
  useFocusEffect(useCallback(() => {
    void balanceQuery.refetch();
    void historyQuery.refetch();
  }, [balanceQuery.refetch, historyQuery.refetch]));

  const transactions = useMemo(
    () => historyQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [historyQuery.data?.pages],
  );

  const refreshing = balanceQuery.isRefetching || historyQuery.isRefetching;

  const onRefresh = () => {
    balanceQuery.refetch();
    historyQuery.refetch();
  };

  const onOpenWithdraw = () => {
    setWithdrawAmountInput('');
    setWithdrawError(
      balanceQuery.data?.pending_request ? t('wallet_withdraw_pending') : '',
    );
    setIsWithdrawSheetVisible(true);
  };

  const submitWithdrawal = async (amount: number) => {
    if (withdrawMutation.isPending) return;

    try {
      const response = await withdrawMutation.mutateAsync({ amount });
      setSuccessMessage(response.eta_message || t('wallet_withdraw_success_subtitle'));
      setIsWithdrawSheetVisible(false);
      setIsSuccessModalVisible(true);
    } catch (error) {
      setWithdrawError(error instanceof Error ? error.message : t('wallet_withdraw_failed'));
    }
  };

  const onConfirmWithdraw = () => {
    const amount = parseWithdrawAmount(withdrawAmountInput);
    const validationError = validateWithdraw(
      amount,
      balanceQuery.data?.available_amount ?? 0,
      Boolean(balanceQuery.data?.pending_request),
    );
    if (validationError) {
      setWithdrawError(t(`wallet_withdraw_${validationError}`));
      return;
    }

    setWithdrawError('');
    Keyboard.dismiss();
    Alert.alert(
      t('wallet_reconfirm_title'),
      t('wallet_reconfirm_message', { amount: formatCurrency(amount) }),
      [
        { text: t('wallet_reconfirm_cancel'), style: 'cancel' },
        {
          text: t('wallet_reconfirm_submit'),
          onPress: () => void submitWithdrawal(amount),
        },
      ],
    );
  };

  const onEndReached = () => {
    if (historyQuery.hasNextPage && !historyQuery.isFetchingNextPage) {
      historyQuery.fetchNextPage();
    }
  };

  const renderItem: ListRenderItem<RiderWalletHistoryItem> = ({ item }) => (
    <WalletTransactionRow
      item={item}
      onPress={() => navigation.getParent<NativeStackNavigationProp<MainStackParamList>>()?.navigate('WalletTransactionDetail', { transaction: item })}
    />
  );

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <WalletHeader
        title={t('nav_wallet')}
        onBackPress={navigation.canGoBack() ? () => navigation.goBack() : undefined}
      />

      <FlatList
        data={transactions}
        keyExtractor={(item) => item.transaction_id}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: Math.max(insets.bottom + 110, 130) },
        ]}
        onEndReachedThreshold={0.5}
        onEndReached={onEndReached}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            {balanceQuery.isError ? <View style={[styles.errorCard, { backgroundColor: theme.colors.gray50 }]}>
              <Text color={theme.colors.gray600}>{t('wallet_balance_error')}</Text>
              <Button variant="secondary" label={t('wallet_retry')} onPress={() => void balanceQuery.refetch()} />
            </View> : <WalletBalanceCard
              currentBalance={balanceQuery.data?.current_balance ?? 0}
              availableBalance={balanceQuery.data?.available_amount ?? 0}
              availableLabel={t('wallet_available_amount')}
              onWithdrawPress={onOpenWithdraw}
              withdrawLabel={t('wallet_withdraw_now')}
              balanceLabel={t('wallet_current_balance')}
              loading={balanceQuery.isLoading}
              disabled={!balanceQuery.data || balanceQuery.isError || Boolean(balanceQuery.data.pending_request) || balanceQuery.data.available_amount <= 0}
            />}

            {balanceQuery.data?.pending_request ? (
              <PendingWithdrawalCard
                title={t('wallet_pending_request')}
                amountLabel={formatCurrency(balanceQuery.data.pending_request.amount)}
                statusLabel={t('wallet_pending_status')}
                dateLabel={walletDate(balanceQuery.data.pending_request.requested_at)}
              />
            ) : null}

            <WalletHistoryLink
              title={t('wallet_withdrawal_history')}
              hint={t('wallet_history_link_hint')}
              onPress={() => setHistoryVisible(true)}
            />
            <Text weight="bold" style={[styles.sectionTitle, { color: theme.colors.gray900 }]}>
              {t('wallet_recent_transactions')}
            </Text>
          </View>
        }
        ListEmptyComponent={
          historyQuery.isLoading ? (
            <View style={styles.centered}><ActivityIndicator color={theme.colors.primary} /></View>
          ) : historyQuery.isError ? (
            <View style={[styles.centered, { gap: 12 }]}><Text color={theme.colors.gray700}>{t('wallet_history_error')}</Text><Button variant="secondary" label={t('wallet_retry')} onPress={() => void historyQuery.refetch()} containerStyle={{ alignSelf: 'stretch' }} /></View>
          ) : (
            <View style={styles.centered}>
              <Text style={{ color: theme.colors.gray500 }}>{t('wallet_no_transactions')}</Text>
            </View>
          )
        }
        ListFooterComponent={
          historyQuery.isFetchingNextPage ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator color={theme.colors.primary} />
            </View>
          ) : historyQuery.isError && transactions.length ? <Button variant="secondary" label={t('wallet_retry')} onPress={() => void historyQuery.fetchNextPage()} /> : null
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
      />

      {isHistoryVisible ? <WithdrawalHistorySheet onClose={() => setHistoryVisible(false)} /> : null}
      <WithdrawBottomSheet
        visible={isWithdrawSheetVisible}
        availableAmount={balanceQuery.data?.available_amount ?? 0}
        amountInput={withdrawAmountInput}
        onAmountInputChange={(value) => {
          setWithdrawAmountInput(value);
          setWithdrawError('');
        }}
        onClose={() => setIsWithdrawSheetVisible(false)}
        onConfirm={onConfirmWithdraw}
        titleLabel={t('wallet_withdraw_title')}
        subtitleLabel={t('wallet_withdraw_subtitle')}
        maxLabel={t('wallet_withdraw_max')}
        closeLabel={t('wallet_close')}
        confirmLabel={t('wallet_confirm_withdraw')}
        availableLabel={t('wallet_available_amount')}
        enterAmountLabel={t('wallet_enter_amount')}
        isLoading={withdrawMutation.isPending}
        errorMessage={withdrawError}
        bottomInset={insets.bottom}
      />

      <WithdrawSuccessModal
        visible={isSuccessModalVisible}
        title={t('wallet_withdraw_success_title')}
        subtitle={successMessage}
        doneLabel={t('wallet_done')}
        onClose={() => setIsSuccessModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
  },
  listHeader: {
    paddingTop: 8,
    paddingBottom: 4,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 20,
    lineHeight: 28,
    marginTop: 8,
  },
  errorCard: {
    gap: 12,
    padding: 20,
    borderRadius: 16,
  },
  centered: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
  },
});
