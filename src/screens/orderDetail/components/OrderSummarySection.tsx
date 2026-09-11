import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Text from '../../../components/Text';
import { RiderOrderDetail } from '../../../api/riderOrderDetailTypes';
import { useAppTheme } from '../../../theme/ThemeProvider';
import { useTranslations } from '../../../localization/LocalizationProvider';

type Props = {
  order: RiderOrderDetail;
};

export default function OrderSummarySection({ order }: Props) {
  const { theme } = useAppTheme();
  const { t } = useTranslations('app');

  return (
    <View style={styles.container}>
      <View style={styles.rowBetween}>
        <Text weight="medium" color={theme.colors.gray600}>{t('home_order_id')}</Text>
        <Text weight="semiBold" color={theme.colors.gray900}>#{order.orderCode ?? order.orderId ?? '—'}</Text>
      </View>

      <View style={styles.storeRow}>
        {order.storeImage ? (
          <Image source={{ uri: order.storeImage }} style={styles.image} />
        ) : (
          <View style={[styles.image, { backgroundColor: theme.colors.gray100 }]} />
        )}
        <Text variant="subtitle" weight="bold" color={theme.colors.gray900}>
          {order.storeName ?? '—'}
        </Text>
      </View>

      <View style={styles.pickupRow}>
        <Text weight="semiBold" color={theme.colors.gray500}>{t('home_pickup')}</Text>
        <Text weight="bold" color={theme.colors.gray900}>{order.pickupAddress ?? '—'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 18,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  storeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  image: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  pickupRow: {
    gap: 4,
  },
});
