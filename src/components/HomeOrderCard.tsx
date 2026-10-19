import AddressDetailsView from './AddressDetailsView';
import React from 'react';
import { Alert, Image, Linking, Pressable, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import PickupLocationIcon from '../assets/svgs/pickUpLocaton.svg';
import HomeIcon from '../assets/svgs/homeIcon.svg';
import { useAppCurrency } from '../hooks/useCurrency';
import { useRiderOrderChatUnreadQuery } from '../hooks/useSupportChat';
import { useAssignOrderMutation } from '../hooks/useRiderHomeMutations';
import { useTranslations } from '../localization/LocalizationProvider';
import type { MainStackParamList } from '../navigation/types';
import { useAppTheme } from '../theme/ThemeProvider';
import type { ThemeColors } from '../theme/colors';
import type { RiderHomeOrder, RiderOrderTab } from '../api/riderHomeTypes';
import { resolveProgressStatusFromOrder, RiderDeliveryProgressStatus } from '../screens/orderDetail/progress';
import Button from './Button';
import OrderConversationButton from './OrderConversationButton';
import Text from './Text';

type Props = {
  order: RiderHomeOrder;
  tab: RiderOrderTab;
  onAssigned: (order: { orderId: string; orderCode: string; storeName: string | null }) => void;
  highlighted?: boolean;
};
type ContactKind = 'store_rider' | 'customer_rider';

function statusTone(colors: ThemeColors, status: string) {
  const value = status.toLowerCase();
  if (value.includes('deliver') || value.includes('ready') || value.includes('paid')) return { background: colors.green50, text: colors.green600 };
  if (value.includes('cancel') || value.includes('reject') || value.includes('fail')) return { background: colors.red100, text: colors.red800 };
  return { background: colors.sky100, text: colors.sky600 };
}

function extractCourierNote(customerComment: string | null) {
  if (!customerComment?.trim()) return null;
  const match = customerComment.match(/(?:^|\n)\s*Courier:\s*([\s\S]*?)$/i);
  return match?.[1]?.trim() || (!/^\s*Restaurant:/i.test(customerComment) ? customerComment.trim() : null);
}

function usableImage(image: string | null) {
  return image && !/placehold\.co|placeholder/i.test(image) ? image : null;
}

export default function HomeOrderCard({ order, tab, onAssigned, highlighted = false }: Props) {
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
    : tab === 'processing' && (progressStatus !== RiderDeliveryProgressStatus.ASSIGNED || order.status === 'rider_assigned' || order.riderStatus)
      ? t(`order_status_${progressStatus}`)
      : order.statusLabel ?? order.status ?? t('status_unknown');
  const tone = statusTone(theme.colors, status);
  const createdAt = order.createdAt ? new Date(order.createdAt) : null;
  const placedAt = createdAt && !Number.isNaN(createdAt.getTime())
    ? createdAt.toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    : '—';
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
      await assignOrderMutation.mutateAsync(orderId);
      onAssigned({ orderId, orderCode: code, storeName: order.storeName });
    } catch (error) {
      setAssignError(error instanceof Error ? error.message : t('order_assign_failed_fallback'));
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: highlighted ? theme.colors.primary : theme.colors.gray200, shadowColor: theme.colors.shadow }]}>
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
        <ContactCard kind="store_rider" name={order.storeName || t('chat_store_name')} address={order.pickupAddress} image={order.storeImage} unreadCount={unread?.store_rider ?? 0} showChat={showChats} onChat={() => openChat('store_rider')} colors={theme.colors} />
        <ContactCard kind="customer_rider" name={order.customerName || t('chat_customer_name')} address={order.deliveryAddress} image={order.customerImage} unreadCount={unread?.customer_rider ?? 0} showChat={showChats} onChat={() => openChat('customer_rider')} colors={theme.colors} />
        <AddressDetailsView isHistoricalFallback={order.deliveryAddressIsHistoricalFallback} details={order.deliveryAddressDetails} legacyText={order.deliveryAddressExtras} />
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
          <Text variant="label" weight="semiBold" color={theme.colors.gray900} numberOfLines={1}>{order.paymentMethod || '—'}</Text>
          <Text variant="caption" color={theme.colors.gray600} numberOfLines={1}>{order.paymentStatus || '—'}</Text>
        </View>
      </View>

      {note ? <View style={[styles.note, { backgroundColor: theme.colors.gray100 }]}><Text variant="caption" weight="semiBold" color={theme.colors.gray700}>{t('home_comment')}</Text><Text variant="label" color={theme.colors.gray900}>{note}</Text></View> : null}
      {tab === 'new' && assignError ? <Text variant="caption" color={theme.colors.red500}>{assignError}</Text> : null}
      {tab === 'new' && order.canAssignMe ? <Button label={assignOrderMutation.isPending ? t('order_assigning') : t('order_assign_me')} onPress={assignOrder} disabled={assignOrderMutation.isPending} containerStyle={styles.primaryButton} textColor={theme.colors.gray900} /> : null}
      {tab === 'processing' ? <Pressable onPress={openDetail} style={styles.detailsLink} accessibilityRole="button"><Text variant="label" weight="semiBold" color={theme.colors.sky600}>{t('home_view_details')} ›</Text></Pressable> : null}

    </View>
  );
}

function ContactCard({ kind, name, address, image, unreadCount, showChat, onChat, colors }: {
  kind: ContactKind; name: string; address: string | null; image: string | null; unreadCount: number;
  showChat: boolean; onChat: () => void; colors: ThemeColors;
}) {
  const { t } = useTranslations('app');
  const isStore = kind === 'store_rider';
  const label = t(isStore ? 'home_store_contact' : 'home_customer_contact');
  const contactImage = usableImage(image);
  return (
    <View style={[styles.contactCard, { backgroundColor: isStore ? colors.sky100 : colors.green50 }]}>
      <View style={styles.contactMain}>
        {contactImage ? <Image source={{ uri: contactImage }} style={styles.contactImage} /> : (
          <View style={[styles.contactImage, styles.contactPlaceholder, { backgroundColor: colors.surface }]}>
            {isStore ? <PickupLocationIcon width={20} height={20} stroke={colors.sky600} /> : <HomeIcon width={20} height={20} stroke={colors.green600} />}
          </View>
        )}
        <View style={styles.contactText}>
          <Text variant="caption" weight="semiBold" color={colors.gray600}>{label}</Text>
          <Text variant="label" weight="bold" color={colors.gray900} numberOfLines={1}>{name}</Text>
          <Text variant="caption" color={colors.gray700} numberOfLines={2}>{address?.trim() || '—'}</Text>
        </View>
      </View>
      {(showChat || address) ? <View style={[styles.contactActions, showChat && styles.contactActionsStacked]}>
        {showChat ? <OrderConversationButton kind={kind} unreadCount={unreadCount} onPress={onChat} style={styles.fullContactAction} /> : null}
        {address ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('home_open_map', { place: label })}
            onPress={() => void Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`).catch(() => Alert.alert(t('home_map_unavailable')))}
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
  note: { borderRadius: 12, padding: 12, gap: 4 },
  primaryButton: { height: 46, borderRadius: 12 },
  detailsLink: { minHeight: 34, alignItems: 'center', justifyContent: 'center' },
});
