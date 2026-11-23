import React, { useMemo, useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import type { RiderHomeOrder, RiderOrderUpdatableStatus } from '../api/riderHomeTypes';
import { useUpdateRiderOrderStatusMutation } from '../hooks/useRiderHomeMutations';
import { isEndedRiderOrder } from '../hooks/riderStatusReconciliation';
import { useRiderOrderDetailQuery } from '../hooks/useRiderOrderDetailQuery';
import { useRiderLiveLocationTracking } from '../hooks/useRiderLiveLocationTracking';
import { useDeliveryUnlock } from '../hooks/useDeliveryUnlock';
import {
  getRiderDeliveryLocationPermissionStatus,
  requestRiderDeliveryLocationPermissions,
  stopRiderBackgroundLocation,
} from '../location/riderBackgroundLocationTask';
import { useTranslations } from '../localization/LocalizationProvider';
import { useAppTheme } from '../theme/ThemeProvider';
import { resolveProgressStatusFromOrder, RiderDeliveryProgressStatus } from '../screens/orderDetail/progress';
import DeliveryLockNotice from '../screens/orderDetail/components/DeliveryLockNotice';
import Button from './Button';
import RiderLocationDisclosureModal from './RiderLocationDisclosureModal';
import Text from './Text';

const PRE_PICKUP_ORDER_STATUSES = ['accepted', 'preparing', 'ready', 'rider_assigned'];
const POST_PICKUP_ORDER_STATUSES = ['picked_up', 'out_for_delivery', 'arrived'];

const BUTTON_LABEL_KEY: Partial<Record<RiderOrderUpdatableStatus, string>> = {
  arrived_at_store: 'order_status_arrived_at_store',
  picked_up: 'order_status_picked_up',
  arrived: 'order_status_arrived_at_customer',
  delivered: 'order_status_delivered',
};

type LocationIssue = { level: 'foreground' | 'background'; canAskAgain: boolean } | null;

/**
 * Next rider step for a processing order, mirroring the delivery details page:
 * heading to store -> arrived at store -> (store marks ready) picked up, which the server moves
 * straight to out for delivery -> arrived at customer -> delivered.
 */
function resolveNextStep(order: RiderHomeOrder): { status: RiderOrderUpdatableStatus | null; waitingForStore: boolean } {
  const orderStatus = order.status ?? '';
  const progress = resolveProgressStatusFromOrder(order.status, order.riderStatus);

  if (PRE_PICKUP_ORDER_STATUSES.includes(orderStatus)) {
    if (progress !== RiderDeliveryProgressStatus.ARRIVED_AT_STORE) return { status: 'arrived_at_store', waitingForStore: false };
    return orderStatus === 'ready'
      ? { status: 'picked_up', waitingForStore: false }
      : { status: null, waitingForStore: true };
  }
  if (orderStatus === 'picked_up' || orderStatus === 'out_for_delivery') return { status: 'arrived', waitingForStore: false };
  if (orderStatus === 'arrived') return { status: 'delivered', waitingForStore: false };
  return { status: null, waitingForStore: false };
}

type Props = { order: RiderHomeOrder };

export default function HomeOrderStatusAction({ order }: Props) {
  const orderId = order.orderId ?? '';
  const { theme } = useAppTheme();
  const { t } = useTranslations('app');
  const mutation = useUpdateRiderOrderStatusMutation(orderId);
  const [isCheckingPermission, setIsCheckingPermission] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<RiderOrderUpdatableStatus | null>(null);
  const [locationIssue, setLocationIssue] = useState<LocationIssue>(null);
  const [permissionRevision, setPermissionRevision] = useState(0);

  const isPostPickup = POST_PICKUP_ORDER_STATUSES.includes(order.status ?? '');
  // After pickup the card needs the drop-off, the unlock rules and live GPS, as the details page does.
  const detailQuery = useRiderOrderDetailQuery(orderId, isPostPickup);
  const detail = detailQuery.data;
  const riderLocation = useRiderLiveLocationTracking({
    customerUserId: detail?.customerUserId,
    enabled: isPostPickup && Boolean(detail),
    orderId,
    // Stopping is owned by delivery completion and the details page.
    stopWhenDisabled: false,
    permissionRevision,
  });
  const dropoff = useMemo(
    () => detail?.deliveryLatitude != null && detail?.deliveryLongitude != null
      ? { latitude: detail.deliveryLatitude, longitude: detail.deliveryLongitude }
      : null,
    [detail?.deliveryLatitude, detail?.deliveryLongitude],
  );
  const deliveryUnlock = useDeliveryUnlock(detail?.deliveryUnlock, detailQuery.dataUpdatedAt, riderLocation, dropoff);

  if (!orderId || isEndedRiderOrder(order.status)) return null;
  const { status: nextStatus, waitingForStore } = resolveNextStep(order);
  if (!nextStatus && !waitingForStore) return null;

  const needsDropoff = nextStatus === 'arrived' || nextStatus === 'delivered';
  const needsLocation = nextStatus === 'picked_up' || needsDropoff;
  const isLoadingUnlock = needsDropoff && detailQuery.isLoading;
  const isDeliveryLocked = needsDropoff && !isLoadingUnlock && !deliveryUnlock.isUnlocked;
  const busy = mutation.isPending || isCheckingPermission;

  const send = (status: RiderOrderUpdatableStatus) => {
    const withLocation = (status === 'arrived' || status === 'delivered') && riderLocation;
    mutation.mutate(
      withLocation ? { status, latitude: riderLocation.latitude, longitude: riderLocation.longitude } : { status },
      {
        onSuccess: (response) => {
          if (status === 'delivered' || response.status === 'delivered') {
            void stopRiderBackgroundLocation(orderId).catch((error) => console.warn('[rider][location] completed delivery cleanup failed', error));
          } else if (status === 'picked_up') {
            void detailQuery.refetch();
          }
        },
      },
    );
  };

  const submit = async () => {
    if (!nextStatus || busy || isDeliveryLocked || isLoadingUnlock) return;
    if (needsLocation) {
      setIsCheckingPermission(true);
      try {
        const permission = await getRiderDeliveryLocationPermissionStatus();
        if (!permission.granted) {
          setPendingStatus(nextStatus);
          return;
        }
      } catch {
        setPendingStatus(nextStatus);
        return;
      } finally {
        setIsCheckingPermission(false);
      }
    }
    setLocationIssue(null);
    send(nextStatus);
  };

  // Prominent disclosure first, then the system prompt, all without leaving the order list.
  const continueAfterDisclosure = async () => {
    const status = pendingStatus;
    setPendingStatus(null);
    if (!status) return;
    setIsCheckingPermission(true);
    try {
      const permission = await requestRiderDeliveryLocationPermissions();
      if (permission.granted) {
        setLocationIssue(null);
        setPermissionRevision((value) => value + 1);
        send(status);
      } else {
        setLocationIssue({ level: permission.level, canAskAgain: permission.canAskAgain });
      }
    } catch (error) {
      console.warn('[rider][location] delivery permission request unavailable', error);
      setLocationIssue({ level: 'foreground', canAskAgain: true });
    } finally {
      setIsCheckingPermission(false);
    }
  };

  const recoverLocation = () => {
    if (locationIssue?.canAskAgain) {
      if (nextStatus) setPendingStatus(nextStatus);
      return;
    }
    void Linking.openSettings().catch((error) => console.warn('[rider][location] unable to open settings', error));
  };

  const label = busy
    ? t('order_status_updating')
    : waitingForStore
      ? t('order_waiting_for_order_disabled')
      : t(BUTTON_LABEL_KEY[nextStatus as RiderOrderUpdatableStatus] ?? 'order_status_updating');
  const isDisabled = busy || waitingForStore || isDeliveryLocked || isLoadingUnlock;

  return (
    <View style={styles.wrap}>
      {isDeliveryLocked && !mutation.isPending ? (
        <DeliveryLockNotice
          status={nextStatus === 'arrived' ? 'arrived' : 'delivered'}
          radiusMeters={deliveryUnlock.radiusMeters}
          distanceMeters={deliveryUnlock.distanceMeters}
          secondsUntilUnlock={deliveryUnlock.secondsUntilUnlock}
        />
      ) : null}
      {locationIssue ? (
        <Pressable onPress={recoverLocation} accessibilityRole="button" style={[styles.locationIssue, { backgroundColor: theme.colors.primarySoft }]}>
          <Text variant="caption" color={theme.colors.gray700}>
            {t(locationIssue.level === 'background' ? 'order_location_background_needed' : 'order_location_foreground_needed')}
          </Text>
          <Text variant="caption" weight="semiBold" color={theme.colors.brandInk}>
            {t(locationIssue.canAskAgain ? 'order_location_retry' : 'order_location_settings')}
          </Text>
        </Pressable>
      ) : null}
      <Button
        label={label}
        onPress={() => void submit()}
        disabled={isDisabled}
        containerStyle={[styles.button, waitingForStore || isDeliveryLocked ? { backgroundColor: theme.colors.gray250 } : null]}
        textColor={waitingForStore || isDeliveryLocked ? theme.colors.white : theme.colors.gray900}
      />
      {mutation.isError ? (
        <Text variant="caption" color={theme.colors.red500} style={styles.centered}>
          {mutation.error.status === 0 || mutation.error.status === 408 ? t('order_status_confirmation_failed') : mutation.error.message}
        </Text>
      ) : null}
      <RiderLocationDisclosureModal
        visible={pendingStatus !== null}
        onContinue={() => void continueAfterDisclosure()}
        onNotNow={() => setPendingStatus(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  button: { height: 46, borderRadius: 12 },
  centered: { textAlign: 'center' },
  locationIssue: { borderRadius: 10, padding: 10, gap: 4 },
});
