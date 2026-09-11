import React from 'react';
import { Pressable, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import Text from './Text';
import { useAppTheme } from '../theme/ThemeProvider';

type ButtonVariant = 'primary' | 'secondary';

type Props = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  textColor?: string;
};

export default function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  containerStyle,
  textColor,
}: Props) {
  const { theme } = useAppTheme();

  const variantContainerStyle: ViewStyle = {
    backgroundColor:
      variant === 'primary'
        ? theme.colors.primary
        : theme.isDark
          ? theme.colors.surface
          : theme.colors.white,
    borderColor: variant === 'secondary' ? theme.colors.border : theme.colors.primary,
    borderWidth: variant === 'secondary' ? 1 : 0,
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.container,
        variantContainerStyle,
        containerStyle,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <Text
        variant="body"
        weight="semiBold"
        color={textColor ?? (variant === 'primary' ? theme.colors.white : theme.colors.text)}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.9,
  },
  disabled: {
    opacity: 0.5,
  },
});
