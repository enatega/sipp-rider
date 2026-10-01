import React, { useEffect, useState } from 'react';
import { Alert, InteractionManager, Modal, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import Button from './Button';
import Text from './Text';
import {
  useAcceptOrderOfferMutation,
  useDeclineOrderOfferMutation,
} from '../hooks/useRiderHomeMutations';
import { useTranslations } from '../localization/LocalizationProvider';
import { useRiderOrderAlerts } from '../providers/RiderOrderAlertsProvider';
import { useAppTheme } from '../theme/ThemeProvider';
import { useAppCurrency } from '../hooks/useCurrency';
import { notificationNavigationRef } from '../navigation/notificationNavigation';

export default function IncomingOrderAlert() {
  const { theme } = useAppTheme();
  const { t } = useTranslations('app');
  const { formatCurrency } = useAppCurrency();
  const {
    alerts,
    currentAlert,
    closeOffer,
    dismissAssignment,
  } = useRiderOrderAlerts();
  const acceptOffer = useAcceptOrderOfferMutation();
  const declineOffer = useDeclineOrderOfferMutation();
  const [, setClock] = useState(Date.now());

  useEffect(() => {
    if (currentAlert?.kind !== 'offer') return undefined;
    const interval = setInterval(() => setClock(Date.now()), 250);
    return () => clearInterval(interval);
  }, [currentAlert]);

  if (!currentAlert) return null;

  const isOffer = currentAlert.kind === 'offer';
  const secondsRemaining = isOffer
    ? Math.max(0, Math.ceil((currentAlert.expiresAt - Date.now()) / 1_000))
    : 0;

  const accept = () => {
    if (!isOffer || acceptOffer.isPending) return;
    acceptOffer.mutate(currentAlert.orderId, {
      onSuccess: () => {
        closeOffer(currentAlert.orderId);
        const assignedOrder = { orderId: currentAlert.orderId, orderCode: currentAlert.orderCode, storeName: currentAlert.storeName };
        InteractionManager.runAfterInteractions(() => {
          if (notificationNavigationRef.isReady()) {
            notificationNavigationRef.navigate('Home', { screen: 'HomeTab', params: { assignedOrder } });
          }
        });
      },
      onError: (error) => {
        closeOffer(currentAlert.orderId);
        Alert.alert(
          t('offer_unavailable_title'),
          error.message || t('offer_unavailable_message'),
        );
      },
    });
  };

  const decline = () => {
    if (!isOffer) return;
    closeOffer(currentAlert.orderId);
    declineOffer.mutate(currentAlert.orderId);
  };

  const viewAssignment = () => {
    if (!currentAlert || currentAlert.kind !== 'assignment') return;
    const orderId = currentAlert.orderId;
    dismissAssignment(orderId);
    InteractionManager.runAfterInteractions(() => {
      if (!notificationNavigationRef.isReady()) return;
      notificationNavigationRef.navigate('Home', { screen: 'HomeTab', params: { preferredTab: 'processing' } });
      notificationNavigationRef.navigate('ProcessingOrderDetail', { orderId });
    });
  };

  const stayOnPickup = () => {
    if (!currentAlert || currentAlert.kind !== 'assignment') return;
    dismissAssignment(currentAlert.orderId);
    InteractionManager.runAfterInteractions(() => {
      if (notificationNavigationRef.isReady()) {
        notificationNavigationRef.navigate('Home', { screen: 'HomeTab', params: { preferredTab: 'processing' } });
      }
    });
  };

  return (
    <Modal transparent animationType="fade" visible statusBarTranslucent>
      <SafeAreaView
        style={[styles.backdrop, { backgroundColor: theme.colors.modalBackdrop }]}
      >
        <View
          style={[
            styles.card,
            { backgroundColor: theme.colors.surface, shadowColor: theme.colors.shadow },
          ]}
        >
          <View style={[styles.icon, { backgroundColor: theme.colors.sky100 }]}>
            <Feather name={isOffer ? 'package' : 'check'} size={25} color={theme.colors.sky600} />
          </View>
          <View style={styles.headerRow}>
            <Text weight="bold" style={[styles.title, { color: theme.colors.gray900 }]}>
              {isOffer ? t('offer_title') : t('manual_assignment_title')}
            </Text>
            <View style={[styles.countBadge, { backgroundColor: theme.colors.tertiary }]}>
              <Text weight="bold" color={theme.colors.gray900}>{alerts.length}</Text>
            </View>
          </View>

          <Text weight="semiBold" color={theme.colors.gray900}>
            {t('offer_order_id')}: #{currentAlert.orderCode}
          </Text>

          {isOffer ? (
            <>
              <Text color={theme.colors.gray700}>
                {t('offer_pickup')}: {currentAlert.storeName}
              </Text>
              <Text color={theme.colors.gray700}>
                {currentAlert.pickupAddress || t('status_unknown')}
              </Text>
              <Text color={theme.colors.gray700}>
                {t('offer_amount')}: {formatCurrency(currentAlert.orderAmount)}
              </Text>
              <Text weight="bold" style={[styles.expiry, { color: theme.colors.red500 }]}>
                {t('offer_expires_in')}: {secondsRemaining}s
              </Text>
              <View style={styles.actions}>
                <Pressable
                  accessibilityRole="button"
                  disabled={acceptOffer.isPending}
                  onPress={decline}
                  style={[styles.decline, { borderColor: theme.colors.gray300 }]}
                >
                  <Text weight="semiBold" color={theme.colors.gray900}>
                    {t('offer_decline')}
                  </Text>
                </Pressable>
                <Button
                  label={acceptOffer.isPending ? t('order_assigning') : t('offer_accept')}
                  onPress={accept}
                  disabled={acceptOffer.isPending || secondsRemaining === 0}
                  containerStyle={styles.accept}
                  textColor={theme.colors.gray900}
                />
              </View>
            </>
          ) : (
            <>
              <Text color={theme.colors.gray700}>
                {t('manual_assignment_message', { store: currentAlert.storeName || t('chat_store_name') })}
              </Text>
              <Button
                label={t('rider_flow_view_delivery')}
                onPress={viewAssignment}
                containerStyle={styles.fullButton}
                textColor={theme.colors.gray900}
              />
              <Pressable onPress={stayOnPickup} accessibilityRole="button" style={styles.laterButton}>
                <Text weight="semiBold" color={theme.colors.gray600}>{t('rider_flow_stay_pickup')}</Text>
              </Pressable>
            </>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  card: {
    borderRadius: 20,
    gap: 14,
    padding: 22,
    shadowOpacity: 0.16,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  icon: {
    width: 50,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 22,
    lineHeight: 30,
  },
  countBadge: {
    alignItems: 'center',
    borderRadius: 14,
    justifyContent: 'center',
    minHeight: 28,
    minWidth: 28,
  },
  expiry: {
    fontSize: 18,
    lineHeight: 24,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  decline: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
  },
  accept: {
    flex: 1,
    minHeight: 48,
  },
  fullButton: {
    minHeight: 48,
  },
  laterButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
