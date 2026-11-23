import React from 'react';
import { StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import Text from '../../../components/Text';
import { formatCountdown } from '../../../hooks/useAssignmentCancelCountdown';
import { formatDistanceMeters } from '../../../location/routeProgress';
import { useAppTheme } from '../../../theme/ThemeProvider';

interface Props {
  status: 'arrived' | 'delivered';
  radiusMeters: number;
  distanceMeters: number | null;
  secondsUntilUnlock: number;
}

/** Explains why "Arrived" or "Delivered" is disabled and what unlocks it first. */
export default function DeliveryLockNotice({ status, radiusMeters, distanceMeters, secondsUntilUnlock }: Props) {
  const { theme } = useAppTheme();
  const { t } = useTranslation();
  const values = {
    radius: formatDistanceMeters(radiusMeters),
    distance: distanceMeters !== null ? formatDistanceMeters(distanceMeters) : '',
    time: formatCountdown(secondsUntilUnlock),
  };

  return (
    <Text variant="label" color={theme.colors.gray600} style={styles.notice}>
      {status === 'arrived'
        ? t(distanceMeters !== null ? 'order_arrival_locked_with_distance' : 'order_arrival_locked', values)
        : t(distanceMeters !== null ? 'order_delivery_locked_with_distance' : 'order_delivery_locked', values)}
    </Text>
  );
}

const styles = StyleSheet.create({
  notice: { textAlign: 'center', marginBottom: 8 },
});
