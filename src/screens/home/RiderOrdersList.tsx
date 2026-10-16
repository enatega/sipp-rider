import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import Text from '../../components/Text';
import VerticalList from '../../components/VerticalList';
import HomeOrderCard from '../../components/HomeOrderCard';
import { useRiderOrdersInfiniteQuery } from '../../hooks/useRiderHomeQueries';
import { RiderHomeOrder, RiderOrderTab } from '../../api/riderHomeTypes';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useTranslations } from '../../localization/LocalizationProvider';
import { riderHomeKeys } from '../../api/queryKeys';
import { alertForNewRiderOrder } from '../../sound/orderAlertCoordinator';

type Props = {
  tab: RiderOrderTab;
  onAssigned: (order: { orderId: string; orderCode: string; storeName: string | null }) => void;
  highlightedOrderCode?: string | null;
  focusedOrderId?: string;
  alertUserId?: string | null;
  canAlertNewOrders?: boolean;
};

export default function RiderOrdersList({ tab, onAssigned, highlightedOrderCode, focusedOrderId, alertUserId, canAlertNewOrders }: Props) {
  const { theme } = useAppTheme();
  const { t } = useTranslations('app');
  const queryClient = useQueryClient();
  const query = useRiderOrdersInfiniteQuery(tab, tab === 'new' ? focusedOrderId : undefined);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const knownOrderIdsRef = useRef<Set<string>>(new Set());
  const hasBaselineRef = useRef(false);
  const isActiveRef = useRef(true);
  const items = useMemo(
    () => query.data?.pages.flatMap((page) => page.items) ?? [],
    [query.data?.pages],
  );

  useEffect(() => {
    isActiveRef.current = true;
    return () => { isActiveRef.current = false; };
  }, []);

  useEffect(() => {
    if (focusedOrderId) {
      hasBaselineRef.current = false;
      knownOrderIdsRef.current = new Set();
      return;
    }
    if (!query.data) return;
    knownOrderIdsRef.current = new Set(items.map((item) => item.orderId).filter((id): id is string => Boolean(id)));
    hasBaselineRef.current = true;
  }, [focusedOrderId, items, query.data]);

  const isInitialLoading = query.isLoading && items.length === 0;
  const handleRefresh = async () => {
    if (isManualRefreshing) return;
    const shouldAlert = Boolean(alertUserId && canAlertNewOrders && !focusedOrderId && hasBaselineRef.current && query.data && tab !== 'delivered');
    const previouslyVisible = new Set(knownOrderIdsRef.current);
    setIsManualRefreshing(true);
    try {
      void queryClient.invalidateQueries({ queryKey: riderHomeKeys.summary() });
      const result = await query.refetch();
      if (!isActiveRef.current || !shouldAlert || result.isError || !result.data || !alertUserId) return;
      const discovered = result.data.pages.flatMap((page) => page.items)
        .filter((order): order is RiderHomeOrder & { orderId: string; createdAt: string } => {
          if (!order.orderId || !order.createdAt || previouslyVisible.has(order.orderId)) return false;
          if (tab === 'new' && !order.canAssignMe) return false;
          previouslyVisible.add(order.orderId);
          return true;
        })
        .sort((a, b) => Date.parse(a.createdAt ?? '') - Date.parse(b.createdAt ?? ''));
      for (const order of discovered) {
        void alertForNewRiderOrder({
          userId: alertUserId,
          orderId: order.orderId,
          occurredAt: order.createdAt,
          allowOlderEvent: true,
        });
      }
    } catch {
      // The existing query error state handles a failed refresh.
    } finally {
      if (isActiveRef.current) setIsManualRefreshing(false);
    }
  };

  if (isInitialLoading) {
    return (
      <View style={styles.skeletonList} accessibilityLabel={t('orders_loading')}>
        {[0, 1].map((index) => <View key={index} style={[styles.skeletonCard, { backgroundColor: theme.colors.gray100 }]}>
          <View style={[styles.skeletonTitle, { backgroundColor: theme.colors.gray200 }]} />
          <View style={[styles.skeletonLine, { backgroundColor: theme.colors.gray200 }]} />
          <View style={[styles.skeletonLineShort, { backgroundColor: theme.colors.gray200 }]} />
        </View>)}
      </View>
    );
  }

  if (query.isError && items.length === 0) {
    return (
      <View style={styles.centerState}>
        <Text color={theme.colors.gray600}>{query.error.message}</Text>
        <Pressable accessibilityRole="button" onPress={() => void query.refetch()} style={[styles.retry, { backgroundColor: theme.colors.primary }]}>
          <Text weight="semiBold" color={theme.colors.gray900}>{t('orders_retry')}</Text>
        </Pressable>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <ScrollView
        alwaysBounceVertical
        contentContainerStyle={styles.emptyRefreshContent}
        refreshControl={<RefreshControl refreshing={isManualRefreshing} onRefresh={() => void handleRefresh()} />}
      >
        <Text color={theme.colors.gray600}>{t(focusedOrderId ? 'orders_focus_empty' : 'orders_empty')}</Text>
      </ScrollView>
    );
  }

  return (
    <VerticalList
      data={items}
      keyExtractor={(item, index) => item.orderId ?? item.orderCode ?? `order-${index}`}
      contentContainerStyle={styles.listContent}
      renderItem={({ item }) => <HomeOrderCard order={item} tab={tab} onAssigned={onAssigned} highlighted={Boolean(highlightedOrderCode && item.orderCode?.replace(/^#/, '') === highlightedOrderCode.replace(/^#/, ''))} />}
      refreshing={isManualRefreshing}
      onRefresh={handleRefresh}
      onEndReachedThreshold={0.4}
      onEndReached={() => {
        if (query.hasNextPage && !query.isFetchingNextPage) {
          query.fetchNextPage();
        }
      }}
      ListFooterComponent={
        query.isFetchingNextPage ? (
          <View style={styles.footerLoading}>
            <ActivityIndicator color={theme.colors.primary} />
          </View>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyRefreshContent: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 16,
  },
  footerLoading: {
    paddingVertical: 16,
  },
  skeletonList: { flex: 1, padding: 16, gap: 14 },
  skeletonCard: { minHeight: 190, borderRadius: 14, padding: 18, gap: 20 },
  skeletonTitle: { width: '42%', height: 22, borderRadius: 6 },
  skeletonLine: { width: '90%', height: 16, borderRadius: 6 },
  skeletonLineShort: { width: '64%', height: 16, borderRadius: 6 },
  retry: { minHeight: 44, borderRadius: 12, paddingHorizontal: 20, justifyContent: 'center', marginTop: 16 },
});
