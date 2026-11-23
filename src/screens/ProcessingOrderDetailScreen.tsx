import { isEndedRiderOrder } from '../hooks/riderStatusReconciliation';
import { useRiderDeliveryCompletion } from '../hooks/useRiderDeliveryCompletion';
import EndedOrderActions from './orderDetail/components/EndedOrderActions';
import BottomSheetHandle from './orderDetail/components/BottomSheetHandle';
import { useOrderRouteQuery } from '../hooks/useOrderRouteQuery';
import { useInAppNavigation } from '../hooks/useInAppNavigation';
import MapActionButton from './orderDetail/components/MapActionButton';
import NavigationInfoCard from './orderDetail/components/NavigationInfoCard';
import { formatDistanceMeters, getRemainingDistanceMeters, getRouteProgress } from '../location/routeProgress';
import { useDeliveryProblem } from '../hooks/useDeliveryProblem';
import { openOrderNavigation } from '../location/openOrderNavigation';
import AddressDetailsView from '../components/AddressDetailsView';
import DropOffPreferenceNotice from '../components/DropOffPreferenceNotice';
import ExpandableText from '../components/ExpandableText';
import DeliveryProblemAction from '../components/DeliveryProblemAction';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, AppState, LayoutAnimation, Linking, Modal, Pressable, ScrollView, StyleSheet, useWindowDimensions, View, type AppStateStatus, type LayoutChangeEvent } from 'react-native';
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
import { useCancelAssignmentMutation, useUpdateRiderOrderStatusMutation } from '../hooks/useRiderHomeMutations';
import { formatCountdown, useAssignmentCancelCountdown } from '../hooks/useAssignmentCancelCountdown';
import { useDeliveryUnlock } from '../hooks/useDeliveryUnlock';
import DeliveryLockNotice from './orderDetail/components/DeliveryLockNotice';
import CancelAssignmentButton from './orderDetail/components/CancelAssignmentButton';
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
import { useBatteryOptimizationWarning } from '../hooks/useBatteryOptimizationWarning';
import { getRiderDeliveryLocationPermissionStatus, requestRiderDeliveryLocationPermissions, stopRiderBackgroundLocation } from '../location/riderBackgroundLocationTask';
import { useRiderOrderChatUnreadQuery } from '../hooks/useSupportChat';

type Props = NativeStackScreenProps<MainStackParamList, 'ProcessingOrderDetail'>;

const FALLBACK_REGION = {
  latitude: 33.6844,
  longitude: 73.0479,
  latitudeDelta: 0.03,
  longitudeDelta: 0.03,
};
const MAP_FIT_EDGE_PADDING = 48;
const MAP_TOP_OVERLAY_GAP = 8;
// Caps the sheet's address details so the sheet can never swallow the map.
const DETAILS_MAX_HEIGHT_RATIO = 0.22;
const DETAILS_MIN_HEIGHT = 96;

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
  [RiderDeliveryProgressStatus.ASSIGNED]: 'order_status_arrived_at_store',
  [RiderDeliveryProgressStatus.HEADING_TO_STORE]: 'order_status_arrived_at_store',
  [RiderDeliveryProgressStatus.ARRIVED_AT_STORE]: 'order_status_picked_up',
  [RiderDeliveryProgressStatus.WAITING_FOR_ORDER]: 'order_status_picked_up',
  [RiderDeliveryProgressStatus.PICKED_UP]: 'order_status_arrived_at_customer',
  [RiderDeliveryProgressStatus.OUT_FOR_DELIVERY]: 'order_status_arrived_at_customer',
  [RiderDeliveryProgressStatus.ARRIVED_AT_CUSTOMER]: 'order_status_delivered',
  [RiderDeliveryProgressStatus.DELIVERED]: 'order_status_delivered',
  [RiderDeliveryProgressStatus.FAILED]: 'order_status_failed',
};

const STANDARD_PROGRESS_ORDER = DELIVERY_PROGRESS_ORDER.filter(
  (status) => status !== RiderDeliveryProgressStatus.FAILED,
);

const NEXT_UPDATE_STATUS: Partial<Record<RiderDeliveryProgressStatus, RiderOrderUpdatableStatus>> = {
  // Assignment auto-starts the trip to the store, so the first rider action is "Arrived at store".
  [RiderDeliveryProgressStatus.ASSIGNED]: 'arrived_at_store',
  [RiderDeliveryProgressStatus.HEADING_TO_STORE]: 'arrived_at_store',
  // At the store the only action is "Picked up", and it unlocks once the store marks the order ready.
  [RiderDeliveryProgressStatus.ARRIVED_AT_STORE]: 'picked_up',
  [RiderDeliveryProgressStatus.PICKED_UP]: 'arrived',
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

const STORE_MARKER = require('../assets/map-markers/store.png');
const CUSTOMER_MARKER = require('../assets/map-markers/customer.png');
const RIDER_MARKER = require('../assets/map-markers/rider.png');

export default function ProcessingOrderDetailScreen({ route, navigation }: Props) {
  const { theme } = useAppTheme();
  const { t } = useTranslations('app');
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const { orderId } = route.params;
  const existingDeliveryProblem = useDeliveryProblem(orderId, false).query.data?.report;
  const detailQuery = useRiderOrderDetailQuery(orderId, isFocused);
  const chatUnreadQuery = useRiderOrderChatUnreadQuery();
  const chatUnreadCounts = chatUnreadQuery.data?.byOrderAndKind?.[orderId];
  const updateStatusMutation = useUpdateRiderOrderStatusMutation(orderId);
  const cancelAssignmentMutation = useCancelAssignmentMutation(orderId);
  const cancelSeconds = useAssignmentCancelCountdown(detailQuery.data?.assignmentCancelRemainingMs, detailQuery.dataUpdatedAt);
  const isEndedOrder = isEndedRiderOrder(detailQuery.data?.status);
  useRiderDeliveryCompletion({ orderId, orderCode: detailQuery.data?.orderCode ?? '', status: detailQuery.data?.status,
    requestedStatus: updateStatusMutation.variables?.status, focused: isFocused, navigation });
  const [isRequestingLocationPermission, setIsRequestingLocationPermission] = useState(false);
  const [locationPermissionIssue, setLocationPermissionIssue] = useState<'foreground' | 'background' | null>(null);
  const [canAskLocationAgain, setCanAskLocationAgain] = useState(true);
  const [locationPermissionRevision, setLocationPermissionRevision] = useState(0);
  const [locationDisclosureIntent, setLocationDisclosureIntent] = useState<'pickup' | 'retry' | null>(null);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(56);
  const [topOverlayHeight, setTopOverlayHeight] = useState(0);
  const [bottomOverlayHeight, setBottomOverlayHeight] = useState(0);
  // Collapsed by default so the map keeps most of the screen; details are one tap or swipe away.
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const { height: windowHeight } = useWindowDimensions();
  const detailsMaxHeight = Math.max(DETAILS_MIN_HEIGHT, Math.round(windowHeight * DETAILS_MAX_HEIGHT_RATIO));
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const mapRef = useRef<MapView>(null);
  const isFocusedRef = useRef(isFocused);
  const isLiveTrackingStatus = ['picked_up', 'out_for_delivery', 'arrived'].includes(
    detailQuery.data?.status ?? '',
  );

  useEffect(() => {
    isFocusedRef.current = isFocused;
  }, [isFocused]);

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
    });

    return () => {
      subscription.remove();
    };
  }, [isLiveTrackingStatus, orderId]);

  useEffect(() => {
    if (!isLiveTrackingStatus) return;
    void getRiderDeliveryLocationPermissionStatus().then((permission) => {
      setLocationPermissionIssue(permission.granted ? null : permission.level);
      setCanAskLocationAgain(permission.granted || permission.canAskAgain);
    }).catch(() => setLocationPermissionIssue('foreground'));
  }, [isLiveTrackingStatus]);
  // Shown from assignment, not only after pickup, so the rider can fix it before tracking starts.
  const batteryWarning = useBatteryOptimizationWarning(Boolean(detailQuery.data) && !isEndedOrder);
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
  const isCustomerDestination = isLiveTrackingStatus || detailQuery.data?.status === 'delivered';
  const navigationDestination = isCustomerDestination
    ? deliveryCoordinate
    : pickupCoordinate;
  // The server owns the route: store -> customer before pickup, rider -> customer afterwards.
  const routePathQuery = useOrderRouteQuery(orderId, Boolean(detailQuery.data) && !isEndedOrder);
  const routePath = routePathQuery.data ?? undefined;
  // While delivering, drop the part of the route the rider has already driven and draw the
  // rider on the road, so the line starts exactly at the marker.
  const routeProgress = useMemo(
    () => (routePath && riderLocation && isLiveTrackingStatus
      ? getRouteProgress(routePath, riderLocation)
      : null),
    [isLiveTrackingStatus, riderLocation, routePath],
  );
  const displayedRoute = routeProgress?.remaining ?? routePath;
  const riderMarkerCoordinate = routeProgress?.marker ?? riderLocation;
  const routePolylines = useMemo(
    () => (displayedRoute && displayedRoute.length >= 2
      ? [{ id: 'route', coordinates: displayedRoute, strokeWidth: 5, strokeColor: theme.colors.brandInk }]
      : []),
    [displayedRoute, theme.colors.brandInk],
  );
  const inAppNav = useInAppNavigation({
    mapRef,
    position: riderLocation,
    available: isLiveTrackingStatus && !isEndedOrder && Boolean(riderLocation),
  });
  const remainingMeters = useMemo(
    () => (riderLocation && deliveryCoordinate && isLiveTrackingStatus
      ? getRemainingDistanceMeters(routePath, riderLocation, deliveryCoordinate)
      : null),
    [deliveryCoordinate, isLiveTrackingStatus, riderLocation, routePath],
  );
  const deliveryUnlock = useDeliveryUnlock(
    detailQuery.data?.deliveryUnlock,
    detailQuery.dataUpdatedAt,
    riderLocation,
    deliveryCoordinate,
  );
  const etaMinutes = detailQuery.data?.eta?.phase === 'post_pickup' ? detailQuery.data.eta.estimatedMinutes : null;
  const visibleMapCoordinates = useMemo(
    () => [
      riderLocation,
      isCustomerDestination ? null : pickupCoordinate,
      deliveryCoordinate,
    ].filter((coordinate): coordinate is { latitude: number; longitude: number } => Boolean(coordinate)),
    [deliveryCoordinate, isCustomerDestination, pickupCoordinate, riderLocation],
  );
  const mapRegion = useMemo(
    () => getRegionForCoordinates(visibleMapCoordinates) ?? FALLBACK_REGION,
    [visibleMapCoordinates],
  );

  useEffect(() => {
    // While navigating, the camera belongs to the follow logic (or to the rider's own panning).
    if (inAppNav.isNavigating || visibleMapCoordinates.length === 0) return;

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

    // The map is already inset by `mapPadding` (the overlays), so only a small margin is needed here.
    mapRef.current?.fitToCoordinates(visibleMapCoordinates, {
      animated: true,
      edgePadding: {
        top: MAP_FIT_EDGE_PADDING,
        right: MAP_FIT_EDGE_PADDING,
        bottom: MAP_FIT_EDGE_PADDING,
        left: MAP_FIT_EDGE_PADDING,
      },
    });
  }, [orderId, isLiveTrackingStatus, Boolean(pickupCoordinate), Boolean(deliveryCoordinate), Boolean(riderLocation), topOverlayHeight, bottomOverlayHeight, inAppNav.isNavigating]);

  const currentProgressStatus = useMemo(
    () => resolveProgressStatusFromOrder(detailQuery.data?.status, detailQuery.data?.riderStatus),
    [detailQuery.data?.riderStatus, detailQuery.data?.status],
  );

  const openNavigation = async () => {
    if (!navigationDestination) return;

    try { await openOrderNavigation(navigationDestination, riderLocation); }
    catch { Alert.alert(t('order_navigate'), t('order_navigation_error')); }
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
  const isPrePickupOrder = ['accepted', 'preparing', 'ready', 'rider_assigned'].includes(serverOrderStatus ?? '');
  const shouldAllowReadyFallback =
    serverOrderStatus === 'ready'
    && currentProgressStatus === RiderDeliveryProgressStatus.HEADING_TO_STORE;
  const nextUpdateStatus = isEndedOrder ? null : serverAllowedNextUpdateStatus ?? fallbackNextUpdateStatus;
  const canUpdateRiderTravelStatus = nextUpdateStatus === 'arrived_at_store' && isPrePickupOrder;
  const nextTitle = t(getNextStatusTitleKey(currentProgressStatus, nextUpdateStatus));
  const currentIndex = STANDARD_PROGRESS_ORDER.indexOf(currentProgressStatus);
  const step = currentIndex >= 0 ? currentIndex + 1 : STANDARD_PROGRESS_ORDER.length;
  const isFailed = currentProgressStatus === RiderDeliveryProgressStatus.FAILED;
  const progressTimeline = currentProgressStatus === RiderDeliveryProgressStatus.FAILED
    ? [RiderDeliveryProgressStatus.FAILED]
    : STANDARD_PROGRESS_ORDER;
  const timelineCurrentIndex = progressTimeline.indexOf(currentProgressStatus);
  const destinationName = isCustomerDestination
    ? detailQuery.data?.customerName?.trim() || t('chat_customer_name')
    : detailQuery.data?.storeName?.trim() || t('chat_store_name');
  const destinationAddress = isCustomerDestination
    ? detailQuery.data?.deliveryAddress
    : detailQuery.data?.pickupAddress;
  const canUpdateStatus =
    !isEndedOrder && (detailQuery.data?.canUpdateStatus === true || shouldAllowReadyFallback || canUpdateRiderTravelStatus);
  const isAtStore = currentProgressStatus === RiderDeliveryProgressStatus.ARRIVED_AT_STORE && isPrePickupOrder;
  const isStoreReadyForPickup = serverOrderStatus === 'ready';
  // At the store but the order is still accepted/preparing: no action, just wait for the store.
  const waitingForStoreReadyToPickup = isAtStore && !isStoreReadyForPickup;
  const showStorePreparingAlert = waitingForStoreReadyToPickup;
  const showReadyForPickupAlert = isAtStore && isStoreReadyForPickup;
  const primaryButtonLabel = waitingForStoreReadyToPickup
    ? t(serverOrderStatus === 'preparing' ? 'order_waiting_store_preparing' : 'order_waiting_order_completion')
    : nextUpdateStatus
      ? t(STATUS_BUTTON_LABEL_KEY[nextUpdateStatus])
      : t('order_start_navigation');
  // "Arrived" and "Delivered" need the rider at the drop-off, or the store-to-customer travel time to pass.
  const isDeliveryLocked = (nextUpdateStatus === 'arrived' || nextUpdateStatus === 'delivered')
    && !deliveryUnlock.isUnlocked;
  const isPrimaryActionDisabled =
    updateStatusMutation.isPending
    || isDeliveryLocked
    || isRequestingLocationPermission
    || locationDisclosureIntent !== null
    || !canUpdateStatus
    || !nextUpdateStatus
    || waitingForStoreReadyToPickup;

  const submitStatusUpdate = (status: RiderOrderUpdatableStatus) => {
    if (isEndedOrder || updateStatusMutation.isPending) return;
    updateStatusMutation.mutate((status === 'arrived' || status === 'delivered') && riderLocation
      ? { status, latitude: riderLocation.latitude, longitude: riderLocation.longitude }
      : { status });
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
    if (isEndedOrder || updateStatusMutation.isPending) return;
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

  const confirmCancelAssignment = () => {
    Alert.alert(t('order_cancel_assignment_title'), t('order_cancel_assignment_message'), [
      { text: t('order_cancel_assignment_keep'), style: 'cancel' },
      {
        text: t('order_cancel_assignment_confirm'),
        style: 'destructive',
        onPress: () => cancelAssignmentMutation.mutate(undefined, {
          onSuccess: () => navigation.replace('Home', { screen: 'HomeTab' }),
          onError: (error) => Alert.alert(t('order_cancel_assignment_failed'), error.message),
        }),
      },
    ]);
  };

  const toggleDetails = (nextExpanded: boolean) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setDetailsExpanded(nextExpanded);
  };

  const startInAppNavigation = () => {
    toggleDetails(false);
    inAppNav.start();
  };

  const handleBottomOverlayLayout = (event: LayoutChangeEvent) => {
    setBottomOverlayHeight(Math.round(event.nativeEvent.layout.height));
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
        polylines={routePolylines}
        onPanDrag={inAppNav.onMapDrag}
        mapPadding={{
          top: topOverlayHeight + MAP_TOP_OVERLAY_GAP,
          right: 0,
          bottom: bottomOverlayHeight,
          left: 0,
        }}
        markers={[
          // Bitmap markers (not views): Android snapshots view markers at their measured size, which clipped them.
          // The stop that is not the current target is dimmed.
          ...(pickupCoordinate ? [{ id: 'store', coordinate: pickupCoordinate, title: t('chat_store_name'), anchor: { x: 0.5, y: 0.5 }, image: STORE_MARKER, opacity: isCustomerDestination ? 0.6 : 1, zIndex: 1 }] : []),
          ...(deliveryCoordinate ? [{ id: 'customer', coordinate: deliveryCoordinate, title: t('chat_customer_name'), anchor: { x: 0.5, y: 0.5 }, image: CUSTOMER_MARKER, opacity: isCustomerDestination ? 1 : 0.6, zIndex: 2 }] : []),
          ...(riderMarkerCoordinate ? [{ id: 'rider', coordinate: riderMarkerCoordinate, title: t('delivery_map_rider'), anchor: { x: 0.5, y: 0.5 }, image: RIDER_MARKER, zIndex: 3 }] : []),
        ]}
      />

      <View
        onLayout={(event) => setHeaderHeight(event.nativeEvent.layout.height)}
        style={[styles.headerWrap, { backgroundColor: theme.colors.white, borderBottomColor: theme.colors.gray200 }]}
      >
        <OrderDetailTopBar title={detailQuery.data?.orderCode || `#${orderId.split('-')[0].toUpperCase()}`} onBack={() => navigation.goBack()} />
      </View>

      <View
        onLayout={(event) => setTopOverlayHeight(Math.round(event.nativeEvent.layout.height))}
        style={styles.progressCardWrap}
      >
        {inAppNav.isNavigating && remainingMeters !== null ? (
          <NavigationInfoCard
            title={t('order_nav_title')}
            distanceLabel={t('order_nav_remaining', { distance: formatDistanceMeters(remainingMeters) })}
            etaLabel={etaMinutes ? t('order_nav_eta', { minutes: etaMinutes }) : null}
            exitLabel={t('order_nav_exit')}
            onExit={inAppNav.exit}
          />
        ) : (
        <View
          style={[
            styles.progressCard,
            { backgroundColor: theme.colors.surface, shadowColor: theme.colors.shadow },
          ]}
        >
          {detailQuery.isLoading ? (
            <View style={styles.loadingInline}>
              <ActivityIndicator color={theme.colors.brandInk} />
            </View>
          ) : detailQuery.isError ? (
            <Pressable accessibilityRole="button" onPress={() => void detailQuery.refetch()} style={styles.detailRetry}>
              <Text variant="label" color={theme.colors.gray700}>{detailQuery.error?.message ?? t('orders_empty')}</Text>
              <Text variant="caption" weight="bold" color={theme.colors.brandInk}>{t('orders_retry')}</Text>
            </Pressable>
          ) : (
            <>
              <View style={styles.statusHeading}>
                <View style={styles.statusText}>
                  <View style={styles.currentRow}>
                    <View style={[styles.currentDot, { backgroundColor: currentProgressStatus === RiderDeliveryProgressStatus.FAILED ? theme.colors.red500 : theme.colors.brandInk }]} />
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
                        { backgroundColor: index < step ? theme.colors.primary : theme.colors.gray200 },
                      ]}
                    />
                  ))}
                </View>
              ) : null}

              {showStorePreparingAlert || showReadyForPickupAlert ? (
                <View style={[styles.inlineNotice, { backgroundColor: showReadyForPickupAlert ? theme.colors.green50 : theme.colors.primarySoft }]}>
                  {showReadyForPickupAlert
                    ? <CheckCircleIcon color={theme.colors.green600} />
                    : <InfoCircleIcon color={theme.colors.brandInk} />}
                  <Text variant="caption" weight="semiBold" color={showReadyForPickupAlert ? theme.colors.green600 : theme.colors.brandInk} style={styles.inlineNoticeText}>
                    {showReadyForPickupAlert
                      ? t('order_alert_ready_pickup_title')
                      : `${t(serverOrderStatus === 'preparing' ? 'order_waiting_store_preparing' : 'order_waiting_order_completion')}. ${t('order_alert_store_preparing_desc')}`}
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
        )}
      </View>

      {isLiveTrackingStatus && !isEndedOrder && riderLocation && detailQuery.data ? (
        <View pointerEvents="box-none" style={[styles.mapActions, { bottom: bottomOverlayHeight + 12 }]}>
          {!inAppNav.isNavigating ? (
            <MapActionButton
              label={t('order_nav_start')}
              icon={<NavigationIcon color={theme.colors.white} size={14} />}
              onPress={startInAppNavigation}
            />
          ) : !inAppNav.isFollowing ? (
            <MapActionButton
              label={t('order_nav_recenter')}
              icon={<NavigationIcon color={theme.colors.white} size={14} />}
              onPress={inAppNav.recenter}
            />
          ) : null}
        </View>
      ) : null}

      {detailQuery.data && isEndedOrder ? <View onLayout={handleBottomOverlayLayout} style={styles.bottomControls}>
        <EndedOrderActions bottomInset={insets.bottom}
          message={detailQuery.data.status === 'delivered' ? t('order_status_desc_delivered') : detailQuery.data.statusLabel || currentTitle}
          onBack={() => navigation.replace('Home', { screen: 'HomeTab' })} />
      </View> : detailQuery.data ? <View onLayout={handleBottomOverlayLayout} style={styles.bottomControls}>
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
        ) : batteryWarning.visible ? (
          <View style={[styles.locationPermissionNotice, { backgroundColor: theme.colors.amber100 }]}>
            <Text variant="caption" color={theme.colors.amber800} style={styles.locationPermissionText}>
              {t('order_battery_optimization_needed')}
            </Text>
            <Pressable onPress={batteryWarning.openSettings} accessibilityRole="button">
              <Text variant="caption" weight="bold" color={theme.colors.amber800}>
                {t('order_location_settings')}
              </Text>
            </Pressable>
            <Pressable onPress={batteryWarning.dismiss} accessibilityRole="button" accessibilityLabel={t('order_battery_optimization_dismiss')} hitSlop={8}>
              <Text variant="caption" weight="bold" color={theme.colors.amber800}>✕</Text>
            </Pressable>
          </View>
        ) : null}
        <View style={[styles.ctaWrap, { backgroundColor: theme.colors.surface, paddingBottom: Math.max(insets.bottom, 12) + 12, shadowColor: theme.colors.shadow }]}>
          <BottomSheetHandle
            expanded={detailsExpanded}
            onToggle={toggleDetails}
            expandLabel={t('order_sheet_expand')}
            collapseLabel={t('order_sheet_collapse')}
          />
          <View style={styles.destinationRow}>
            <View style={styles.destinationCopy}>
              <Text variant="caption" weight="semiBold" color={theme.colors.gray600}>
                {isLiveTrackingStatus ? t('chat_customer_name') : t('chat_store_name')}
              </Text>
              <Text variant="label" weight="bold" color={theme.colors.gray900} numberOfLines={1}>{destinationName}</Text>
              {destinationAddress ? <ExpandableText text={destinationAddress} variant="caption" textColor={theme.colors.gray600} linkColor={theme.colors.brandInk} moreLabel={t('address_details_showMore')} lessLabel={t('address_details_showLess')} /> : null}
            </View>
            <Pressable
              style={[styles.navigateChip, { backgroundColor: theme.colors.zinc800 }, !navigationDestination && styles.disabledAction]}
              onPress={() => void openNavigation()}
              disabled={!navigationDestination}
              accessibilityRole="button"
              accessibilityLabel={t('order_navigate')}
            >
              <NavigationIcon color={theme.colors.white} size={14} />
              <Text variant="caption" weight="semiBold" color={theme.colors.white}>{t('order_navigate')}</Text>
            </Pressable>
          </View>
          {detailQuery.data.orderType !== 'pickup' ? <DropOffPreferenceNotice leaveAtDoor={detailQuery.data.leaveAtDoor} /> : null}
          {detailsExpanded ? (
            <>
              <ScrollView style={{ maxHeight: detailsMaxHeight }} nestedScrollEnabled showsVerticalScrollIndicator>
                {!isLiveTrackingStatus ? (
                  <View>
                    <Text variant="label" weight="semiBold">{t('home_customer_contact')}</Text>
                    {detailQuery.data.deliveryAddress ? <ExpandableText text={detailQuery.data.deliveryAddress} variant="caption" textColor={theme.colors.gray600} linkColor={theme.colors.brandInk} moreLabel={t('address_details_showMore')} lessLabel={t('address_details_showLess')} /> : null}
                  </View>
                ) : null}
                <AddressDetailsView isHistoricalFallback={detailQuery.data.deliveryAddressIsHistoricalFallback} details={detailQuery.data.deliveryAddressDetails} legacyText={detailQuery.data.deliveryAddressExtras} courierMessage={detailQuery.data.courierNote} />
              </ScrollView>
              {!['delivered', 'cancelled', 'rejected', 'failed'].includes(detailQuery.data.status) && <DeliveryProblemAction
                label={t(existingDeliveryProblem ? 'delivery_problem_view' : 'delivery_problem_action')}
                statusLabel={existingDeliveryProblem ? t(existingDeliveryProblem.status === 'in_progress' ? 'delivery_problem_in_progress' : 'delivery_problem_open') : undefined}
                onPress={() => navigation.navigate('DeliveryProblem', { orderId })} />}
            </>
          ) : null}
          <View style={styles.conversationActions}>
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
          {cancelSeconds > 0 ? (
            <CancelAssignmentButton
              label={cancelAssignmentMutation.isPending
                ? t('order_cancel_assignment_cancelling')
                : t('order_cancel_assignment_countdown', { time: formatCountdown(cancelSeconds) })}
              onPress={confirmCancelAssignment}
              disabled={cancelAssignmentMutation.isPending || updateStatusMutation.isPending}
            />
          ) : null}
          {isDeliveryLocked && !updateStatusMutation.isPending ? (
            <DeliveryLockNotice
              status={nextUpdateStatus === 'arrived' ? 'arrived' : 'delivered'}
              radiusMeters={deliveryUnlock.radiusMeters}
              distanceMeters={deliveryUnlock.distanceMeters}
              secondsUntilUnlock={deliveryUnlock.secondsUntilUnlock}
            />
          ) : isPrimaryActionDisabled && !updateStatusMutation.isPending && !waitingForStoreReadyToPickup && nextUpdateStatus ? (
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
              {updateStatusMutation.error.status === 0 || updateStatusMutation.error.status === 408 ? t('order_status_confirmation_failed') : updateStatusMutation.error.message}
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
                        borderColor: isCompleted || isCurrent ? theme.colors.brandInk : theme.colors.gray300,
                        backgroundColor: isCompleted ? theme.colors.primary : theme.colors.surface,
                      }]}>
                        {isCompleted ? <CheckIcon color={theme.colors.onPrimary} /> : null}
                        {isCurrent ? <View style={[styles.currentInner, { backgroundColor: theme.colors.brandInk }]} /> : null}
                      </View>
                      {showConnector ? <View style={[styles.railConnector, { backgroundColor: isCompleted ? theme.colors.primary : theme.colors.gray200 }]} /> : null}
                    </View>
                    <Text variant="label" weight={isCurrent ? 'bold' : 'medium'} color={isCurrent || isCompleted ? theme.colors.gray900 : theme.colors.gray500} style={styles.timelineText}>
                      {t(STATUS_TITLE_KEY[statusItem])}
                    </Text>
                    {isCurrent ? <View style={[styles.timelineCurrentTag, { backgroundColor: theme.colors.primarySoft }]}><Text variant="caption" weight="semiBold" color={theme.colors.brandInk}>{t('order_current_step')}</Text></View> : null}
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
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(Number(latitude)) > 90 || Math.abs(Number(longitude)) > 180) return null;
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

function NavigationIcon({ color, size = 16 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
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
  mapActions: {
    position: 'absolute',
    right: 16,
    alignItems: 'flex-end',
  },
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
    minHeight: 34,
    borderRadius: 10,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
