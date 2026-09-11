import React, { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import EarningsActivityRow from '../components/EarningsActivityRow';
import EarningsChart from '../components/EarningsChart';
import Text from '../components/Text';
import VerticalList from '../components/VerticalList';
import { earningsService } from '../api/earningsService';
import { RiderEarningsActivity, RiderEarningsResponse } from '../api/earningsTypes';
import { useTranslations } from '../localization/LocalizationProvider';
import { MainStackParamList } from '../navigation/types';
import { lightColors } from '../theme/colors';
import { typography } from '../theme/typography';

export default function EarningsScreen() {
  const { t } = useTranslations('app');
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const [earningsData, setEarningsData] = useState<RiderEarningsResponse | null>(null);
  const hasRecentActivity = Boolean((earningsData?.recent_activity?.length ?? 0) > 0);

  const handleSeeMore = () => navigation.navigate('EarningsDetail');

  useEffect(() => {
    let isActive = true;

    earningsService
      .getRiderEarnings({ groupBy: 'week', recentLimit: 7 })
      .then((response) => {
        if (isActive) {
          setEarningsData(response);
        }
      })
      .catch((error: unknown) => {
        console.log('[EARNINGS API ERROR]', error);
      });

    return () => {
      isActive = false;
    };
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: lightColors.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: lightColors.background }]}>
        <Text variant="body" weight="semiBold" color={lightColors.black} style={styles.headerTitle}>
          {t('nav_earnings')}
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, !hasRecentActivity ? styles.emptyScrollContent : null]}
      >
        {hasRecentActivity ? (
          <>
            <EarningsChart data={earningsData?.chart} />

            <View style={styles.activitySection}>
              <View style={styles.sectionHeader}>
                <Text variant="subtitle" weight="semiBold" color={lightColors.gray900} style={styles.sectionTitle}>
                  {t('earnings_recent_activity')}
                </Text>
                <Pressable onPress={handleSeeMore} accessibilityRole="button" hitSlop={8}>
                  <Text variant="caption" weight="semiBold" color={lightColors.blue500} style={styles.seeMore}>
                    {t('earnings_see_more')}
                  </Text>
                </Pressable>
              </View>

              <VerticalList
                data={earningsData?.recent_activity}
                keyExtractor={(item: RiderEarningsActivity) => item.activity_date}
                renderItem={({ item }) => (
                  <EarningsActivityRow item={item} onPress={handleSeeMore} />
                )}
                scrollEnabled={false}
              />
            </View>
          </>
        ) : (
          <View style={styles.emptyState}>
            <Image source={require('../assets/images/noEarning.png')} style={styles.emptyIllustration} resizeMode="contain" />
            <View style={styles.emptyTextWrap}>
              <Text variant="body" weight="semiBold" color={lightColors.gray900} style={styles.emptyTitle}>
                {t('earnings_empty_title')}
              </Text>
              <Text variant="body" color={lightColors.gray600} style={styles.emptySubtitle}>
                {t('earnings_empty_subtitle')}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: typography.size.md,
    lineHeight: typography.lineHeight.md,
    textAlign: 'center',
  },
  scrollContent: {
    paddingBottom: 24,
  },
  emptyScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  emptyState: {
    alignItems: 'center',
    gap: 16,
    marginTop: -60,
  },
  emptyIllustration: {
    width: 160,
    height: 160,
  },
  emptyTextWrap: {
    alignItems: 'center',
    gap: 6,
  },
  emptyTitle: {
    fontSize: typography.size.md,
    lineHeight: typography.lineHeight.md,
    textAlign: 'center',
  },
  emptySubtitle: {
    width: 180,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    textAlign: 'center',
  },
  activitySection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    gap: 8,
  },
  sectionHeader: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    gap: 6,
  },
  sectionTitle: {
    flex: 1,
    fontSize: typography.size.lg,
    lineHeight: typography.lineHeight.lg,
    fontWeight: 'bold',
  },
  seeMore: {
    width: 62,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
    textAlign: 'right',
  },
});
