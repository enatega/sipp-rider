import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Text from './Text';
import { useTranslations } from '../localization/LocalizationProvider';
import { useRiderOrderAlerts } from '../providers/RiderOrderAlertsProvider';
import { useAppTheme } from '../theme/ThemeProvider';
import { notificationNavigationRef, queueOfferNotificationNavigation } from '../navigation/notificationNavigation';

export default function IncomingOrderAlert() {
  const { theme } = useAppTheme();
  const { t } = useTranslations('app');
  const insets = useSafeAreaInsets();
  const { alerts, dismissAssignment } = useRiderOrderAlerts();
  const [hiddenAlertKeys, setHiddenAlertKeys] = useState<Set<string>>(() => new Set());
  const hideAlert = (kind: string, orderId: string) => setHiddenAlertKeys((current) => new Set(current).add(`${kind}:${orderId}`));
  const activeAlert = alerts[alerts.length - 1];
  const visibleAlert = activeAlert && !hiddenAlertKeys.has(`${activeAlert.kind}:${activeAlert.orderId}`) ? activeAlert : null;

  useEffect(() => {
    if (!visibleAlert) return;
    const route = notificationNavigationRef.getCurrentRoute();
    const routeOrderId = (route?.params as { orderId?: string } | undefined)?.orderId;
    if (visibleAlert.kind === 'assignment' && route?.name === 'ProcessingOrderDetail' && routeOrderId === visibleAlert.orderId) {
      dismissAssignment(visibleAlert.orderId);
      return;
    }
    const timeout = setTimeout(() => hideAlert(visibleAlert.kind, visibleAlert.orderId), 6000);
    return () => clearTimeout(timeout);
  }, [visibleAlert?.orderId, dismissAssignment]);

  if (!visibleAlert) return null;

  const viewAssignment = () => {
    hideAlert(visibleAlert.kind, visibleAlert.orderId);
    if (visibleAlert.kind === 'offer') {
      queueOfferNotificationNavigation(visibleAlert.orderId, visibleAlert.orderCode);
      return;
    }
    dismissAssignment(visibleAlert.orderId);
    if (!notificationNavigationRef.isReady()) return;
    notificationNavigationRef.navigate('Home', { screen: 'HomeTab', params: { preferredTab: 'processing' } });
    notificationNavigationRef.navigate('ProcessingOrderDetail', { orderId: visibleAlert.orderId });
  };

  return (
    <View pointerEvents="box-none" style={[styles.bannerLayer, { top: insets.top + 8 }]}>
      <View style={[styles.banner, { backgroundColor: theme.colors.surface, shadowColor: theme.colors.shadow }]} accessibilityRole="alert">
        <Feather name="package" size={20} color={theme.colors.sky600} />
        <View style={styles.bannerCopy}>
          <Text variant="label" weight="semiBold" color={theme.colors.gray900} numberOfLines={2}>{t(visibleAlert.kind === 'offer' ? 'status_new_order' : 'manual_assignment_title')}</Text>
          <Text variant="caption" color={theme.colors.gray600} numberOfLines={1}>#{visibleAlert.orderCode.replace(/^#/, '')} · {visibleAlert.storeName || t('chat_store_name')}</Text>
        </View>
        <Pressable accessibilityRole="button" onPress={viewAssignment} style={styles.view}>
          <Text variant="label" weight="semiBold" color={theme.colors.gray900}>{t('rider_flow_view_delivery')}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={t('manual_assignment_dismiss')} hitSlop={8} onPress={() => hideAlert(visibleAlert.kind, visibleAlert.orderId)} style={styles.dismiss}>
          <Feather name="x" size={18} color={theme.colors.gray600} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bannerLayer: { position: 'absolute', left: 16, right: 16, zIndex: 30, alignItems: 'center' },
  banner: { width: '100%', maxWidth: 480, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 10, shadowOpacity: 0.16, shadowRadius: 14, shadowOffset: { width: 0, height: 5 }, elevation: 8 },
  bannerCopy: { flex: 1, minWidth: 0, gap: 2 },
  view: { minHeight: 44, justifyContent: 'center' },
  dismiss: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
});
