import React from 'react';
import { StyleSheet, View } from 'react-native';
import AuthIcon from './AuthIcon';
import Text from '../Text';
import { useAppTheme } from '../../theme/ThemeProvider';

/** Inline confirmation banner shown on auth screens (e.g. after a reset). */
export default function AuthNotice({ message }: { message: string }) {
  const { theme } = useAppTheme();

  return (
    <View accessibilityRole="alert" style={[styles.notice, { backgroundColor: theme.colors.green50 }]}>
      <AuthIcon name="check-circle" size={20} color={theme.colors.green600} />
      <Text variant="caption" weight="medium" color={theme.colors.green600} style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  notice: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 },
  text: { flex: 1 },
});
