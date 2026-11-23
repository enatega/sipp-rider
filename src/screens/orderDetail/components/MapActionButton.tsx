import React, { type ReactNode } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Text from '../../../components/Text';
import { useAppTheme } from '../../../theme/ThemeProvider';

interface Props {
  label: string;
  onPress: () => void;
  icon?: ReactNode;
}

export default function MapActionButton({ label, onPress, icon }: Props) {
  const { theme } = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[styles.button, { backgroundColor: theme.colors.zinc800, shadowColor: theme.colors.shadow }]}
    >
      {icon}
      <Text variant="caption" weight="semiBold" color={theme.colors.white}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 40,
    borderRadius: 20,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
});
