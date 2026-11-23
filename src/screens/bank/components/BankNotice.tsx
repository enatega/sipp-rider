import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Text from '../../../components/Text';
import { useAppTheme } from '../../../theme/ThemeProvider';

type Props = { tone: 'success' | 'error'; message: string };

export default function BankNotice({ tone, message }: Props) {
  const { theme } = useAppTheme();
  const isSuccess = tone === 'success';
  const background = isSuccess ? theme.colors.green50 : theme.colors.red100;
  const foreground = isSuccess ? theme.colors.emerald900 : theme.colors.red800;
  return (
    <View accessibilityRole="alert" style={[styles.notice, { backgroundColor: background }]}>
      <Feather name={isSuccess ? 'check-circle' : 'alert-circle'} size={18} color={foreground} />
      <Text variant="caption" weight="medium" color={foreground} style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  notice: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12 },
  message: { flex: 1 },
});
