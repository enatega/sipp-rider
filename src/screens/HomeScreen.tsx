import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import TopSegmentedTabs from '../components/TopSegmentedTabs';
import { useAppTheme } from '../theme/ThemeProvider';
import { useTranslations } from '../localization/LocalizationProvider';
import { useRiderHomeSummaryQuery } from '../hooks/useRiderHomeQueries';
import { useRiderProfileQuery } from '../hooks/useRiderProfileQuery';
import RiderOrdersList from './home/RiderOrdersList';
import { RiderOrderTab } from '../api/riderHomeTypes';
import Text from '../components/Text';
import { useConfirmLogout } from '../hooks/useConfirmLogout';
import type { RiderTabParamList } from '../navigation/MainTabsNavigator';
import type { MainStackParamList } from '../navigation/types';
import OrderFlowNotice from '../components/OrderFlowNotice';
import { useRiderOrderAlerts } from '../providers/RiderOrderAlertsProvider';
import { useAuth } from '../auth/AuthProvider';

type HomeFilter = RiderOrderTab;
type AssignedOrder = { orderId: string; orderCode: string; storeName: string | null };

export default function HomeScreen() {
  const { theme } = useAppTheme();
  const { t } = useTranslations('app');
  const [homeFilter, setHomeFilter] = useState<HomeFilter>('new');
  const [visitedTabs, setVisitedTabs] = useState<HomeFilter[]>(['new']);
  const [assignedOrder, setAssignedOrder] = useState<AssignedOrder | null>(null);
  const [completedOrder, setCompletedOrder] = useState<{ orderCode: string } | null>(null);
  const [focusedOffer, setFocusedOffer] = useState<{ orderId: string; orderCode?: string } | null>(null);
  const route = useRoute<RouteProp<RiderTabParamList, 'HomeTab'>>();
  const navigation = useNavigation<BottomTabNavigationProp<RiderTabParamList>>();
  const summaryQuery = useRiderHomeSummaryQuery();
  const profileQuery = useRiderProfileQuery();
  const { closeOffer } = useRiderOrderAlerts();
  const { session } = useAuth();
  const { confirmLogout, isPending: isLoggingOut } = useConfirmLogout();
  const mountedTabs = visitedTabs.includes(homeFilter) ? visitedTabs : [...visitedTabs, homeFilter];

  useEffect(() => {
    setVisitedTabs((current) => current.includes(homeFilter) ? current : [...current, homeFilter]);
  }, [homeFilter]);

  useEffect(() => {
    if (!route.params?.assignedOrder) return;
    setHomeFilter('processing');
    setAssignedOrder(route.params.assignedOrder);
    navigation.setParams({ assignedOrder: undefined });
  }, [navigation, route.params?.assignedOrder]);

  useEffect(() => {
    if (!route.params?.preferredTab) return;
    setHomeFilter(route.params.preferredTab);
    navigation.setParams({ preferredTab: undefined });
  }, [navigation, route.params?.preferredTab]);

  useEffect(() => {
    if (!route.params?.completedOrder) return;
    setHomeFilter('delivered');
    setAssignedOrder(null);
    setCompletedOrder(route.params.completedOrder);
    navigation.setParams({ completedOrder: undefined });
  }, [navigation, route.params?.completedOrder]);

  useEffect(() => {
    if (!route.params?.focusedOffer) return;
    setHomeFilter('new');
    setFocusedOffer(route.params.focusedOffer);
    navigation.setParams({ focusedOffer: undefined });
  }, [navigation, route.params?.focusedOffer]);

  const handleAssigned = (order: AssignedOrder) => {
    closeOffer(order.orderId);
    setFocusedOffer(null);
    setHomeFilter('processing');
    setAssignedOrder(order);
  };

  const viewAssignedOrder = () => {
    if (!assignedOrder) return;
    const orderId = assignedOrder.orderId;
    setAssignedOrder(null);
    navigation.getParent<NativeStackNavigationProp<MainStackParamList>>()?.navigate('ProcessingOrderDetail', { orderId });
  };

  const filterTabs: HomeFilter[] = ['new', 'processing', 'delivered'];
  const summary = summaryQuery.data;
  const filterLabelMap: Record<HomeFilter, string> = {
    new: t('orders_new'),
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
                onPress={confirmLogout}
                disabled={isLoggingOut}
                style={[styles.logoutButton, { backgroundColor: theme.colors.red500 }]}
              >
                <Text weight="semiBold" color={theme.colors.white}>
                  {isLoggingOut ? t('auth_logout_loading') : t('auth_logout')}
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
        onChange={(tab) => {
          if (tab !== 'new') setFocusedOffer(null);
          setHomeFilter(tab);
        }}
        labelMap={filterLabelMap}
        countMap={filterCountMap}
      />

      {homeFilter === 'new' && focusedOffer ? (
        <View style={styles.focusRow}>
          <View style={[styles.focusPill, { backgroundColor: theme.isDark ? theme.colors.gray200 : theme.colors.sky100 }]}>
            <Feather name="filter" size={15} color={theme.colors.sky600} />
            <Text weight="semiBold" style={[styles.focusCode, { color: theme.colors.sky600 }]}>
              #{(focusedOffer.orderCode || focusedOffer.orderId.split('-')[0]).replace(/^#/, '').toUpperCase()}
            </Text>
            <View style={[styles.focusDivider, { backgroundColor: theme.colors.sky600 }]} />
            <Pressable accessibilityRole="button" accessibilityLabel={t('orders_focus_clear')} onPress={() => setFocusedOffer(null)} hitSlop={8} style={styles.focusClear}>
              <Feather name="x" size={18} color={theme.colors.sky600} />
            </Pressable>
          </View>
        </View>
      ) : null}

      {mountedTabs.map((tab) => <View key={tab} style={{ flex: 1, display: tab === homeFilter ? 'flex' : 'none' }}>
        <RiderOrdersList
          tab={tab}
          alertUserId={session.user?.id ?? null}
          canAlertNewOrders={profileQuery.data?.availabilityStatus === 'online'}
          onAssigned={handleAssigned}
          focusedOrderId={tab === 'new' ? focusedOffer?.orderId : undefined}
          highlightedOrderCode={tab === 'processing' ? assignedOrder?.orderCode : tab === 'delivered' ? completedOrder?.orderCode : null}
        />
      </View>)}
      <OrderFlowNotice
        visible={Boolean(assignedOrder)}
        orderCode={assignedOrder?.orderCode}
        title={t('rider_flow_assigned_title')}
        actionLabel={t('rider_flow_view_delivery')}
        onAction={viewAssignedOrder}
        onClose={() => setAssignedOrder(null)}
      />
      <OrderFlowNotice
        visible={Boolean(completedOrder)}
        orderCode={completedOrder?.orderCode}
        title={t('order_well_done_rider')}
        onClose={() => setCompletedOrder(null)}
      />
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
  focusRow: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 16, paddingTop: 8 },
  focusPill: { minHeight: 40, borderRadius: 20, paddingLeft: 12, paddingRight: 4, flexDirection: 'row', alignItems: 'center', gap: 8 },
  focusCode: { fontSize: 14, lineHeight: 18 },
  focusDivider: { width: StyleSheet.hairlineWidth, height: 18, opacity: 0.35 },
  focusClear: { width: 32, minHeight: 40, alignItems: 'center', justifyContent: 'center' },
});
