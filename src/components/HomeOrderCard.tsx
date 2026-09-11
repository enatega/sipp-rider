import React from 'react';
import { Image, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Text from './Text';
import Button from './Button';
import { useAppTheme } from '../theme/ThemeProvider';
import type { ThemeColors } from '../theme/colors';
import { useTranslations } from '../localization/LocalizationProvider';
import { RiderHomeOrder, RiderOrderTab } from '../api/riderHomeTypes';
import { useAssignOrderMutation } from '../hooks/useRiderHomeMutations';
import { MainStackParamList } from '../navigation/types';
import ChatBubbleOvalIcon from '../assets/svgs/chat-bubble-oval.svg';
import MapSvgIcon from '../assets/svgs/map.svg';
import PickupLocationIcon from '../assets/svgs/pickUpLocaton.svg';
import HomeIcon from '../assets/svgs/homeIcon.svg';
import DollarIcon from '../assets/svgs/circle-dollar-sign.svg';
import ClockIcon from '../assets/svgs/Clock.svg';
import locationIcon from '../assets/images/locationIcon.png';
import ListIcon from '../assets/svgs/list-ordered.svg';

type Props = {
  order: RiderHomeOrder;
  tab: RiderOrderTab;
};

type BadgeTone = {
  bg: string;
  text: string;
};

type LocationKind = 'pickup' | 'dropoff';

function statusColors(colors: ThemeColors, label?: string | null): BadgeTone {
  const lower = (label ?? '').toLowerCase();

  if (lower.includes('deliver') || lower.includes('paid')) {
    return { bg: colors.emerald100, text: colors.emerald500 };
  }

  if (lower.includes('assign') || lower.includes('arriv') || lower.includes('wait') || lower.includes('pending')) {
  return { bg: colors.red100, text: colors.red500 };
  }

  return { bg: '#FFEDD5', text: '#F97316' };
}

function getActionLabel(tab: RiderOrderTab, t: (key: string) => string) {
  if (tab === 'new') return t('order_assign_me');
  if (tab === 'processing') return t('order_pick_order');
  return t('order_delivered');
}

export default function HomeOrderCard({ order, tab }: Props) {
  const { theme } = useAppTheme();
  const { t } = useTranslations('app');
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const assignOrderMutation = useAssignOrderMutation();
  const [assignErrorModalVisible, setAssignErrorModalVisible] = React.useState(false);
  const [assignErrorModalMessage, setAssignErrorModalMessage] = React.useState('');

  const safeOrderCode = order.orderCode ?? order.orderId ?? '—';
  const safeStatusLabel =
    (tab === 'processing' ? order.riderStatusLabel ?? order.riderStatus : null)
    ?? order.statusLabel
    ?? order.status
    ?? t('status_unknown');
  const safeStoreName = order.storeName ?? '—';
  const safePickupAddress = order.pickupAddress ?? '—';
  const safeDeliveryAddress = order.deliveryAddress ?? '—';
  const safeOrderAmount = Number(order.orderAmount ?? 0);
  const safeDistanceLabel = order.distanceKm == null ? '—' : `${order.distanceKm.toFixed(1)} Km`;
  const safePaymentMethod = order.paymentMethod ?? '—';
  const safePaymentStatus = order.paymentStatus ?? '—';
  const safeComment = order.courierNote ?? '—';
  const safeStoreImage = order.storeImage ?? '';
  const safeCreatedAt = order.createdAt ? new Date(order.createdAt) : null;
  const safeTime = safeCreatedAt && !Number.isNaN(safeCreatedAt.getTime())
    ? safeCreatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '—';

  const badge = statusColors(theme.colors, safeStatusLabel);
  const paymentBadge = statusColors(theme.colors, safePaymentStatus);
  const showAction = tab === 'new' && Boolean(order.canAssignMe);
  const isAssigning = tab === 'new' && assignOrderMutation.isPending;
  const buttonLabel = isAssigning ? t('order_assigning') : getActionLabel(tab, t);

  const handleActionPress = () => {
    if (tab !== 'new' || !order.orderId) return;
    assignOrderMutation.reset();
    assignOrderMutation.mutate(order.orderId, {
      onSuccess: () => {
        setAssignErrorModalVisible(false);
        setAssignErrorModalMessage('');
      },
      onError: (error) => {
        setAssignErrorModalMessage(error.message || t('order_assign_failed_fallback'));
        setAssignErrorModalVisible(true);
      },
    });
  };

  const handleCardPress = () => {
    if (tab !== 'processing' || !order.orderId) return;
    navigation.navigate('ProcessingOrderDetail', { orderId: order.orderId });
  };

  const handleChatPress = () => {
    if (tab !== 'processing' || !order.orderId) return;
    navigation.navigate('OrderChat', {
      orderId: order.orderId,
      name: safeStoreName,
      phone: null,
      chatBoxId: null,
    });
  };

  return (
    <Pressable onPress={handleCardPress} disabled={tab !== 'processing' || !order.orderId}>
      <View style={[styles.card, { borderColor: theme.colors.gray100, backgroundColor: theme.colors.gray50 }]}>
        <View style={styles.row}>
          <View style={styles.topCell}>
            <View style={styles.iconTextRow}>
              <View style={[styles.greenIconWrap, { backgroundColor: theme.colors.tertiary }]}>
                <ListIcon width={20} height={20} stroke={theme.colors.gray900} />
              </View>
              <View style={styles.textBlock}>
                <Text variant="caption" weight="medium" color={theme.colors.gray600}>{t('home_order_id')}</Text>
                <Text variant="label" weight="semiBold" color={theme.colors.gray900}>#{safeOrderCode}</Text>
              </View>
            </View>
          </View>
          <View style={styles.topCell}>
            <Text variant="caption" weight="medium" color={theme.colors.gray600}>{t('home_order_status')}</Text>
            <View style={[styles.badge, { backgroundColor: badge.bg }]}>
              <Text variant="caption" weight="medium" color={badge.text}>{safeStatusLabel}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.divider, { borderTopColor: theme.colors.gray200 }]} />

        <View style={styles.row}>
          <View style={styles.storeBlock}>
            {safeStoreImage ? (
              <Image source={{ uri: safeStoreImage }} style={[styles.storeImage, { borderColor: theme.colors.gray200 }]} />
            ) : (
              <View style={[styles.storeImage, { borderColor: theme.colors.gray200, backgroundColor: theme.colors.gray100 }]} />
            )}
            <View style={styles.textBlock}>
              <Text variant="caption" weight="medium" color={theme.colors.gray600}>{t('home_store_name')}</Text>
              <Text variant="label" weight="semiBold" color={theme.colors.gray900}>{safeStoreName}</Text>
            </View>
          </View>
          {tab === 'processing' ? (
            <Pressable
              style={[
                styles.chatButton,
                {
                  borderColor: theme.colors.gray200,
                  backgroundColor: theme.colors.surface,
                },
              ]}
              onPress={(event) => {
                event.stopPropagation();
                handleChatPress();
              }}
            >
              <ChatBubbleOvalIcon width={24} height={24} stroke={theme.colors.gray900} />
            </Pressable>
          ) : null}
        </View>

        <View style={[styles.divider, { borderTopColor: theme.colors.gray200 }]} />

        <LocationRow
          kind="pickup"
          label={t('home_pickup')}
          value={safePickupAddress}
          mapLabel={t('home_view_on_map')}
          themeColor={theme.colors}
        />
        <LocationRow
          kind="dropoff"
          label={t('home_deliver')}
          value={safeDeliveryAddress}
          mapLabel={t('home_view_on_map')}
          themeColor={theme.colors}
        />

        <View style={[styles.distanceRow, { backgroundColor: theme.colors.tertiary }]}>
          <Image
            source={locationIcon}
            style={[styles.distanceIcon, { tintColor: theme.colors.gray500 }]}
            resizeMode="contain"
          />
          <Text variant="caption" weight="medium" color={theme.colors.gray500}>{safeDistanceLabel}</Text>
        </View>

        <View style={[styles.divider, { borderTopColor: theme.colors.gray200 }]} />

        <View style={styles.row}>
          <View style={styles.metaCell}>
            <View style={styles.iconTextRow}>
              <View style={[styles.greenIconWrap, { backgroundColor: theme.colors.tertiary }]}>
                <DollarIcon width={20} height={20} stroke={theme.colors.gray900} />
              </View>
              <View style={styles.textBlock}>
                <Text variant="caption" weight="medium" color={theme.colors.gray600}>{t('home_order_amount')}</Text>
                <Text variant="label" weight="semiBold" color={theme.colors.gray900}>${safeOrderAmount.toFixed(2)}</Text>
              </View>
            </View>
          </View>
          <View style={styles.metaCell}>
            <View style={styles.iconTextRow}>
              <View style={[styles.greenIconWrap, { backgroundColor: theme.colors.tertiary }]}>
                <ClockIcon width={20} height={20} stroke={theme.colors.gray900} />
              </View>
              <View style={styles.textBlock}>
                <Text variant="caption" weight="medium" color={theme.colors.gray600}>{t('order_time')}</Text>
                <Text variant="label" weight="semiBold" color={theme.colors.gray900}>{safeTime}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={[styles.divider, { borderTopColor: theme.colors.gray200 }]} />

        <View style={styles.row}>
          <View style={styles.topCell}>
            <Text variant="caption" weight="medium" color={theme.colors.gray600}>{t('home_payment_status')}</Text>
            <Text variant="label" weight="semiBold" color={theme.colors.gray900}>{safePaymentMethod}</Text>
          </View>
          <View style={styles.topCell}>
            <Text variant="caption" weight="medium" color={theme.colors.gray600}>{t('home_payment_status')}</Text>
            <View style={[styles.badge, { backgroundColor: paymentBadge.bg }]}>
              <Text variant="caption" weight="medium" color={paymentBadge.text}>{safePaymentStatus}</Text>
            </View>
          </View>
        </View>

        {safeComment ? (
          <>
            <View style={styles.divider} />
            <View style={[styles.commentCard, { backgroundColor: theme.colors.gray100 }]}>
              <Text variant="caption" weight="medium" color={theme.colors.gray600}>{t('home_comment')}</Text>
              <Text variant="label" style={styles.italic} weight="semiBold" color={theme.colors.gray900}>{safeComment}</Text>
            </View>
          </>
        ) : null}

        {showAction ? (
          <>
            <Button
              label={buttonLabel}
              onPress={handleActionPress}
              disabled={isAssigning || !order.orderId}
              containerStyle={styles.button}
              textColor={theme.colors.gray900}
            />
          </>
        ) : null}
      </View>
      <Modal
        transparent
        animationType="fade"
        visible={assignErrorModalVisible}
        onRequestClose={() => setAssignErrorModalVisible(false)}
      >
        <View style={[styles.modalBackdrop, { backgroundColor: theme.colors.modalBackdrop }]}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.gray200 },
            ]}
          >
            <Text weight="semiBold" style={[styles.modalTitle, { color: theme.colors.gray900 }]}>
              {t('order_assign_failed_title')}
            </Text>
            <Text variant="caption" color={theme.colors.gray700}>
              {assignErrorModalMessage || t('order_assign_failed_fallback')}
            </Text>
            <Button
              label={t('order_assign_failed_close')}
              onPress={() => setAssignErrorModalVisible(false)}
              containerStyle={styles.modalButton}
              textColor={theme.colors.gray900}
            />
          </View>
        </View>
      </Modal>
    </Pressable>
  );
}

type LocationRowProps = {
  kind: LocationKind;
  label: string;
  value: string;
  mapLabel: string;
  themeColor: ThemeColors;
};

function LocationRow({ kind, label, value, mapLabel, themeColor }: LocationRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.locationBlock}>
        <View style={[styles.greenIconWrap, { backgroundColor: themeColor.tertiary }]}>
          {kind === 'pickup'
            ? <PickupLocationIcon width={20} height={20} stroke={themeColor.gray900} />
            : <HomeIcon width={20} height={20} stroke={themeColor.gray900} />}
        </View>
        <View style={styles.textBlock}>
          <Text variant="caption" weight="medium" color={themeColor.gray600}>{label}</Text>
          <Text variant="label" weight="semiBold" color={themeColor.gray900}>{value}</Text>
        </View>
      </View>
      <View style={[styles.mapButton, { borderColor: themeColor.gray200, backgroundColor: themeColor.surface }]}>
        <MapSvgIcon width={16} height={16} stroke={themeColor.gray900} />
        <Text variant="caption" color={themeColor.gray600}>{mapLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    gap: 10,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  topCell: {
    flex: 1,
    gap: 1,
    alignItems: 'flex-start',
  },
  iconTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  badge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  divider: {
    borderTopWidth: 1,
  },
  storeBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  textBlock: {
    flex: 1,
    gap: 1,
  },
  storeImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
  },
  chatButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  greenIconWrap: {
    padding: 8,
    borderRadius: 6,
  },
  mapButton: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-end',
  },
  distanceIcon: {
    width: 14,
    height: 14,
  },
  metaCell: {
    flex: 1,
    gap: 2,
  },
  italic: {
    fontStyle: 'italic',
  },
  commentCard: {
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  button: {
    height: 44,
    borderRadius: 40,
    marginTop: 4,
  },
  modalBackdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  modalTitle: {
    fontSize: 18,
    lineHeight: 24,
  },
  modalButton: {
    marginTop: 4,
    height: 42,
    borderRadius: 30,
  },
});
