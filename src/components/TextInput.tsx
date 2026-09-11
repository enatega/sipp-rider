import React, { useState } from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  TextInput as RNTextInput,
  TextInputProps as RNTextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { useAppTheme } from '../theme/ThemeProvider';
import { lightColors } from '../theme/colors';
import Text from './Text';

type Props = RNTextInputProps & {
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
  isPassword?: boolean;
};

export default function TextInput({
  error,
  containerStyle,
  isPassword = false,
  secureTextEntry,
  style,
  ...rest
}: Props) {
  const { theme } = useAppTheme();
  const [passwordVisible, setPasswordVisible] = useState(false);

  const isSecure = isPassword ? !passwordVisible : secureTextEntry;

  return (
    <View style={[styles.wrapper, containerStyle]}>
      <View
        style={[
          styles.inputContainer,
          {
            borderColor: error ? theme.colors.red500 : theme.colors.border,
            backgroundColor: theme.colors.surface,
          },
        ]}
      >
        <RNTextInput
          style={[styles.input, { color: theme.colors.text }, style]}
          placeholderTextColor={theme.colors.mutedText}
          secureTextEntry={isSecure}
          {...rest}
        />

        {isPassword ? (
          <Pressable
            onPress={() => setPasswordVisible((v) => !v)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={passwordVisible ? 'Hide password' : 'Show password'}
          >
            <EyeIcon visible={passwordVisible} color={theme.colors.gray500} />
          </Pressable>
        ) : null}
      </View>

      {error ? (
        <Text variant="caption" color={theme.colors.red500} style={styles.errorText}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

function EyeIcon({ visible, color }: { visible: boolean; color: string }) {
  return (
    <View style={styles.eyeIcon}>
      <View style={[styles.eyeOuter, { borderColor: color }]} />
      <View style={[styles.eyePupil, { backgroundColor: color }]} />
      {!visible ? <View style={[styles.eyeSlash, { backgroundColor: color }]} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 17,
    paddingVertical: 9,
    gap: 6,
    shadowColor: lightColors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  input: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    minHeight: 24,
    padding: 0,
    margin: 0,
  },
  errorText: {
    marginTop: 2,
  },
  eyeIcon: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyeOuter: {
    width: 16,
    height: 10,
    borderRadius: 8,
    borderWidth: 1.5,
    position: 'absolute',
  },
  eyePupil: {
    width: 5,
    height: 5,
    borderRadius: 3,
    position: 'absolute',
  },
  eyeSlash: {
    width: 1.5,
    height: 20,
    borderRadius: 1,
    position: 'absolute',
    transform: [{ rotate: '45deg' }],
  },
});
