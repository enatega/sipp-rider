import React from 'react';
import { StyleSheet, View } from 'react-native';
import Text from '../../../components/Text';
import { useAppTheme } from '../../../theme/ThemeProvider';
import { useTranslations } from '../../../localization/LocalizationProvider';

const KNOWN_STATUSES = ['approved', 'rejected', 'pending', 'requested', 'canceled', 'transfered'];

export default function WithdrawalStatus({ status }: { status: string }) {
  const { theme } = useAppTheme();
  const { t } = useTranslations('app');
  const value = status.toLowerCase();
  const isApproved = ['approved', 'transferred', 'transfered'].includes(value);
  const isRejected = ['rejected', 'cancelled', 'canceled'].includes(value);
  const key = value === 'cancelled' ? 'canceled' : value === 'transferred' ? 'transfered' : value;
  const tone = isApproved
    ? { background: theme.colors.green50, foreground: theme.colors.green600 }
    : isRejected
      ? { background: theme.colors.red100, foreground: theme.colors.red800 }
      : { background: theme.colors.amber100, foreground: theme.colors.amber800 };

  return (
    <View style={[styles.chip, { backgroundColor: tone.background }]}>
      <View style={[styles.dot, { backgroundColor: tone.foreground }]} />
      <Text variant="caption" weight="semiBold" color={tone.foreground}>
        {KNOWN_STATUSES.includes(key) ? t(`wallet_request_${key}`) : status}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
