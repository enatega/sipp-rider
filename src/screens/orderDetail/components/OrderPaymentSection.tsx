import React from 'react';
import { StyleSheet, View } from 'react-native';
import Text from '../../../components/Text';
import { RiderOrderDetail } from '../../../api/riderOrderDetailTypes';
import { useAppTheme } from '../../../theme/ThemeProvider';
import { useTranslations } from '../../../localization/LocalizationProvider';

type Props = {
  order: RiderOrderDetail;
};

export default function OrderPaymentSection({ order }: Props) {
  const { theme } = useAppTheme();
  const { t } = useTranslations('app');

  return (
    <View style={styles.rowBetween}>
      <Text weight="medium" color={theme.colors.gray600}>{t('home_payment_method')}</Text>
      <Text weight="semiBold" color={theme.colors.gray900}>
        ${Number(order.orderAmount ?? 0).toFixed(1)}{' '}
        <Text color={theme.colors.gray500}>({order.paymentStatus ?? '—'})</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
