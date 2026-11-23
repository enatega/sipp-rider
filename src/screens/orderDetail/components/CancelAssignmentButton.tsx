import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Text from '../../../components/Text';
import { useAppTheme } from '../../../theme/ThemeProvider';

interface Props {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}

export default function CancelAssignmentButton({ label, onPress, disabled = false }: Props) {
  const { theme } = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={[styles.button, { borderColor: theme.colors.red500 }, disabled && styles.disabled]}
    >
      <Text variant="label" weight="semiBold" color={theme.colors.red500}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.5 },
});
