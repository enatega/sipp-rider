import React, { useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import Text from '../Text';
import { useAppTheme } from '../../theme/ThemeProvider';

type Props = {
  value: string;
  onChange: (value: string) => void;
  length: number;
  accessibilityLabel: string;
  hasError?: boolean;
  editable?: boolean;
  onComplete?: (value: string) => void;
};

/**
 * One box per digit, backed by a single hidden input so paste and the
 * platform's one-time-code autofill both work.
 */
export default function ResetCodeInput({ value, onChange, length, accessibilityLabel, hasError = false, editable = true, onComplete }: Props) {
  const { theme } = useAppTheme();
  const inputRef = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);

  const handleChange = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, length);
    onChange(digits);
    if (digits.length === length) onComplete?.(digits);
  };

  return (
    <Pressable onPress={() => inputRef.current?.focus()} accessible={false} style={styles.row}>
      {Array.from({ length }, (_, index) => {
        const active = focused && index === Math.min(value.length, length - 1);
        const borderColor = hasError ? theme.colors.red500 : active ? theme.colors.loginAccent : theme.colors.gray200;
        return (
          <View key={index} style={[styles.box, { backgroundColor: theme.colors.surface, borderColor }]}>
            <Text weight="bold" color={theme.colors.gray900} style={styles.digit}>{value[index] ?? ''}</Text>
          </View>
        );
      })}
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        editable={editable}
        autoFocus
        maxLength={length}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete={Platform.OS === 'android' ? 'sms-otp' : 'one-time-code'}
        accessibilityLabel={accessibilityLabel}
        caretHidden
        style={styles.hiddenInput}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12, justifyContent: 'center' },
  box: { flex: 1, maxWidth: 68, height: 64, borderWidth: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  digit: { fontSize: 24, lineHeight: 30 },
  hiddenInput: { position: 'absolute', width: '100%', height: '100%', opacity: 0 },
});
