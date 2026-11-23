import React, { useEffect, useState } from 'react';
import { ActivityIndicator, AppState, FlatList, Modal, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Text from '../../../components/Text';
import Button from '../../../components/Button';
import PaymentProofPreview from '../../../components/PaymentProofPreview';
import { useWithdrawalDetail, useWithdrawalHistory } from '../../../hooks/useRiderWalletQueries';
import { useTranslations } from '../../../localization/LocalizationProvider';
import { useAppTheme } from '../../../theme/ThemeProvider';
import WalletHeader from './WalletHeader';
import WithdrawalHistoryRow from './WithdrawalHistoryRow';
import WithdrawalDetailView from './WithdrawalDetailView';

type Props = { onClose: () => void };
export default function WithdrawalHistorySheet({ onClose }: Props) {
  const { theme } = useAppTheme();
  const { t } = useTranslations('app');
  const history = useWithdrawalHistory(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [missingId, setMissingId] = useState(false);
  const [proof, setProof] = useState<string | null>(null);
  const detail = useWithdrawalDetail(selected);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') { void history.refetch(); if (selected) void detail.refetch(); }
    });
    return () => subscription.remove();
  }, [history.refetch, detail.refetch, selected]);
  const close = () => { if (selected) setSelected(null); else onClose(); };
  const items = history.data?.pages.flatMap(page => page.history) ?? [];
  const feedback = (message: string, retry?: () => void) => <View style={{ padding: 24, gap: 16, alignItems: 'stretch' }}>
    <Text color={theme.colors.gray600}>{message}</Text>
    {retry ? <Button label={t('wallet_retry')} variant="secondary" onPress={retry} /> : null}
  </View>;
  return <Modal visible animationType="slide" onRequestClose={close}>
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <WalletHeader title={t(selected ? 'wallet_withdrawal_details' : 'wallet_withdrawal_history')} onBackPress={close} />
      {selected ? <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {detail.isLoading ? <ActivityIndicator color={theme.colors.brandInk} /> : detail.isError ? feedback(t('wallet_detail_error'), () => void detail.refetch()) : detail.data ?
          <WithdrawalDetailView data={detail.data} onProof={setProof} /> : null}
      </ScrollView> : <FlatList data={items}
        keyExtractor={(item, index) => item.request_id || `unavailable-${index}`}
        contentContainerStyle={{ padding: 20, paddingBottom: 40, flexGrow: 1 }}
        refreshing={history.isRefetching && !history.isFetchingNextPage} onRefresh={() => { setMissingId(false); void history.refetch(); }}
        onEndReachedThreshold={0.4}
        onEndReached={() => { if (items.length && history.hasNextPage && !history.isFetching) void history.fetchNextPage(); }}
        ListHeaderComponent={<View style={{ marginBottom: 16, gap: 12 }}>
          <Text variant="caption" color={theme.colors.gray600}>{t('wallet_history_subtitle')}</Text>
          {missingId ? feedback(t('wallet_missing_reference'), () => void history.refetch()) : null}
        </View>}
        renderItem={({ item }) => <WithdrawalHistoryRow item={item} onPress={() => {
          if (!item.request_id) { setMissingId(true); return; }
          setMissingId(false); setSelected(item.request_id);
        }} />}
        ListEmptyComponent={history.isLoading ? <ActivityIndicator color={theme.colors.brandInk} /> : feedback(t(history.isError ? 'wallet_history_error' : 'wallet_no_withdrawals'), history.isError ? () => void history.refetch() : undefined)}
        ListFooterComponent={history.isFetchingNextPage ? <ActivityIndicator color={theme.colors.brandInk} /> : history.isError && items.length ?
          <Pressable onPress={() => void history.fetchNextPage()} style={{ padding: 16, minHeight: 48 }}><Text color={theme.colors.brandInk}>{t('wallet_retry')}</Text></Pressable> : null} />}
      {proof ? <PaymentProofPreview uri={proof} onClose={() => setProof(null)} /> : null}
    </SafeAreaView>
  </Modal>;
}
