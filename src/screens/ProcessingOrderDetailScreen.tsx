import AddressDetailsView from '../components/AddressDetailsView';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Linking, Modal, Pressable, ScrollView, StyleSheet, View, type AppStateStatus } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useIsFocused } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import Map from '../components/Map';
import Text from '../components/Text';
import Button from '../components/Button';
import OrderConversationButton from '../components/OrderConversationButton';
import RiderLocationDisclosureModal from '../components/RiderLocationDisclosureModal';
import PhoneIcon from '../assets/svgs/phone.svg';
import { MainStackParamList } from '../navigation/types';
import { useAppTheme } from '../theme/ThemeProvider';
import { useTranslations } from '../localization/LocalizationProvider';
import { useRiderOrderDetailQuery } from '../hooks/useRiderOrderDetailQuery';
import { useUpdateRiderOrderStatusMutation } from '../hooks/useRiderHomeMutations';
import OrderDetailTopBar from './orderDetail/components/OrderDetailTopBar';
import {
  DELIVERY_PROGRESS_ORDER,
  resolveProgressStatusFromOrder,
  RiderDeliveryProgressStatus,
} from './orderDetail/progress';
import { StatusBar } from 'expo-status-bar';
import type { RiderOrderUpdatableStatus } from '../api/riderHomeTypes';
import type MapView from 'react-native-maps';
import { useRiderLiveLocationTracking } from '../hooks/useRiderLiveLocationTracking';
import { getRiderDeliveryLocationPermissionStatus, requestRiderDeliveryLocationPermissions, stopRiderBackgroundLocation } from '../location/riderBackgroundLocationTask';
import { useRiderOrderChatUnreadQuery } from '../hooks/useSupportChat';

type Props = NativeStackScreenProps<MainStackParamList, 'ProcessingOrderDetail'>;

const FALLBACK_REGION = {
  latitude: 33.6844,
  longitude: 73.0479,
  latitudeDelta: 0.03,
  longitudeDelta: 0.03,
};
const DETAIL_RESUME_REFETCH_COOLDOWN_MS = 15_000;

const STATUS_TITLE_KEY: Record<RiderDeliveryProgressStatus, string> = {
  [RiderDeliveryProgressStatus.ASSIGNED]: 'order_status_assigned',
  [RiderDeliveryProgressStatus.HEADING_TO_STORE]: 'order_status_heading_to_store',
  [RiderDeliveryProgressStatus.ARRIVED_AT_STORE]: 'order_status_arrived_at_store',
  [RiderDeliveryProgressStatus.WAITING_FOR_ORDER]: 'order_status_waiting_for_order',
  [RiderDeliveryProgressStatus.PICKED_UP]: 'order_status_picked_up',
  [RiderDeliveryProgressStatus.OUT_FOR_DELIVERY]: 'order_status_out_for_delivery',
  [RiderDeliveryProgressStatus.ARRIVED_AT_CUSTOMER]: 'order_status_arrived_at_customer',
  [RiderDeliveryProgressStatus.DELIVERED]: 'order_status_delivered',
  [RiderDeliveryProgressStatus.FAILED]: 'order_status_failed',
};

const NEXT_STATUS_KEY: Record<RiderDeliveryProgressStatus, string> = {
  [RiderDeliveryProgressStatus.ASSIGNED]: 'order_status_heading_to_store',
  [RiderDeliveryProgressStatus.HEADING_TO_STORE]: 'order_status_arrived_at_store',
  [RiderDeliveryProgressStatus.ARRIVED_AT_STORE]: 'order_status_waiting_for_order',
  [RiderDeliveryProgressStatus.WAITING_FOR_ORDER]: 'order_status_picked_up',
  [RiderDeliveryProgressStatus.PICKED_UP]: 'order_status_out_for_delivery',
  [RiderDeliveryProgressStatus.OUT_FOR_DELIVERY]: 'order_status_arrived_at_customer',
  [RiderDeliveryProgressStatus.ARRIVED_AT_CUSTOMER]: 'order_status_delivered',
  [RiderDeliveryProgressStatus.DELIVERED]: 'order_status_delivered',
  [RiderDeliveryProgressStatus.FAILED]: 'order_status_failed',
};

const STANDARD_PROGRESS_ORDER = DELIVERY_PROGRESS_ORDER.filter(
  (status) => status !== RiderDeliveryProgressStatus.FAILED,
);

const NEXT_UPDATE_STATUS: Partial<Record<RiderDeliveryProgressStatus, RiderOrderUpdatableStatus>> = {
  [RiderDeliveryProgressStatus.ASSIGNED]: 'heading_to_store',
  [RiderDeliveryProgressStatus.HEADING_TO_STORE]: 'arrived_at_store',
  [RiderDeliveryProgressStatus.ARRIVED_AT_STORE]: 'waiting_for_order',
  [RiderDeliveryProgressStatus.PICKED_UP]: 'out_for_delivery',
  [RiderDeliveryProgressStatus.OUT_FOR_DELIVERY]: 'arrived',
  [RiderDeliveryProgressStatus.ARRIVED_AT_CUSTOMER]: 'delivered',
};

const STATUS_BUTTON_LABEL_KEY: Record<RiderOrderUpdatableStatus, string> = {
  heading_to_store: 'order_begin_trip_to_store',
  arrived_at_store: 'order_status_arrived_at_store',
  waiting_for_order: 'order_status_waiting_for_order',
  picked_up: 'order_status_picked_up',
  out_for_delivery: 'order_status_out_for_delivery',
  arrived: 'order_status_arrived_at_customer',
  delivered: 'order_status_delivered',
  failed: 'order_status_failed',
};

function isRiderOrderUpdatableStatus(value: string): value is RiderOrderUpdatableStatus {
  return value in STATUS_BUTTON_LABEL_KEY;
}

function getNextStatusTitleKey(
  currentStatus: RiderDeliveryProgressStatus,
  nextUpdateStatus: RiderOrderUpdatableStatus | null,
) {
  if (nextUpdateStatus) {
    return STATUS_BUTTON_LABEL_KEY[nextUpdateStatus];
  }

  return NEXT_STATUS_KEY[currentStatus];
}

export default function ProcessingOrderDetailScreen({ route, navigation }: Props) {
  const { theme } = useAppTheme();
  const { t } = useTranslations('app');
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const { orderId } = route.params;
  const detailQuery = useRiderOrderDetailQuery(orderId, isFocused);
  const chatUnreadQuery = useRiderOrderChatUnreadQuery();
  const chatUnreadCounts = chatUnreadQuery.data?.byOrderAndKind?.[orderId];
  const updateStatusMutation = useUpdateRiderOrderStatusMutation(orderId);
  const [isRequestingLocationPermission, setIsRequestingLocationPermission] = useState(false);
  const [locationPermissionIssue, setLocationPermissionIssue] = useState<'foreground' | 'background' | null>(null);
  const [canAskLocationAgain, setCanAskLocationAgain] = useState(true);
  const [locationPermissionRevision, setLocationPermissionRevision] = useState(0);
  const [locationDisclosureIntent, setLocationDisclosureIntent] = useState<'pickup' | 'retry' | null>(null);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(56);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const lastResumeRefetchAtRef = useRef(0);
  const mapRef = useRef<MapView>(null);
  const isFocusedRef = useRef(isFocused);
  const isFetchingRef = useRef(detailQuery.isFetching);
  const isLiveTrackingStatus = ['picked_up', 'out_for_delivery', 'arrived'].includes(
    detailQuery.data?.status ?? '',
  );

  useEffect(() => {
    isFocusedRef.current = isFocused;
  }, [isFocused]);

  useEffect(() => {
    isFetchingRef.current = detailQuery.isFetching;
  }, [detailQuery.isFetching]);

  useEffect(() => {
    if (!orderId) return undefined;

    const subscription = AppState.addEventListener('change', (nextState) => {
      const previousState = appStateRef.current;
      appStateRef.current = nextState;

      const isReturningToForeground =
        (previousState === 'background' || previousState === 'inactive')
        && nextState === 'active';

      if (!isReturningToForeground || !isFocusedRef.current) return;

      if (isLiveTrackingStatus) {
        void getRiderDeliveryLocationPermissionStatus().then((permission) => {
          setLocationPermissionIssue(permission.granted ? null : permission.level);
          setCanAskLocationAgain(permission.granted || permission.canAskAgain);
          if (permission.granted) setLocationPermissionRevision((revision) => revision + 1);
        }).catch(() => setLocationPermissionIssue('foreground'));
      }

      const now = Date.now();
      const elapsedSinceLastRefetch = now - lastResumeRefetchAtRef.current;
      if (elapsedSinceLastRefetch < DETAIL_RESUME_REFETCH_COOLDOWN_MS || isFetchingRef.current) return;

      lastResumeRefetchAtRef.current = now;
      void detailQuery.refetch();
    });

    return () => {
      subscription.remove();
    };
  }, [detailQuery.refetch, isLiveTrackingStatus, orderId]);

  useEffect(() => {
    if (!isLiveTrackingStatus) return;
    void getRiderDeliveryLocationPermissionStatus().then((permission) => {
      setLocationPermissionIssue(permission.granted ? null : permission.level);
      setCanAskLocationAgain(permission.granted || permission.canAskAgain);
    }).catch(() => setLocationPermissionIssue('foreground'));
  }, [isLiveTrackingStatus]);
  const riderLocation = useRiderLiveLocationTracking({
    customerUserId: detailQuery.data?.customerUserId,
    enabled: isLiveTrackingStatus,
    orderId,
    stopWhenDisabled: Boolean(detailQuery.data?.status) && !isLiveTrackingStatus,
    permissionRevision: locationPermissionRevision,
  });
  const pickupCoordinate = useMemo(
    () => toCoordinate(detailQuery.data?.pickupLatitude, detailQuery.data?.pickupLongitude),
    [detailQuery.data?.pickupLatitude, detailQuery.data?.pickupLongitude],
  );
  const deliveryCoordinate = useMemo(
    () => toCoordinate(detailQuery.data?.deliveryLatitude, detailQuery.data?.deliveryLongitude),
    [detailQuery.data?.deliveryLatitude, detailQuery.data?.deliveryLongitude],
  );
  const navigationDestination = isLiveTrackingStatus
    ? deliveryCoordinate
    : pickupCoordinate;
  const visibleMapCoordinates = useMemo(
    () => [
      riderLocation,
      navigationDestination,
    ].filter((coordinate): coordinate is { latitude: number; longitude: number } => Boolean(coordinate)),
    [navigationDestination, riderLocation],
  );
  const mapRegion = useMemo(
    () => getRegionForCoordinates(visibleMapCoordinates) ?? FALLBACK_REGION,
    [visibleMapCoordinates],
  );

  useEffect(() => {
    if (visibleMapCoordinates.length === 0) return;

    if (visibleMapCoordinates.length === 1) {
      mapRef.current?.animateToRegion(
        {
          ...visibleMapCoordinates[0],
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        220,
      );
      return;
    }

    mapRef.current?.fitToCoordinates(visibleMapCoordinates, {
      animated: true,
      edgePadding: { top: 200, right: 48, bottom: 270, left: 48 },
    });
  }, [visibleMapCoordinates]);

  const currentProgressStatus = useMemo(
    () => resolveProgressStatusFromOrder(detailQuery.data?.status, detailQuery.data?.riderStatus),
    [detailQuery.data?.riderStatus, detailQuery.data?.status],
  );

  const openNavigation = async () => {
    if (!navigationDestination) return;

    const origin = riderLocation
      ? `&origin=${riderLocation.latitude},${riderLocation.longitude}`
      : '';
    const url = `https://www.google.com/maps/dir/?api=1${origin}&destination=${navigationDestination.latitude},${navigationDestination.longitude}&travelmode=driving`;
    await Linking.openURL(url);
  };

  const openDialer = async () => {
    const phone = detailQuery.data?.customerPhone?.trim();
    if (!phone) return;
    await Linking.openURL(`tel:${phone}`);
  };

  const openChat = (kind: 'store_rider' | 'customer_rider') => {
    const isCustomerChat = kind === 'customer_rider';
    navigation.navigate('OrderChat', {
      orderId,
      name: isCustomerChat
        ? detailQuery.data?.customerName?.trim() || t('chat_customer_name')
        : detailQuery.data?.storeName?.trim() || t('chat_store_name'),
      phone: isCustomerChat ? detailQuery.data?.customerPhone ?? null : null,
      chatBoxId: isCustomerChat
        ? detailQuery.data?.customerRiderChatBoxId ?? null
        : detailQuery.data?.chatBoxId ?? null,
      receiverId: isCustomerChat
        ? detailQuery.data?.customerUserId ?? null
        : detailQuery.data?.storeUserId ?? null,
      kind,
    });
  };

  const currentTitle = t(STATUS_TITLE_KEY[currentProgressStatus]);
  const serverOrderStatus = detailQuery.data?.status;
  const serverAllowedNextUpdateStatus =
    detailQuery.data?.nextAllowedStatuses?.find(isRiderOrderUpdatableStatus) ?? null;
  const fallbackNextUpdateStatus = NEXT_UPDATE_STATUS[currentProgressStatus] ?? null;
  const shouldAllowReadyFallback =
    serverOrderStatus === 'ready'
    && currentProgressStatus === RiderDeliveryProgressStatus.HEADING_TO_STORE;
  const nextUpdateStatus = serverAllowedNextUpdateStatus ?? fallbackNextUpdateStatus;
  const canUpdateRiderTravelStatus =
    (nextUpdateStatus === 'heading_to_store'
      || nextUpdateStatus === 'arrived_at_store'
      || nextUpdateStatus === 'waiting_for_order')
    && ['accepted', 'preparing', 'ready', 'rider_assigned'].includes(serverOrderStatus ?? '');
  const nextTitle = t(getNextStatusTitleKey(currentProgressStatus, nextUpdateStatus));
  const currentIndex = STANDARD_PROGRESS_ORDER.indexOf(currentProgressStatus);
  const step = currentIndex >= 0 ? currentIndex + 1 : STANDARD_PROGRESS_ORDER.length;
  const isFailed = currentProgressStatus === RiderDeliveryProgressStatus.FAILED;
  const progressTimeline = currentProgressStatus === RiderDeliveryProgressStatus.FAILED
    ? [RiderDeliveryProgressStatus.FAILED]
    : STANDARD_PROGRESS_ORDER;
  const timelineCurrentIndex = progressTimeline.indexOf(currentProgressStatus);
  const destinationName = isLiveTrackingStatus
    ? detailQuery.data?.customerName?.trim() || t('chat_customer_name')
    : detailQuery.data?.storeName?.trim() || t('chat_store_name');
  const destinationAddress = isLiveTrackingStatus
    ? detailQuery.data?.deliveryAddress
    : detailQuery.data?.pickupAddress;
  const canUpdateStatus =
    detailQuery.data?.canUpdateStatus === true || shouldAllowReadyFallback || canUpdateRiderTravelStatus;
  const isAtStore =
    currentProgressStatus === RiderDeliveryProgressStatus.ARRIVED_AT_STORE
    || currentProgressStatus === RiderDeliveryProgressStatus.WAITING_FOR_ORDER;
  const isStoreReadyForPickup = serverOrderStatus === 'ready';
  const showStorePreparingAlert =
    isAtStore && ['accepted', 'preparing', 'rider_assigned'].includes(serverOrderStatus ?? '');
  const waitingForStoreReadyToPickup =
    currentProgressStatus === RiderDeliveryProgressStatus.WAITING_FOR_ORDER
    && !isStoreReadyForPickup;
  const showReadyForPickupAlert = isAtStore && isStoreReadyForPickup;
  const primaryButtonLabel = waitingForStoreReadyToPickup
    ? t('order_waiting_for_order_disabled')
    : nextUpdateStatus
      ? t(STATUS_BUTTON_LABEL_KEY[nextUpdateStatus])
      : t('order_start_navigation');
  const isPrimaryActionDisabled =
    updateStatusMutation.isPending
    || isRequestingLocationPermission
    || locationDisclosureIntent !== null
    || !canUpdateStatus
    || !nextUpdateStatus
    || waitingForStoreReadyToPickup;

  const submitStatusUpdate = (status: RiderOrderUpdatableStatus) => {
    updateStatusMutation.mutate(
      { status },
      {
        onSuccess: async () => {
          if (status === 'delivered') {
            await stopRiderBackgroundLocation().catch((error) => {
              console.warn('[rider][location] unable to stop completed delivery tracking', error);
            });
            navigation.navigate('Home', {
              screen: 'HomeTab',
              params: { completedOrder: { orderCode: detailQuery.data?.orderCode ?? '' } },
            });
          }
        },
        onError: (error) => {
          if (error.status === 400 && error.message.toLowerCase().includes('invalid status transition')) {
            void detailQuery.refetch();
          }
        },
      },
    );
  };

  const requestLocationPermission = async () => {
    setIsRequestingLocationPermission(true);
    try {
      const permission = await requestRiderDeliveryLocationPermissions();
      setLocationPermissionIssue(permission.granted ? null : permission.level);
      setCanAskLocationAgain(permission.granted || permission.canAskAgain);
      if (permission.granted) setLocationPermissionRevision((revision) => revision + 1);
    } catch (error) {
      console.warn('[rider][location] delivery permission request unavailable', error);
      setLocationPermissionIssue('foreground');
      setCanAskLocationAgain(true);
    } finally {
      setIsRequestingLocationPermission(false);
    }
  };

  const handleLocationDisclosureContinue = async () => {
    const intent = locationDisclosureIntent;
    setLocationDisclosureIntent(null);
    if (!intent) return;
    await requestLocationPermission();
    if (intent === 'pickup' && nextUpdateStatus === 'picked_up') {
      submitStatusUpdate('picked_up');
    }
  };

  const handlePrimaryAction = async () => {
    if (nextUpdateStatus === 'heading_to_store') {
      if (canUpdateStatus) updateStatusMutation.mutate({ status: 'heading_to_store' });
      return;
    }
    if (waitingForStoreReadyToPickup || !canUpdateStatus) return;

    const serverRiderStatus = detailQuery.data?.riderStatus;

    if (nextUpdateStatus) {
      // Guard against stale UI: skip duplicate transition and re-sync order detail.
      if (serverRiderStatus === nextUpdateStatus || serverOrderStatus === nextUpdateStatus) {
        void detailQuery.refetch();
        return;
      }

      if (nextUpdateStatus === 'picked_up') {
        setIsRequestingLocationPermission(true);
        try {
          const permission = await getRiderDeliveryLocationPermissionStatus();
          if (!permission.granted) {
            setLocationDisclosureIntent('pickup');
            return;
          }
        } catch (error) {
          console.warn('[rider][location] unable to check delivery permission', error);
          setLocationDisclosureIntent('pickup');
          return;
        } finally {
          setIsRequestingLocationPermission(false);
        }
      }

      submitStatusUpdate(nextUpdateStatus);
      return;
    }

  };

  const recoverLocationPermission = async () => {
    if (!canAskLocationAgain) {
      try { await Linking.openSettings(); } catch (error) {
        console.warn('[rider][location] unable to open settings', error);
      }
      return;
    }
    setLocationDisclosureIntent('retry');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.white }]} edges={['top']}>
      <Map
        ref={mapRef}
        style={[styles.map, { top: headerHeight }]}
        initialRegion={mapRegion}
        markers={[
          ...(navigationDestination ? [{
            id: 'destination',
            coordinate: navigationDestination,
            render: (
              <View style={[styles.pinOuter, { backgroundColor: theme.colors.primary }]}> 
                <View style={[styles.pinInner, { backgroundColor: theme.colors.zinc800 }]} />
              </View>
            ),
          }] : []),
          ...(riderLocation ? [{
            id: 'rider',
            coordinate: riderLocation,
            zIndex: 2,
            render: (
              <View style={[styles.riderPin, { backgroundColor: theme.colors.zinc800, borderColor: theme.colors.white }]} />
            ),
          }] : []),
        ]}
      />

      <View
        onLayout={(event) => setHeaderHeight(event.nativeEvent.layout.height)}
        style={[styles.headerWrap, { backgroundColor: theme.colors.white, borderBottomColor: theme.colors.gray200 }]}
      >
        <OrderDetailTopBar title={detailQuery.data?.orderCode || `#${orderId.split('-')[0].toUpperCase()}`} onBack={() => navigation.goBack()} />
      </View>

      <View style={styles.progressCardWrap}>
        <View
          style={[
            styles.progressCard,
            { backgroundColor: theme.colors.surface, shadowColor: theme.colors.shadow },
          ]}
        >
          {detailQuery.isLoading ? (
            <View style={styles.loadingInline}>
              <ActivityIndicator color={theme.colors.primary} />
            </View>
          ) : detailQuery.isError ? (
            <Pressable accessibilityRole="button" onPress={() => void detailQuery.refetch()} style={styles.detailRetry}>
              <Text variant="label" color={theme.colors.gray700}>{detailQuery.error?.message ?? t('orders_empty')}</Text>
              <Text variant="caption" weight="bold" color={theme.colors.sky600}>{t('orders_retry')}</Text>
            </Pressable>
          ) : (
            <>
              <View style={styles.statusHeading}>
                <View style={styles.statusText}>
                  <View style={styles.currentRow}>
                    <View style={[styles.currentDot, { backgroundColor: currentProgressStatus === RiderDeliveryProgressStatus.FAILED ? theme.colors.red500 : theme.colors.sky600 }]} />
                    <Text variant="subtitle" weight="bold" color={theme.colors.gray900} numberOfLines={2}>{currentTitle}</Text>
                  </View>
                  {currentProgressStatus !== RiderDeliveryProgressStatus.DELIVERED && currentProgressStatus !== RiderDeliveryProgressStatus.FAILED ? (
                    <Text variant="caption" color={theme.colors.gray600} style={styles.nextStatus} numberOfLines={2}>
                      {t('order_next', { status: nextTitle })}
                    </Text>
                  ) : null}
                </View>
                {!isFailed ? (
                  <Text variant="caption" weight="semiBold" color={theme.colors.gray600} style={[styles.stepPill, { backgroundColor: theme.colors.gray100 }]}>
                    {t('order_step')} {step}/{STANDARD_PROGRESS_ORDER.length}
                  </Text>
                ) : null}
              </View>

              {!isFailed ? (
                <View style={styles.segmentsWrap}>
                  {STANDARD_PROGRESS_ORDER.map((statusItem, index) => (
                    <View
                      key={statusItem}
                      style={[
                        styles.segment,
                        { backgroundColor: index < step ? theme.colors.sky600 : theme.colors.gray200 },
                      ]}
                    />
                  ))}
                </View>
              ) : null}

              {showStorePreparingAlert || showReadyForPickupAlert ? (
                <View style={[styles.inlineNotice, { backgroundColor: showReadyForPickupAlert ? theme.colors.green50 : theme.colors.sky100 }]}>
                  {showReadyForPickupAlert
                    ? <CheckCircleIcon color={theme.colors.green600} />
                    : <InfoCircleIcon color={theme.colors.sky600} />}
                  <Text variant="caption" weight="semiBold" color={showReadyForPickupAlert ? theme.colors.green600 : theme.colors.sky600} style={styles.inlineNoticeText}>
                    {t(showReadyForPickupAlert ? 'order_alert_ready_pickup_title' : 'order_alert_store_preparing_desc')}
                  </Text>
                </View>
              ) : null}

              <Pressable
                onPress={() => setTimelineOpen((value) => !value)}
                accessibilityRole="button"
                accessibilityState={{ expanded: timelineOpen }}
                style={[styles.timelineButton, { borderTopColor: theme.colors.gray200 }]}
              >
                <Text variant="caption" weight="semiBold" color={theme.colors.gray700}>
                  {timelineOpen ? t('order_hide_timeline') : t('order_view_timeline')}
                </Text>
                <ChevronIcon up={timelineOpen} color={theme.colors.gray700} />
              </Pressable>

            </>
          )}
        </View>
      </View>

      {detailQuery.data ? <View style={styles.bottomControls}>
        {locationPermissionIssue && isLiveTrackingStatus ? (
          <View style={[styles.locationPermissionNotice, { backgroundColor: theme.colors.amber100 }]}>
            <Text variant="caption" color={theme.colors.amber800} style={styles.locationPermissionText}>
              {t(locationPermissionIssue === 'background' ? 'order_location_background_needed' : 'order_location_foreground_needed')}
            </Text>
            <Pressable onPress={() => void recoverLocationPermission()} disabled={isRequestingLocationPermission} accessibilityRole="button">
              <Text variant="caption" weight="bold" color={theme.colors.amber800}>
                {t(canAskLocationAgain ? 'order_location_retry' : 'order_location_settings')}
              </Text>
            </Pressable>
          </View>
        ) : null}
        <View style={[styles.ctaWrap, { backgroundColor: theme.colors.surface, paddingBottom: Math.max(insets.bottom, 12) + 12, shadowColor: theme.colors.shadow }]}>
          <View style={styles.destinationRow}>
            <View style={styles.destinationCopy}>
              <Text variant="caption" weight="semiBold" color={theme.colors.gray600}>
                {isLiveTrackingStatus ? t('chat_customer_name') : t('chat_store_name')}
              </Text>
              <Text variant="label" weight="bold" color={theme.colors.gray900} numberOfLines={1}>{destinationName}</Text>
              {destinationAddress ? <Text variant="caption" color={theme.colors.gray600}>{destinationAddress}</Text> : null}
            </View>
            <Pressable
              style={[styles.navigateChip, { backgroundColor: theme.colors.zinc800 }, !navigationDestination && styles.disabledAction]}
              onPress={() => void openNavigation()}
              disabled={!navigationDestination}
              accessibilityRole="button"
              accessibilityLabel={t('order_navigate')}
            >
              <NavigationIcon color={theme.colors.white} />
              <Text variant="caption" weight="semiBold" color={theme.colors.white}>{t('order_navigate')}</Text>
            </Pressable>
          </View>
          <ScrollView style={{ maxHeight: 180 }} nestedScrollEnabled>
            <AddressDetailsView isHistoricalFallback={detailQuery.data.deliveryAddressIsHistoricalFallback} details={detailQuery.data.deliveryAddressDetails} legacyText={detailQuery.data.deliveryAddressExtras} />
            {detailQuery.data.courierNote ? <View><Text weight="semiBold">{t('address_details_courierMessage')}</Text><Text>{detailQuery.data.courierNote}</Text></View> : null}
          </ScrollView>
          <View style={styles.conversationActions}>
            <OrderConversationButton
              kind="store_rider"
              unreadCount={chatUnreadCounts?.store_rider ?? 0}
              onPress={() => openChat('store_rider')}
            />
            <OrderConversationButton
              kind="customer_rider"
              unreadCount={chatUnreadCounts?.customer_rider ?? 0}
              onPress={() => openChat('customer_rider')}
            />
            <Pressable
              onPress={() => void openDialer()}
              disabled={!detailQuery.data?.customerPhone}
              accessibilityRole="button"
              accessibilityLabel={t('call_customer_action')}
              style={[styles.roundAction, { borderColor: theme.colors.gray200, backgroundColor: theme.colors.surface }, !detailQuery.data?.customerPhone && styles.disabledAction]}
            >
              <PhoneIcon width={20} height={20} />
            </Pressable>
          </View>
          {isPrimaryActionDisabled && !updateStatusMutation.isPending && !waitingForStoreReadyToPickup && nextUpdateStatus ? (
            <Text variant="label" color={theme.colors.gray600} style={{ textAlign: 'center', marginBottom: 8 }}>
              {t('order_status_wait_for_store')}
            </Text>
          ) : null}
          <Button
            label={updateStatusMutation.isPending ? t('order_status_updating') : primaryButtonLabel}
            onPress={handlePrimaryAction}
            disabled={isPrimaryActionDisabled}
            containerStyle={[
              styles.primaryButton,
              waitingForStoreReadyToPickup ? { backgroundColor: theme.colors.gray250 } : null,
            ]}
            textColor={waitingForStoreReadyToPickup ? theme.colors.white : theme.colors.gray900}
          />
          {updateStatusMutation.isError ? (
            <Text variant="caption" color={theme.colors.red500} style={styles.statusError}>
              {updateStatusMutation.error.message}
            </Text>
          ) : null}
        </View>
      </View> : null}

      <RiderLocationDisclosureModal
        visible={locationDisclosureIntent !== null}
        onContinue={() => void handleLocationDisclosureContinue()}
        onNotNow={() => setLocationDisclosureIntent(null)}
      />

      <Modal
        visible={timelineOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setTimelineOpen(false)}
      >
        <View style={styles.timelineOverlay}>
          <Pressable
            style={[StyleSheet.absoluteFillObject, { backgroundColor: theme.colors.modalBackdrop }]}
            onPress={() => setTimelineOpen(false)}
            accessibilityRole="button"
            accessibilityLabel={t('order_hide_timeline')}
          />
          <View style={[styles.timelineSheet, { backgroundColor: theme.colors.surface, paddingBottom: Math.max(insets.bottom, 16) + 16 }]}>
            <View style={styles.timelineSheetHeader}>
              <View style={styles.timelineSheetTitle}>
                <Text variant="subtitle" weight="bold" color={theme.colors.gray900}>{t('order_delivery_progress')}</Text>
                <Text variant="caption" color={theme.colors.gray600}>{detailQuery.data?.orderCode}</Text>
              </View>
              <Pressable onPress={() => setTimelineOpen(false)} accessibilityRole="button" accessibilityLabel={t('order_hide_timeline')} style={[styles.timelineClose, { backgroundColor: theme.colors.gray100 }]}>
                <ChevronIcon up color={theme.colors.gray700} />
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={styles.timelineWrap} showsVerticalScrollIndicator={false}>
              {progressTimeline.map((statusItem, index) => {
                const isCompleted = index < timelineCurrentIndex;
                const isCurrent = index === timelineCurrentIndex;
                const showConnector = index < progressTimeline.length - 1;
                return (
                  <View key={statusItem} style={styles.timelineRow}>
                    <View style={styles.railCol}>
                      <View style={[styles.railDot, {
                        borderColor: isCompleted || isCurrent ? theme.colors.sky600 : theme.colors.gray300,
                        backgroundColor: isCompleted ? theme.colors.sky600 : theme.colors.surface,
                      }]}>
                        {isCompleted ? <CheckIcon color={theme.colors.white} /> : null}
                        {isCurrent ? <View style={[styles.currentInner, { backgroundColor: theme.colors.sky600 }]} /> : null}
                      </View>
                      {showConnector ? <View style={[styles.railConnector, { backgroundColor: isCompleted ? theme.colors.sky600 : theme.colors.gray200 }]} /> : null}
                    </View>
                    <Text variant="label" weight={isCurrent ? 'bold' : 'medium'} color={isCurrent || isCompleted ? theme.colors.gray900 : theme.colors.gray500} style={styles.timelineText}>
                      {t(STATUS_TITLE_KEY[statusItem])}
                    </Text>
                    {isCurrent ? <View style={[styles.timelineCurrentTag, { backgroundColor: theme.colors.sky100 }]}><Text variant="caption" weight="semiBold" color={theme.colors.sky600}>{t('order_current_step')}</Text></View> : null}
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

function toCoordinate(latitude?: number | null, longitude?: number | null) {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return { latitude: Number(latitude), longitude: Number(longitude) };
}

function getRegionForCoordinates(
  coordinates: Array<{ latitude: number; longitude: number }>,
) {
  if (coordinates.length === 0) return null;
  if (coordinates.length === 1) {
    return {
      ...coordinates[0],
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
  }

  const latitudes = coordinates.map((coordinate) => coordinate.latitude);
  const longitudes = coordinates.map((coordinate) => coordinate.longitude);
  const minLatitude = Math.min(...latitudes);
  const maxLatitude = Math.max(...latitudes);
  const minLongitude = Math.min(...longitudes);
  const maxLongitude = Math.max(...longitudes);

  return {
    latitude: (minLatitude + maxLatitude) / 2,
    longitude: (minLongitude + maxLongitude) / 2,
    latitudeDelta: Math.max(maxLatitude - minLatitude, 0.006) * 1.4,
    longitudeDelta: Math.max(maxLongitude - minLongitude, 0.006) * 1.4,
  };
}

function ChevronIcon({ up, color }: { up: boolean; color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 16 16" fill="none" style={up ? styles.chevronUp : undefined}>
      <Path d="M4 6L8 10L12 6" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function NavigationIcon({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
      <Path d="M14.667 1.333L7.333 8.667" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <Path
        d="M14.667 1.333L10 14.667L7.333 8.667L1.333 6L14.667 1.333Z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CheckIcon({ color }: { color: string }) {
  return (
    <Svg width={10} height={10} viewBox="0 0 10 10" fill="none">
      <Path d="M2 5.2L4 7.2L8 3" stroke={color} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function InfoCircleIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22C17.523 22 22 17.523 22 12S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10Zm0-7v-4m0-3h.01"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CheckCircleIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3"
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
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  headerWrap: {
    borderBottomWidth: 1,
    zIndex: 5,
  },
  pinOuter: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.7,
  },
  pinInner: {
    width: 12,
    height: 12,
    borderRadius: 999,
  },
  riderPin: {
    borderRadius: 14,
    borderWidth: 3,
    height: 28,
    width: 28,
  },
  progressCardWrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 8,
  },
  inlineNotice: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },
  inlineNoticeText: { flex: 1 },
  progressCard: {
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 4,
    gap: 14,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 4,
  },
  loadingInline: {
    paddingVertical: 12,
  },
  detailRetry: { gap: 8, paddingVertical: 4 },
  statusHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  statusText: { flex: 1, minWidth: 0, gap: 5 },
  nextStatus: { marginLeft: 18 },
  stepPill: { overflow: 'hidden', borderRadius: 16, paddingHorizontal: 10, paddingVertical: 6 },
  currentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  currentDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  segmentsWrap: {
    flexDirection: 'row',
    gap: 6,
  },
  segment: {
    flex: 1,
    height: 4,
    borderRadius: 999,
  },
  timelineButton: {
    minHeight: 43,
    borderTopWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'space-between',
    flexDirection: 'row',
    gap: 8,
  },
  chevronUp: {
    transform: [{ rotate: '180deg' }],
  },
  timelineWrap: {
    paddingTop: 12,
    paddingBottom: 8,
  },
  timelineRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    minHeight: 52,
  },
  railCol: {
    width: 18,
    height: 52,
    alignItems: 'center',
    paddingTop: 10,
  },
  railDot: {
    width: 16,
    height: 16,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentInner: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  railConnector: {
    width: 2,
    height: 36,
  },
  timelineText: {
    flex: 1,
  },
  timelineOverlay: { flex: 1, justifyContent: 'flex-end' },
  timelineSheet: { maxHeight: '78%', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 22, paddingTop: 22 },
  timelineSheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  timelineSheetTitle: { flex: 1, gap: 3 },
  timelineClose: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  timelineCurrentTag: { borderRadius: 12, paddingHorizontal: 9, paddingVertical: 4 },
  bottomControls: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    gap: 8,
  },
  locationPermissionNotice: {
    marginHorizontal: 16,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  locationPermissionText: { flex: 1 },
  navigateChip: {
    minHeight: 42,
    borderRadius: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  disabledAction: { opacity: 0.45 },
  roundAction: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaWrap: {
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    gap: 14,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 12,
  },
  destinationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  destinationCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  conversationActions: {
    flexDirection: 'row',
    gap: 8,
  },
  primaryButton: {
    height: 54,
    borderRadius: 14,
  },
  statusError: { textAlign: 'center' },
});
