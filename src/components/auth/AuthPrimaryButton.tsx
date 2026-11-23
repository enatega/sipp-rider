import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Text from '../Text';
import { useAppTheme } from '../../theme/ThemeProvider';
import { layout } from '../../theme/layout';

type Props = {
  label: string;
  loadingLabel?: string;
  loading?: boolean;
  disabled?: boolean;
  onPress: () => void;
};

/** Full-width accent button used for the main action on auth screens. */
export default function AuthPrimaryButton({ label, loadingLabel, loading = false, disabled = false, onPress }: Props) {
  const { theme } = useAppTheme();
  const inactive = loading || disabled;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: theme.colors.primary },
        (pressed || inactive) && styles.muted,
      ]}
    >
      <Text weight="bold" color={theme.colors.onPrimary} style={styles.label}>
        {loading && loadingLabel ? loadingLabel : label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { minHeight: layout.control.buttonMinHeight, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  label: { fontSize: 16, lineHeight: 22 },
  muted: { opacity: 0.7 },
});
