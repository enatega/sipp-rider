import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TopSegmentedTabs from '../components/TopSegmentedTabs';
import { useAppTheme } from '../theme/ThemeProvider';
import { useTranslations } from '../localization/LocalizationProvider';
import { useRiderHomeSummaryQuery } from '../hooks/useRiderHomeQueries';
import { useRiderProfileQuery } from '../hooks/useRiderProfileQuery';
import RiderOrdersList from './home/RiderOrdersList';
import { RiderOrderTab } from '../api/riderHomeTypes';
import Text from '../components/Text';
import { useLogoutMutation } from '../hooks/useAuthMutations';

type HomeFilter = RiderOrderTab;

export default function HomeScreen() {
  const { theme } = useAppTheme();
  const { t } = useTranslations('app');
  const [homeFilter, setHomeFilter] = useState<HomeFilter>('new');
  const summaryQuery = useRiderHomeSummaryQuery();
  const profileQuery = useRiderProfileQuery();
  const logoutMutation = useLogoutMutation();

  const filterTabs: HomeFilter[] = ['new', 'processing', 'delivered'];
  const summary = summaryQuery.data;
  const filterLabelMap: Record<HomeFilter, string> = {
    new: t('orders_ready'),
    processing: t('orders_pickup'),
    delivered: t('orders_completed'),
  };
  const filterCountMap: Record<HomeFilter, number> = {
    new: summary?.newOrders ?? 0,
    processing: summary?.processingOrders ?? 0,
    delivered: summary?.deliveredOrders ?? 0,
  };

  const isApproved = profileQuery.data?.isApproved;

  if (isApproved === false) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
        <Modal transparent animationType="fade" visible>
          <View style={[styles.modalBackdrop, { backgroundColor: theme.colors.modalBackdrop }]}>
            <View style={[styles.modalCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.gray200 }]}>
              <Text weight="semiBold" style={[styles.modalTitle, { color: theme.colors.gray900 }]}>
                {t('home_not_approved_title')}
              </Text>
              <Text weight="medium" style={[styles.pendingText, { color: theme.colors.gray600 }]}>
                {t('home_orders_hidden_unapproved')}
              </Text>
              <Pressable
                onPress={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                style={[styles.logoutButton, { backgroundColor: theme.colors.red500 }]}
              >
                <Text weight="semiBold" color={theme.colors.white}>
                  {logoutMutation.isPending ? t('auth_logout_loading') : t('auth_logout')}
                </Text>
              </Pressable>
            </View>
          </View>
        </Modal>
        <View style={styles.blockedContent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <View style={styles.headerWrap}>
        <Text weight="semiBold" style={[styles.headerTitle, { color: theme.colors.gray900 }]}>{t('home_header_title')}</Text>
      </View>

      <TopSegmentedTabs
        tabs={filterTabs}
        activeTab={homeFilter}
        onChange={setHomeFilter}
        labelMap={filterLabelMap}
        countMap={filterCountMap}
      />

      <RiderOrdersList tab={homeFilter} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  blockedContent: {
    flex: 1,
  },
  headerWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerTitle: {
    fontSize: 42 / 2,
    lineHeight: 56 / 2,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 18,
    gap: 14,
  },
  modalTitle: {
    fontSize: 18,
    lineHeight: 26,
    textAlign: 'center',
  },
  pendingText: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
  },
  logoutButton: {
    minHeight: 46,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
});
