import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Linking, Pressable, ScrollView, StyleSheet, View, type AppStateStatus } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useIsFocused } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import Map from '../components/Map';
import Text from '../components/Text';
import Button from '../components/Button';
import ChatBubbleOvalIcon from '../assets/svgs/chat-bubble-oval.svg';
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

const STEP_VALUE: Record<RiderDeliveryProgressStatus, number> = {
  [RiderDeliveryProgressStatus.ASSIGNED]: 2,
  [RiderDeliveryProgressStatus.HEADING_TO_STORE]: 3,
  [RiderDeliveryProgressStatus.ARRIVED_AT_STORE]: 4,
  [RiderDeliveryProgressStatus.WAITING_FOR_ORDER]: 5,
  [RiderDeliveryProgressStatus.PICKED_UP]: 6,
  [RiderDeliveryProgressStatus.OUT_FOR_DELIVERY]: 7,
  [RiderDeliveryProgressStatus.ARRIVED_AT_CUSTOMER]: 8,
  [RiderDeliveryProgressStatus.DELIVERED]: 8,
  [RiderDeliveryProgressStatus.FAILED]: 8,
};

const NEXT_UPDATE_STATUS: Partial<Record<RiderDeliveryProgressStatus, RiderOrderUpdatableStatus>> = {
  [RiderDeliveryProgressStatus.ASSIGNED]: 'heading_to_store',
  [RiderDeliveryProgressStatus.HEADING_TO_STORE]: 'arrived_at_store',
  [RiderDeliveryProgressStatus.ARRIVED_AT_STORE]: 'waiting_for_order',
  [RiderDeliveryProgressStatus.PICKED_UP]: 'out_for_delivery',
  [RiderDeliveryProgressStatus.OUT_FOR_DELIVERY]: 'arrived',
  [RiderDeliveryProgressStatus.ARRIVED_AT_CUSTOMER]: 'delivered',
};

const STATUS_BUTTON_LABEL_KEY: Record<RiderOrderUpdatableStatus, string> = {
  heading_to_store: 'order_start_navigation',
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
  const updateStatusMutation = useUpdateRiderOrderStatusMutation(orderId);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(56);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const lastResumeRefetchAtRef = useRef(0);
  const mapRef = useRef<MapView>(null);
  const isFocusedRef = useRef(isFocused);
  const isFetchingRef = useRef(detailQuery.isFetching);

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

      const now = Date.now();
      const elapsedSinceLastRefetch = now - lastResumeRefetchAtRef.current;
      if (elapsedSinceLastRefetch < DETAIL_RESUME_REFETCH_COOLDOWN_MS || isFetchingRef.current) return;

      lastResumeRefetchAtRef.current = now;
      void detailQuery.refetch();
    });

    return () => {
      subscription.remove();
    };
  }, [detailQuery.refetch, orderId]);

  const isLiveTrackingStatus = ['picked_up', 'out_for_delivery', 'arrived'].includes(
    detailQuery.data?.status ?? '',
  );
  const riderLocation = useRiderLiveLocationTracking({
    customerUserId: detailQuery.data?.customerUserId,
    enabled: isLiveTrackingStatus,
    orderId,
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
      edgePadding: { top: 64, right: 48, bottom: 280, left: 48 },
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

  const openChat = () => {
    navigation.navigate('OrderChat', {
      orderId,
      name: detailQuery.data?.storeName?.trim() || t('order_chat_default_name'),
      phone: detailQuery.data?.customerPhone ?? null,
      chatBoxId: detailQuery.data?.chatBoxId ?? null,
      receiverId: detailQuery.data?.storeUserId ?? null,
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
  const nextTitle = t(getNextStatusTitleKey(currentProgressStatus, nextUpdateStatus));
  const step = STEP_VALUE[currentProgressStatus];
  const currentIndex = DELIVERY_PROGRESS_ORDER.indexOf(currentProgressStatus);
  const canUpdateStatus =
    detailQuery.data?.canUpdateStatus === true || shouldAllowReadyFallback;
  const isDelivered = currentProgressStatus === RiderDeliveryProgressStatus.DELIVERED;
  const showStorePreparingAlert =
    currentProgressStatus === RiderDeliveryProgressStatus.ARRIVED_AT_STORE && !canUpdateStatus;
  const waitingForStoreReadyToPickup =
    currentProgressStatus === RiderDeliveryProgressStatus.WAITING_FOR_ORDER
    && serverOrderStatus !== 'picked_up';
  const showReadyForPickupAlert = waitingForStoreReadyToPickup;
  const primaryButtonLabel = waitingForStoreReadyToPickup
    ? t('order_waiting_for_order_disabled')
    : nextUpdateStatus
      ? t(STATUS_BUTTON_LABEL_KEY[nextUpdateStatus])
      : t('order_start_navigation');
  const isPrimaryActionDisabled =
    updateStatusMutation.isPending
    || !canUpdateStatus
    || !nextUpdateStatus
    || waitingForStoreReadyToPickup;

  const handlePrimaryAction = () => {
    if (waitingForStoreReadyToPickup || !canUpdateStatus) return;

    const serverRiderStatus = detailQuery.data?.riderStatus;

    if (nextUpdateStatus) {
      // Guard against stale UI: skip duplicate transition and re-sync order detail.
      if (serverRiderStatus === nextUpdateStatus || serverOrderStatus === nextUpdateStatus) {
        void detailQuery.refetch();
        return;
      }

      updateStatusMutation.mutate(
        { status: nextUpdateStatus },
        {
          onError: (error) => {
            // If backend says transition is invalid (already moved), refresh state and continue.
            if (error.status === 400 && error.message.toLowerCase().includes('invalid status transition')) {
              void detailQuery.refetch();
            }
          },
        },
      );
      return;
    }

    void openNavigation();
  };

  const closeDeliveredModal = () => {
    navigation.goBack();
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
        <OrderDetailTopBar title={currentTitle ?? t('order_assigned_title')} onBack={() => navigation.goBack()} />
      </View>

      <View style={styles.progressCardWrap}>
        {showStorePreparingAlert ? (
          <View
            style={[
              styles.alertCard,
              { backgroundColor: theme.colors.sky100, borderColor: theme.colors.sky600 },
            ]}
          >
            <View style={styles.alertTitleRow}>
              <InfoCircleIcon color={theme.colors.sky600} />
              <Text variant="subtitle" weight="medium" color={theme.colors.sky600}>
                {t('order_alert_store_preparing_title')}
              </Text>
            </View>
            <Text variant="label" color={theme.colors.gray600}>
              {t('order_alert_store_preparing_desc')}
            </Text>
          </View>
        ) : null}

        {showReadyForPickupAlert ? (
          <View
            style={[
              styles.alertCard,
              { backgroundColor: theme.colors.green50, borderColor: theme.colors.green600 },
            ]}
          >
            <View style={styles.alertTitleRow}>
              <CheckCircleIcon color={theme.colors.green600} />
              <Text variant="subtitle" weight="medium" color={theme.colors.green600}>
                {t('order_alert_ready_pickup_title')}
              </Text>
            </View>
          </View>
        ) : null}

        <View
          style={[
            styles.progressCard,
            { backgroundColor: theme.colors.gray100, borderColor: theme.colors.gray200, shadowColor: theme.colors.shadow },
          ]}
        >
          {detailQuery.isLoading ? (
            <View style={styles.loadingInline}>
              <ActivityIndicator color={theme.colors.primary} />
            </View>
          ) : detailQuery.isError ? (
            <Text variant="label" color={theme.colors.gray600}>{detailQuery.error?.message ?? t('orders_empty')}</Text>
          ) : (
            <>
              <View style={styles.rowBetween}>
                <Text variant="label" weight="medium" color={theme.colors.gray600}>{t('order_delivery_progress')}</Text>
                <View style={styles.stepWrap}>
                  <Text variant="caption" color={theme.colors.gray500}>{t('order_step')}</Text>
                  <Text variant="label" weight="semiBold" color={theme.colors.gray700}>{`${step}/8`}</Text>
                </View>
              </View>

              <View style={styles.currentRow}>
                <View style={[styles.currentDot, { backgroundColor: theme.colors.primary }]} />
                <Text variant="label" weight="semiBold" color={theme.colors.gray900}>{currentTitle}</Text>
              </View>

              <Text variant="caption" color={theme.colors.gray500}>{t('order_next', { status: nextTitle })}</Text>

              <View style={styles.segmentsWrap}>
                {Array.from({ length: 8 }).map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.segment,
                      { backgroundColor: theme.colors.gray250 },
                    ]}
                  >
                    <View
                      style={[
                        styles.segmentFill,
                        {
                          width: index < step - 1 ? '100%' : index === step - 1 ? '50%' : '0%',
                          backgroundColor: theme.colors.primary,
                        },
                      ]}
                    />
                  </View>
                ))}
              </View>

              <Pressable
                onPress={() => setTimelineOpen((value) => !value)}
                style={[styles.timelineButton, { backgroundColor: theme.colors.gray150 }]}
              >
                <Text variant="label" weight="medium" color={theme.colors.gray700}>
                  {timelineOpen ? t('order_hide_timeline') : t('order_view_timeline')}
                </Text>
                <ChevronIcon up={timelineOpen} color={theme.colors.gray600} />
              </Pressable>

              {timelineOpen ? (
                <ScrollView
                  style={styles.timelineScroll}
                  contentContainerStyle={styles.timelineWrap}
                  nestedScrollEnabled
                  showsVerticalScrollIndicator={false}
                >
                  {DELIVERY_PROGRESS_ORDER.map((statusItem, index) => {
                    const isCompleted = index < currentIndex;
                    const isCurrent = index === currentIndex;
                    const showConnector = index < DELIVERY_PROGRESS_ORDER.length - 1;
                    const itemTitle = t(STATUS_TITLE_KEY[statusItem]);
                    const nextDescKey = NEXT_STATUS_KEY[statusItem];
                    const itemDesc = statusItem === RiderDeliveryProgressStatus.DELIVERED
                      ? t('order_status_desc_delivered')
                      : t('order_next', { status: t(nextDescKey) });

                    return (
                      <View key={statusItem} style={styles.timelineRow}>
                        <View style={styles.railCol}>
                          <View
                            style={[
                              styles.railDot,
                              {
                                borderColor: isCompleted || isCurrent ? theme.colors.primary : theme.colors.gray250,
                                backgroundColor: isCompleted ? theme.colors.primary : theme.colors.gray100,
                              },
                            ]}
                          >
                            {isCompleted ? <CheckIcon color={theme.colors.white} /> : null}
                            {isCurrent ? <View style={[styles.currentInner, { backgroundColor: theme.colors.primary }]} /> : null}
                          </View>
                          {showConnector ? (
                            <View
                              style={[
                                styles.railConnector,
                                { backgroundColor: isCompleted ? theme.colors.primary : theme.colors.gray250 },
                              ]}
                            />
                          ) : null}
                        </View>
                        <View style={styles.timelineText}>
                          <Text variant="label" weight={isCurrent ? 'semiBold' : 'medium'} color={theme.colors.gray900}>
                            {itemTitle}
                          </Text>
                          <Text variant="caption" color={theme.colors.gray600}>{itemDesc}</Text>
                        </View>
                        <Text variant="caption" weight="medium" color={theme.colors.gray500}>--:--</Text>
                      </View>
                    );
                  })}
                </ScrollView>
              ) : null}
            </>
          )}
        </View>
      </View>

      <View style={[styles.bottomControls, { bottom: Math.max(insets.bottom, 8) }]}>
        <View style={styles.floatingRow}>
          <Pressable style={[styles.navigateChip, { backgroundColor: theme.colors.zinc800 }]} onPress={openNavigation}>
            <NavigationIcon color={theme.colors.white} />
            <Text variant="label" weight="medium" color={theme.colors.white}>{t('order_navigate')}</Text>
          </Pressable>

          <View style={styles.actionsRow}>
            <Pressable
              onPress={() => void openDialer()}
              disabled={!detailQuery.data?.customerPhone}
              style={[styles.roundAction, { borderColor: theme.colors.gray250, backgroundColor: theme.colors.white }]}
            >
              <PhoneIcon width={20} height={20} />
            </Pressable>
            <Pressable
              onPress={openChat}
              style={[styles.roundAction, { borderColor: theme.colors.gray250, backgroundColor: theme.colors.white }]}
            >
              <ChatBubbleOvalIcon width={20} height={20} />
            </Pressable>
          </View>
        </View>

        <View style={[styles.ctaWrap, { backgroundColor: theme.colors.gray100 }]}>
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
        </View>
      </View>

      {isDelivered ? (
        <View style={[styles.modalOverlay, { backgroundColor: theme.colors.modalBackdrop }]}>
          <View style={[styles.successCard, { backgroundColor: theme.colors.white, shadowColor: theme.colors.shadow }]}>
            <Text style={styles.emoji}>🎉</Text>
            <Text variant="title" weight="semiBold" color={theme.colors.gray900} style={styles.centerText}>
              {t('order_well_done_rider')}
            </Text>
            <Text variant="label" color={theme.colors.gray600} style={styles.centerText}>
              {t('order_delivered_message', { code: detailQuery.data?.orderCode ?? '—' })}
            </Text>
          </View>

          <View
            style={[
              styles.modalBottom,
              {
                backgroundColor: theme.colors.white,
                paddingBottom: Math.max(insets.bottom, 12) + 12,
              },
            ]}
          >
            <Text variant="subtitle" color={theme.colors.gray600} style={styles.centerText}>{t('order_ready_next_job')}</Text>
            <Button
              label={t('order_pick_next_order')}
              onPress={closeDeliveredModal}
              containerStyle={styles.primaryButton}
              textColor={theme.colors.gray900}
            />
            <Pressable onPress={closeDeliveredModal} style={[styles.outlineBtn, { borderColor: theme.colors.gray900 }]}>
              <Text variant="subtitle" weight="medium" color={theme.colors.gray900}>{t('order_done_for_today')}</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
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
    paddingTop: 16,
    gap: 10,
  },
  alertCard: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 6,
  },
  alertTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  loadingInline: {
    paddingVertical: 12,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepWrap: {
    alignItems: 'flex-end',
    gap: 2,
  },
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
    height: 6,
    borderRadius: 999,
    overflow: 'hidden',
  },
  segmentFill: {
    height: '100%',
    borderRadius: 999,
  },
  timelineButton: {
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  chevronUp: {
    transform: [{ rotate: '180deg' }],
  },
  timelineWrap: {
    gap: 8,
    paddingTop: 4,
  },
  timelineScroll: {
    maxHeight: 400,
  },
  timelineRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  railCol: {
    width: 18,
    alignItems: 'center',
  },
  railDot: {
    width: 18,
    height: 18,
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
    height: 30,
  },
  timelineText: {
    flex: 1,
    gap: 2,
  },
  bottomControls: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    // paddingHorizontal: 16,
    paddingTop: 10,
    gap: 12,
  },
  floatingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16
  },
  navigateChip: {
    borderRadius: 50,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  roundAction: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaWrap: {
    paddingHorizontal: 16,
    paddingVertical: 30,
  },
  primaryButton: {
    height: 54,
    borderRadius: 40,
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successCard: {
    width: '88%',
    maxWidth: 360,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: 'center',
    gap: 6,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  emoji: {
    fontSize: 44,
    lineHeight: 52,
  },
  modalBottom: {
    width: '100%',
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 24,
    gap: 14,
  },
  outlineBtn: {
    height: 54,
    borderRadius: 40,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerText: {
    textAlign: 'center',
  },
});
