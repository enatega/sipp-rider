import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import DeliveryItemRow from '../components/DeliveryItemRow';
import DeliveriesEmptyState from '../components/DeliveriesEmptyState';
import Text from '../components/Text';
import SkeletonPulse from '../components/SkeletonPulse';
import VerticalList from '../components/VerticalList';
import type { RiderEarningsActivityDelivery } from '../api/earningsTypes';
import { useRiderEarningsActivityDeliveriesQuery } from '../hooks/useEarningsQueries';
import { useTranslations } from '../localization/LocalizationProvider';
import { MainStackParamList } from '../navigation/types';
import { lightColors } from '../theme/colors';
import { useAppTheme } from '../theme/ThemeProvider';
import { typography } from '../theme/typography';

type Props = NativeStackScreenProps<MainStackParamList, 'DeliveriesDetail'>;

export default function DeliveriesDetailScreen({ navigation, route }: Props) {
  const { theme } = useAppTheme();
  const { t } = useTranslations('app');
  const activityDate = route.params?.earningId;
  const { data, isLoading } = useRiderEarningsActivityDeliveriesQuery(activityDate);
  const hasDeliveries = (data?.deliveries.length ?? 0) > 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: theme.colors.background }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.iconButton} hitSlop={8} accessibilityRole="button" accessibilityLabel="Go back">
          <ArrowLeft color={theme.colors.gray900} />
        </Pressable>
        <Text variant="body" weight="semiBold" color={lightColors.black} style={styles.headerTitle}>
          {t('earnings_deliveries')}
        </Text>
        <View style={styles.iconButton} />
      </View>

      <VerticalList
        data={data?.deliveries}
        keyExtractor={(item: RiderEarningsActivityDelivery) => item.order_id}
        renderItem={({ item }) => <DeliveryItemRow item={item} />}
        style={styles.list}
        contentContainerStyle={[styles.listContent, !hasDeliveries && !isLoading ? styles.emptyListContent : null]}
        ListEmptyComponent={
          isLoading ? (
            <DeliveriesSkeleton />
          ) : (
            <DeliveriesEmptyState
              title={t('earnings_deliveries_empty_title')}
              subtitle={t('earnings_deliveries_empty_subtitle')}
            />
          )
        }
      />
    </SafeAreaView>
  );
}

function DeliveriesSkeleton() {
  const { theme } = useAppTheme();
  const { t } = useTranslations('app');
  const bone = { backgroundColor: theme.colors.gray200 };

  return (
    <SkeletonPulse accessibilityLabel={t('notifications_loading')}>
      {[0, 1, 2, 3, 4].map((key) => (
        <View key={key} style={[styles.skeletonRow, { borderBottomColor: theme.colors.gray300 }]}>
          <View style={styles.skeletonLine}>
            <View style={[styles.skeletonBone, bone, { width: 150, height: 16 }]} />
            <View style={[styles.skeletonBone, bone, { width: 80, height: 22, borderRadius: 12 }]} />
          </View>
          <View style={styles.skeletonLine}>
            <View style={[styles.skeletonBone, bone, { width: 70, height: 16 }]} />
            <View style={[styles.skeletonBone, bone, { width: 64, height: 16 }]} />
          </View>
        </View>
      ))}
    </SkeletonPulse>
  );
}

function ArrowLeft({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19L5 12L12 5"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 8,
  },
  iconButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: typography.size.md,
    lineHeight: typography.lineHeight.md,
    textAlign: 'center',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingTop: 0,
    paddingBottom: 24,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  skeletonRow: {
    minHeight: 84,
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  skeletonLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  skeletonBone: {
    borderRadius: 8,
  },
});
