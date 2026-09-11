import React, { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import Text from '../../components/Text';
import VerticalList from '../../components/VerticalList';
import HomeOrderCard from '../../components/HomeOrderCard';
import { useRiderOrdersInfiniteQuery } from '../../hooks/useRiderHomeQueries';
import { RiderOrderTab } from '../../api/riderHomeTypes';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useTranslations } from '../../localization/LocalizationProvider';
import { riderHomeKeys } from '../../api/queryKeys';

type Props = {
  tab: RiderOrderTab;
};

export default function RiderOrdersList({ tab }: Props) {
  const { theme } = useAppTheme();
  const { t } = useTranslations('app');
  const queryClient = useQueryClient();
  const query = useRiderOrdersInfiniteQuery(tab);
  console.log('list_Data_New_orders',JSON.stringify(query?.data,null,2));
  const items = useMemo(
    () => query.data?.pages.flatMap((page) => page.items) ?? [],
    [query.data?.pages],
  );

  const isInitialLoading = query.isLoading && items.length === 0;
  const isRefreshing = query.isRefetching && !query.isFetchingNextPage;

  const handleRefresh = async () => {
    await Promise.all([
      query.refetch(),
      queryClient.invalidateQueries({ queryKey: riderHomeKeys.summary() }),
    ]);
  };

  if (isInitialLoading) {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  if (query.isError && items.length === 0) {
    return (
      <View style={styles.centerState}>
        <Text color={theme.colors.gray600}>{query.error.message}</Text>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.centerState}>
        <Text color={theme.colors.gray600}>{t('orders_empty')}</Text>
      </View>
    );
  }

  return (
    <VerticalList
      data={items}
      keyExtractor={(item, index) => item.orderId ?? item.orderCode ?? `order-${index}`}
      contentContainerStyle={styles.listContent}
      renderItem={({ item }) => <HomeOrderCard order={item} tab={tab} />}
      refreshing={isRefreshing}
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
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 16,
  },
  footerLoading: {
    paddingVertical: 16,
  },
});
