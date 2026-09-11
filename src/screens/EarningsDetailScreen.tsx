import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import EarningsActivityRow from '../components/EarningsActivityRow';
import EarningsBottomSheet from '../components/EarningsBottomSheet';
import SummaryCard from '../components/SummaryCard';
import Text from '../components/Text';
import VerticalList from '../components/VerticalList';
import type { RiderEarningsActivity } from '../api/earningsTypes';
import { useRiderEarningsActivitiesQuery } from '../hooks/useEarningsQueries';
import { useAppCurrency } from '../hooks/useCurrency';
import { useTranslations } from '../localization/LocalizationProvider';
import { MainStackParamList } from '../navigation/types';
import { lightColors } from '../theme/colors';
import { useAppTheme } from '../theme/ThemeProvider';
import { typography } from '../theme/typography';

type Props = NativeStackScreenProps<MainStackParamList, 'EarningsDetail'>;
const ACTIVITIES_PAGE = 1;
const ACTIVITIES_LIMIT = 10;

export default function EarningsDetailScreen({ navigation }: Props) {
  const { theme } = useAppTheme();
  const { t } = useTranslations('app');
  const { formatCurrency } = useAppCurrency();
  const [selectedActivity, setSelectedActivity] = useState<RiderEarningsActivity | null>(null);
  const { data: activitiesData } = useRiderEarningsActivitiesQuery(
    ACTIVITIES_PAGE,
    ACTIVITIES_LIMIT,
  );

  const summaryItems = useMemo(
    () => [
      { label: t('earnings_hours'), value: activitiesData?.summary.hours_worked ?? '' },
      { label: t('earnings_deliveries'), value: `${activitiesData?.summary.deliveries ?? ''}` },
      {
        label: t('earnings_total_earnings'),
        value: activitiesData ? formatCurrency(activitiesData.summary.total_earnings) : '',
      },
    ],
    [activitiesData, t, formatCurrency],
  );

  const dateRangeTitle = activitiesData
    ? `${activitiesData.date_range.start_date} - ${activitiesData.date_range.end_date}`
    : '';

  const handlePressDeliveries = () => {
    const activityDate = selectedActivity?.activity_date;
    const activityId = activityDate ? activityDate.split('T')[0] : undefined;
    setSelectedActivity(null);
    navigation.navigate('DeliveriesDetail', { earningId: activityId });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: theme.colors.background }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.iconButton} hitSlop={8} accessibilityRole="button" accessibilityLabel="Go back">
          <ArrowLeft color={theme.colors.gray900} />
        </Pressable>
        <Text variant="body" weight="semiBold" color={lightColors.black} style={styles.headerTitle} numberOfLines={1}>
          {dateRangeTitle}
        </Text>
        <Pressable style={styles.iconButton} hitSlop={8} accessibilityRole="button" accessibilityLabel="Select date range">
          <FunnelIcon color={theme.colors.gray900} />
        </Pressable>
      </View>

      <VerticalList
        data={activitiesData?.data}
        keyExtractor={(item: RiderEarningsActivity) => item.activity_date}
        renderItem={({ item, index }) => (
          <View style={[styles.activityListItem, index === 0 ? styles.firstActivityListItem : null]}>
            <EarningsActivityRow
              item={item}
              onPress={setSelectedActivity}
            />
          </View>
        )}
        ListHeaderComponent={<SummaryCard title={t('earnings_summary')} items={summaryItems} />}
        style={styles.list}
        contentContainerStyle={styles.listContent}
      />

      <EarningsBottomSheet
        visible={Boolean(selectedActivity)}
        item={selectedActivity}
        onClose={() => setSelectedActivity(null)}
        onPressDeliveries={handlePressDeliveries}
      />
    </SafeAreaView>
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

function FunnelIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 5H20L14 12V19L10 21V12L4 5Z"
        stroke={color}
        strokeWidth={1.8}
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
    paddingBottom: 24,
  },
  activityListItem: {
    paddingHorizontal: 16,
  },
  firstActivityListItem: {
    paddingTop: 12,
  },
});
