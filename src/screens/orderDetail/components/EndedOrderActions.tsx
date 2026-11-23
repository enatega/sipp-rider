import React from 'react';
import { StyleSheet, View } from 'react-native';
import Text from '../../../components/Text';
import Button from '../../../components/Button';
import { useAppTheme } from '../../../theme/ThemeProvider';
import { useTranslations } from '../../../localization/LocalizationProvider';

export default function EndedOrderActions({ message, bottomInset, onBack }: { message: string; bottomInset: number; onBack: () => void }) {
  const { theme } = useAppTheme();
  const { t } = useTranslations('app');
  return <View style={[styles.container, { backgroundColor: theme.colors.surface, paddingBottom: Math.max(bottomInset, 12) + 12 }]}>
    <Text variant="label" color={theme.colors.gray900} style={styles.message}>{message}</Text>
    <Button label={t('order_back')} onPress={onBack} />
  </View>;
}
const styles = StyleSheet.create({ container: { padding: 16, gap: 16, borderTopLeftRadius: 24, borderTopRightRadius: 24 }, message: { textAlign: 'center' } });
