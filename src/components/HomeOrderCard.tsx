import AddressDetailsView, { type AddressDetails } from './AddressDetailsView';
import DropOffPreferenceNotice from './DropOffPreferenceNotice';
import React from 'react';
import { Alert, Image, Pressable, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import PickupLocationIcon from '../assets/svgs/pickUpLocaton.svg';
import HomeIcon from '../assets/svgs/homeIcon.svg';
import { ApiError } from '../api/apiClient';
import type { ActiveOrderAssignmentConflict, RiderHomeOrder, RiderOrderTab } from '../api/riderHomeTypes';
import { openAddressOnMap } from '../location/openOrderNavigation';
import { useAppCurrency } from '../hooks/useCurrency';
import { useRiderOrderChatUnreadQuery } from '../hooks/useSupportChat';
import { useAssignOrderMutation } from '../hooks/useRiderHomeMutations';
import { useTranslations } from '../localization/LocalizationProvider';
import type { MainStackParamList } from '../navigation/types';
import { useAppTheme } from '../theme/ThemeProvider';
import type { ThemeColors } from '../theme/colors';
import { resolveProgressStatusFromOrder, RiderDeliveryProgressStatus } from '../screens/orderDetail/progress';
import Button from './Button';
import OrderConversationButton from './OrderConversationButton';
import HomeOrderStatusAction from './HomeOrderStatusAction';
import Text from './Text';
import ExpandableText from './ExpandableText';
import { formatOrderTime } from '../utils/orderTime';

type Props = {
  order: RiderHomeOrder;
  tab: RiderOrderTab;
  highlighted?: boolean;
};
type ContactKind = 'store_rider' | 'customer_rider';

function statusTone(colors: ThemeColors, status: string) {
  const value = status.toLowerCase();
  if (value.includes('deliver') || value.includes('ready') || value.includes('paid')) return { background: colors.green50, text: colors.green600 };
  if (value.includes('cancel') || value.includes('reject') || value.includes('fail')) return { background: colors.red100, text: colors.red800 };
  return { background: colors.primarySoft, text: colors.brandInk };
}

function extractCourierNote(customerComment: string | null) {
  if (!customerComment?.trim()) return null;
  const match = customerComment.match(/(?:^|\n)\s*Courier:\s*([\s\S]*?)$/i);
  return match?.[1]?.trim() || (!/^\s*Restaurant:/i.test(customerComment) ? customerComment.trim() : null);
}

function usableImage(image: string | null) {
  return image && !/placehold\.co|placeholder/i.test(image) ? image : null;
}

function getActiveOrderConflict(error: unknown): ActiveOrderAssignmentConflict | null {
  if (!(error instanceof ApiError) || error.code !== 'RIDER_HAS_ACTIVE_ORDER') return null;
  const data = error.data;
  if (!data || typeof data !== 'object') return null;

  const payload = data as Record<string, unknown>;
  if (
    payload.code !== 'RIDER_HAS_ACTIVE_ORDER'
    || typeof payload.message !== 'string'
    || typeof payload.activeOrderId !== 'string'
    || typeof payload.activeOrderCode !== 'string'
  ) return null;

  return {
    code: payload.code,
    message: payload.message,
    activeOrderId: payload.activeOrderId,
    activeOrderCode: payload.activeOrderCode,
  };
}

export default function HomeOrderCard({ order, tab, highlighted = false }: Props) {
  const { theme } = useAppTheme();
  const { t } = useTranslations('app');
  const { formatCurrency } = useAppCurrency();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const assignOrderMutation = useAssignOrderMutation();
  const unreadQuery = useRiderOrderChatUnreadQuery();
  const unread = unreadQuery.data?.byOrderAndKind?.[order.orderId ?? ''];
  const [assignError, setAssignError] = React.useState('');

  const code = (order.orderCode ?? order.orderId?.split('-')[0]?.toUpperCase() ?? '—').replace(/^#/, '');
  const progressStatus = resolveProgressStatusFromOrder(order.status, order.riderStatus);
  const status = tab === 'new'
    ? t('status_new_order')
    : tab === 'processing'
      ? t(`order_status_${progressStatus}`)
      : order.statusLabel ?? order.status ?? t('status_unknown');
  const tone = statusTone(theme.colors, status);
  // Rider is at the store: tell them whether to wait for the store or pick up now.
  const isAtStore = tab === 'processing'
    && progressStatus === RiderDeliveryProgressStatus.ARRIVED_AT_STORE
    && ['accepted', 'preparing', 'ready', 'rider_assigned'].includes(order.status ?? '');
  const atStoreNotice = !isAtStore
    ? null
    : order.status === 'ready'
      ? t('order_alert_ready_pickup_title')
      : t(order.status === 'preparing' ? 'order_waiting_store_preparing' : 'order_waiting_order_completion');
  const placedAt = formatOrderTime(order.createdAt, order.storeTimezone) ?? '—';
  const note = order.courierNote?.trim() || extractCourierNote(order.customerComment);
  const showChats = tab === 'processing' && Boolean(order.orderId);

  const openDetail = () => {
    if (tab === 'processing' && order.orderId) navigation.navigate('ProcessingOrderDetail', { orderId: order.orderId });
  };
  const openChat = (kind: ContactKind) => {
    if (!showChats || !order.orderId) return;
    navigation.navigate('OrderChat', {
      orderId: order.orderId,
      kind,
      name: kind === 'store_rider' ? order.storeName || t('chat_store_name') : order.customerName || t('chat_customer_name'),
      phone: null,
      chatBoxId: null,
    });
  };
  const assignOrder = async () => {
    const orderId = order.orderId;
    if (tab !== 'new' || !orderId) return;
    assignOrderMutation.reset();
    setAssignError('');
    try {
      // HomeScreen switches to the Pickup tab on success. The socket often removes
      // this card from New before the request resolves, so it can't do it here.
      await assignOrderMutation.mutateAsync(orderId);
    } catch (error) {
      const conflict = getActiveOrderConflict(error);
      if (conflict) {
        Alert.alert(
          t('order_active_assignment_title'),
          t('order_active_assignment_message', { orderCode: conflict.activeOrderCode.replace(/^#/, '') }),
          [
            { text: t('order_active_assignment_close') },
            {
              text: t('order_active_assignment_view'),
              onPress: () => navigation.navigate('ProcessingOrderDetail', { orderId: conflict.activeOrderId }),
            },
          ],
        );
        return;
      }
      setAssignError(error instanceof Error ? error.message : t('order_assign_failed_fallback'));
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: highlighted ? theme.colors.brandInk : theme.colors.gray200, shadowColor: theme.colors.shadow }]}>
      <Pressable onPress={openDetail} disabled={tab !== 'processing'} style={styles.header} accessibilityRole={tab === 'processing' ? 'button' : undefined} accessibilityLabel={tab === 'processing' ? t('home_open_order', { code }) : undefined}>
        <View style={styles.headerCopy}>
          <Text variant="subtitle" weight="bold" color={theme.colors.gray900}>#{code}</Text>
          <Text variant="caption" color={theme.colors.gray600}>{placedAt}</Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: tone.background }]}>
          <Text variant="caption" weight="semiBold" color={tone.text} numberOfLines={2}>{status}</Text>
        </View>
      </Pressable>

      <View style={styles.contacts}>
        <ContactCard kind="store_rider" name={order.storeName || t('chat_store_name')} address={order.pickupAddress} image={order.storeImage} unreadCount={0} showChat={false} onChat={() => {}} colors={theme.colors} />
        <ContactCard kind="customer_rider" name={order.customerName || t('chat_customer_name')} address={order.deliveryAddress} image={order.customerImage} unreadCount={unread?.customer_rider ?? 0} showChat={showChats} onChat={() => openChat('customer_rider')} colors={theme.colors} details={order.deliveryAddressDetails} legacyText={order.deliveryAddressExtras} isHistoricalFallback={order.deliveryAddressIsHistoricalFallback} courierMessage={note} leaveAtDoor={order.leaveAtDoor} />
      </View>

      <View style={[styles.summary, { borderTopColor: theme.colors.gray200 }]}>
        <View style={styles.summaryCell}>
          <Text variant="caption" color={theme.colors.gray600}>{t('home_order_amount')}</Text>
          <Text variant="label" weight="bold" color={theme.colors.gray900}>{formatCurrency(Number(order.orderAmount ?? 0))}</Text>
        </View>
        <View style={styles.summaryCell}>
          <Text variant="caption" color={theme.colors.gray600}>{t('home_distance')}</Text>
          <Text variant="label" weight="semiBold" color={theme.colors.gray900}>{order.distanceKm == null ? '—' : `${order.distanceKm.toFixed(1)} km`}</Text>
        </View>
        <View style={styles.summaryCell}>
          <Text variant="caption" color={theme.colors.gray600}>{t('home_payment_method')}</Text>
          <Text variant="label" weight="semiBold" color={theme.colors.gray900} numberOfLines={1}>{order.paymentMethod === 'wallet_card' ? t('home_payment_method_wallet_card') : order.paymentMethod || '—'}</Text>
          <Text variant="caption" color={theme.colors.gray600} numberOfLines={1}>{order.paymentStatus || '—'}</Text>
        </View>
      </View>

      {tab === 'new' && assignError ? <Text variant="caption" color={theme.colors.red500}>{assignError}</Text> : null}
      {tab === 'new' && order.canAssignMe ? <Button label={assignOrderMutation.isPending ? t('order_assigning') : t('order_assign_me')} onPress={assignOrder} disabled={assignOrderMutation.isPending} containerStyle={styles.primaryButton} textColor={theme.colors.gray900} /> : null}
      {atStoreNotice ? (
        <View style={[styles.atStoreNotice, { backgroundColor: order.status === 'ready' ? theme.colors.green50 : theme.colors.primarySoft }]}>
          <Text variant="caption" weight="semiBold" color={order.status === 'ready' ? theme.colors.green600 : theme.colors.brandInk}>{atStoreNotice}</Text>
        </View>
      ) : null}
      {tab === 'processing' ? <Pressable onPress={openDetail} style={styles.detailsLink} accessibilityRole="button"><Text variant="label" weight="semiBold" color={theme.colors.brandInk}>{t('home_view_details')} ›</Text></Pressable> : null}
      {tab === 'processing' ? <HomeOrderStatusAction order={order} /> : null}

    </View>
  );
}

function ContactCard({ kind, name, address, image, unreadCount, showChat, onChat, colors, details, legacyText, isHistoricalFallback, courierMessage, leaveAtDoor }: {
  kind: ContactKind; name: string; address: string | null; image: string | null; unreadCount: number;
  showChat: boolean; onChat: () => void; colors: ThemeColors;
  details?: AddressDetails | null; legacyText?: string | null;
  isHistoricalFallback?: boolean; courierMessage?: string | null; leaveAtDoor?: boolean | null;
}) {
  const { t } = useTranslations('app');
  const isStore = kind === 'store_rider';
  const label = t(isStore ? 'home_store_contact' : 'home_customer_contact');
  const contactImage = usableImage(image);
  return (
    <View style={[styles.contactCard, { backgroundColor: isStore ? colors.primarySoft : colors.green50 }]}>
      <View style={styles.contactMain}>
        {contactImage ? <Image source={{ uri: contactImage }} style={styles.contactImage} /> : (
          <View style={[styles.contactImage, styles.contactPlaceholder, { backgroundColor: colors.surface }]}>
            {isStore ? <PickupLocationIcon width={20} height={20} stroke={colors.brandInk} /> : <HomeIcon width={20} height={20} stroke={colors.green600} />}
          </View>
        )}
        <View style={styles.contactText}>
          <Text variant="caption" weight="semiBold" color={colors.gray600}>{label}</Text>
          <Text variant="label" weight="bold" color={colors.gray900} numberOfLines={1}>{name}</Text>
          <ExpandableText text={address?.trim() || '—'} variant="caption" textColor={colors.gray700} linkColor={colors.brandInk} moreLabel={t('address_details_showMore')} lessLabel={t('address_details_showLess')} />
        </View>
      </View>
      {!isStore ? <DropOffPreferenceNotice leaveAtDoor={leaveAtDoor} /> : null}
      {!isStore ? <AddressDetailsView details={details} legacyText={legacyText} isHistoricalFallback={isHistoricalFallback} courierMessage={courierMessage} style={styles.addressDetails} /> : null}
      {(showChat || address) ? <View style={[styles.contactActions, showChat && styles.contactActionsStacked]}>
        {showChat ? <OrderConversationButton kind={kind} unreadCount={unreadCount} onPress={onChat} style={styles.fullContactAction} /> : null}
        {address ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('home_open_map', { place: label })}
            onPress={() => void openAddressOnMap(address).catch(() => Alert.alert(t('home_map_unavailable')))}
            style={[styles.mapAction, showChat && styles.fullContactAction, { backgroundColor: colors.surface, borderColor: colors.gray200 }]}
          >
            <Feather name="map-pin" size={16} color={colors.gray900} />
            <Text variant="caption" weight="semiBold" color={colors.gray900}>{t('home_view_on_map')}</Text>
          </Pressable>
        ) : null}
      </View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 20, padding: 16, gap: 14, marginBottom: 14, shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 2 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  headerCopy: { gap: 3, flex: 1 },
  statusPill: { maxWidth: '50%', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7 },
  contacts: { gap: 10 },
  contactCard: { borderRadius: 14, padding: 12, gap: 12 },
  contactMain: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  contactImage: { width: 42, height: 42, borderRadius: 12 },
  contactPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  contactText: { flex: 1, gap: 2 },
  contactActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  contactActionsStacked: { flexDirection: 'column', alignItems: 'stretch' },
  fullContactAction: { flex: 0, alignSelf: 'stretch' },
  mapAction: { flex: 1, minHeight: 44, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  summary: { borderTopWidth: 1, paddingTop: 12, flexDirection: 'row', gap: 10 },
  summaryCell: { flex: 1, minWidth: 0, gap: 2 },
  addressDetails: { marginTop: 0 },
  primaryButton: { height: 46, borderRadius: 12 },
  atStoreNotice: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  detailsLink: { minHeight: 34, alignItems: 'center', justifyContent: 'center' },
});
