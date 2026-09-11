import React, { useEffect, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
      onSuccess: () => closeOffer(currentAlert.orderId),
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

  return (
    <Modal transparent animationType="fade" visible statusBarTranslucent>
      <SafeAreaView
        style={[styles.backdrop, { backgroundColor: theme.colors.modalBackdrop }]}
      >
        <View
          style={[
            styles.card,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.primary },
          ]}
        >
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
                {currentAlert.storeName || t('manual_assignment_message')}
              </Text>
              <Button
                label={t('manual_assignment_dismiss')}
                onPress={() => dismissAssignment(currentAlert.orderId)}
                containerStyle={styles.fullButton}
                textColor={theme.colors.gray900}
              />
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
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  card: {
    borderRadius: 18,
    borderWidth: 2,
    gap: 12,
    padding: 20,
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
});
