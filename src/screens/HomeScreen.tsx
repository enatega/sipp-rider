import React, { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useNavigation, useRoute, useIsFocused, type RouteProp } from '@react-navigation/native';
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
import AvailabilityOffNotice from '../components/AvailabilityOffNotice';
import { useRiderAvailability } from '../hooks/useRiderAvailability';
import type { AssignOrderResponse, RiderHomeOrder, RiderOrderTab } from '../api/riderHomeTypes';
import { riderHomeKeys } from '../api/queryKeys';
import Text from '../components/Text';
import { useConfirmLogout } from '../hooks/useConfirmLogout';
import type { RiderTabParamList } from '../navigation/MainTabsNavigator';
import type { MainStackParamList } from '../navigation/types';
import OrderFlowNotice from '../components/OrderFlowNotice';
import { useRiderOrderAlerts } from '../providers/RiderOrderAlertsProvider';
import { useAuth } from '../auth/AuthProvider';
import RiderLocationDisclosureModal from '../components/RiderLocationDisclosureModal';
import HeaderLanguageSelect from '../components/HeaderLanguageSelect';
import { useRiderLocationOnboardingDisclosure } from '../hooks/useRiderLocationOnboardingDisclosure';

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
  const isFocused = useIsFocused();
  const summaryQuery = useRiderHomeSummaryQuery(isFocused);
  const profileQuery = useRiderProfileQuery();
  const { setAvailability, isPending: isAvailabilityPending } = useRiderAvailability();
  // Orders are only offered to online riders, so an offline rider sees no New orders or count.
  const isAvailabilityOff = profileQuery.data?.availabilityStatus === 'offline';
  const { closeOffer } = useRiderOrderAlerts();
  const { session } = useAuth();
  const { confirmLogout, isPending: isLoggingOut } = useConfirmLogout();
  const locationDisclosure = useRiderLocationOnboardingDisclosure(
    Boolean(session.token) && profileQuery.data?.isApproved === true,
  );
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
  const handleAssignedRef = useRef(handleAssigned);
  handleAssignedRef.current = handleAssigned;

  // Move to Pickup after any successful "Assign me", even if the card that started it
  // was already removed from New by the order-status socket event.
  const queryClient = useQueryClient();
  useEffect(() => {
    const assignMeKey = JSON.stringify(riderHomeKeys.assignMe());
    return queryClient.getMutationCache().subscribe((event) => {
      if (event.type !== 'updated' || event.action.type !== 'success') return;
      const { mutation } = event;
      if (JSON.stringify(mutation.options.mutationKey) !== assignMeKey) return;
      const response = mutation.state.data as AssignOrderResponse | undefined;
      const cachedOrder = mutation.state.context as RiderHomeOrder | undefined;
      const orderId = response?.orderId ?? (mutation.state.variables as string | undefined);
      if (!orderId) return;
      const orderCode = (cachedOrder?.orderCode ?? orderId.split('-')[0].toUpperCase()).replace(/^#/, '');
      handleAssignedRef.current({ orderId, orderCode, storeName: cachedOrder?.storeName ?? null });
    });
  }, [queryClient]);

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
        <View style={styles.headerRight}>
          <HeaderLanguageSelect />
        </View>
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
        hiddenCountTabs={isAvailabilityOff ? ['new'] : undefined}
      />

      {homeFilter === 'new' && focusedOffer && !isAvailabilityOff ? (
        <View style={styles.focusRow}>
          <View style={[styles.focusPill, { backgroundColor: theme.isDark ? theme.colors.gray200 : theme.colors.primarySoft }]}>
            <Feather name="filter" size={15} color={theme.colors.brandInk} />
            <Text weight="semiBold" style={[styles.focusCode, { color: theme.colors.brandInk }]}>
              #{(focusedOffer.orderCode || focusedOffer.orderId.split('-')[0]).replace(/^#/, '').toUpperCase()}
            </Text>
            <View style={[styles.focusDivider, { backgroundColor: theme.colors.brandInk }]} />
            <Pressable accessibilityRole="button" accessibilityLabel={t('orders_focus_clear')} onPress={() => setFocusedOffer(null)} hitSlop={8} style={styles.focusClear}>
              <Feather name="x" size={18} color={theme.colors.brandInk} />
            </Pressable>
          </View>
        </View>
      ) : null}

      {mountedTabs.map((tab) => <View key={tab} style={{ flex: 1, display: tab === homeFilter ? 'flex' : 'none' }}>
        {tab === 'new' && isAvailabilityOff ? (
          <AvailabilityOffNotice onTurnOn={() => setAvailability(true)} isPending={isAvailabilityPending} />
        ) : <RiderOrdersList
          isActive={isFocused && tab === homeFilter}
          tab={tab}
          focusedOrderId={tab === 'new' ? focusedOffer?.orderId : undefined}
          highlightedOrderCode={tab === 'processing' ? assignedOrder?.orderCode : tab === 'delivered' ? completedOrder?.orderCode : null}
        />}
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
      <RiderLocationDisclosureModal
        visible={locationDisclosure.visible}
        onContinue={() => void locationDisclosure.onContinue()}
        onNotNow={() => void locationDisclosure.onNotNow()}
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
  headerRight: {
    position: 'absolute',
    right: 16,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
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
