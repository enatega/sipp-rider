import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import type { FlashListRef } from '@shopify/flash-list';
import Text from '../../components/Text';
import VerticalList from '../../components/VerticalList';
import HomeOrderCard from '../../components/HomeOrderCard';
import { useRiderOrdersInfiniteQuery } from '../../hooks/useRiderHomeQueries';
import type { RiderHomeOrder, RiderOrderTab } from '../../api/riderHomeTypes';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useTranslations } from '../../localization/LocalizationProvider';
import { riderHomeKeys } from '../../api/queryKeys';

type Props = {
  isActive?: boolean;
  tab: RiderOrderTab;
  highlightedOrderCode?: string | null;
  focusedOrderId?: string;
};

export default function RiderOrdersList({ isActive = true, tab, highlightedOrderCode, focusedOrderId }: Props) {
  const { theme } = useAppTheme();
  const { t } = useTranslations('app');
  const queryClient = useQueryClient();
  const query = useRiderOrdersInfiniteQuery(tab, tab === 'new' ? focusedOrderId : undefined, isActive);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const listRef = useRef<FlashListRef<RiderHomeOrder> | null>(null);
  const previousFirstOrderIdRef = useRef<string | null>(null);
  const pendingScrollToTopRef = useRef(false);
  const items = useMemo(
    () => query.data?.pages.flatMap((page) => page.items) ?? [],
    [query.data?.pages],
  );
  const firstOrderId = items[0]?.orderId ?? null;

  useEffect(() => {
    if (tab !== 'new') return;

    if (focusedOrderId) {
      previousFirstOrderIdRef.current = null;
      pendingScrollToTopRef.current = false;
      return;
    }

    const previousFirstOrderId = previousFirstOrderIdRef.current;
    const newOrderWasInsertedAtTop = Boolean(
      firstOrderId
      && previousFirstOrderId
      && firstOrderId !== previousFirstOrderId
      && items.some((item) => item.orderId === previousFirstOrderId),
    );

    previousFirstOrderIdRef.current = firstOrderId;
    if (newOrderWasInsertedAtTop) pendingScrollToTopRef.current = true;
    if (!isActive || !firstOrderId || !pendingScrollToTopRef.current) return;

    const frame = requestAnimationFrame(() => {
      listRef.current?.scrollToOffset({ offset: 0, animated: true });
      pendingScrollToTopRef.current = false;
    });
    return () => cancelAnimationFrame(frame);
  }, [firstOrderId, focusedOrderId, isActive, items, tab]);

  const isInitialLoading = query.isLoading && items.length === 0;
  const handleRefresh = async () => {
    if (!isActive || isManualRefreshing) return;
    setIsManualRefreshing(true);
    try {
      void queryClient.invalidateQueries({ queryKey: riderHomeKeys.summary() });
      await query.refetch();
    } finally {
      setIsManualRefreshing(false);
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
      ref={listRef}
      data={items}
      keyExtractor={(item, index) => item.orderId ?? item.orderCode ?? `order-${index}`}
      contentContainerStyle={styles.listContent}
      renderItem={({ item }) => <HomeOrderCard order={item} tab={tab} highlighted={Boolean(highlightedOrderCode && item.orderCode?.replace(/^#/, '') === highlightedOrderCode.replace(/^#/, ''))} />}
      refreshing={isManualRefreshing}
      onRefresh={handleRefresh}
      onEndReachedThreshold={0.4}
      onEndReached={() => {
        if (isActive && query.hasNextPage && !query.isFetchingNextPage) {
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
