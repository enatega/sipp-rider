import React, { forwardRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import AuthIcon, { AuthIconName } from './AuthIcon';
import Text from '../Text';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useTranslations } from '../../localization/LocalizationProvider';
import { layout } from '../../theme/layout';

type Props = Omit<TextInputProps, 'style' | 'secureTextEntry'> & {
  label: string;
  icon: AuthIconName;
  error?: string;
  /** Renders a show/hide toggle and masks the value while hidden. */
  isPassword?: boolean;
};

/** Labelled input with a leading icon, used across the auth screens. */
const AuthTextField = forwardRef<TextInput, Props>(function AuthTextField(
  { label, icon, error, isPassword = false, onFocus, onBlur, ...inputProps },
  ref
) {
  const { theme } = useAppTheme();
  const { t } = useTranslations('app');
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  const borderColor = error ? theme.colors.red500 : focused ? theme.colors.loginAccent : theme.colors.gray200;

  return (
    <View style={styles.field}>
      <Text weight="semiBold" color={theme.colors.gray900} style={styles.label}>{label}</Text>
      <View style={[styles.inputWrap, { backgroundColor: theme.colors.white, borderColor }]}>
        <AuthIcon name={icon} size={layout.icon.xl} color={theme.colors.loginAccent} />
        <TextInput
          ref={ref}
          placeholderTextColor={theme.colors.gray500}
          {...inputProps}
          secureTextEntry={isPassword && !visible}
          onFocus={(event) => { setFocused(true); onFocus?.(event); }}
          onBlur={(event) => { setFocused(false); onBlur?.(event); }}
          style={[styles.input, { color: theme.colors.gray900, fontSize: theme.typography.size.md, lineHeight: theme.typography.lineHeight.md }]}
        />
        {isPassword ? (
          <Pressable
            onPress={() => setVisible((value) => !value)}
            accessibilityRole="button"
            accessibilityLabel={visible ? t('auth_hide_password') : t('auth_show_password')}
            hitSlop={8}
            style={styles.eyeButton}
          >
            <AuthIcon name={visible ? 'eye-off' : 'eye'} size={layout.icon.lg} color={theme.colors.gray500} />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text variant="caption" color={theme.colors.red500}>{error}</Text> : null}
    </View>
  );
});

export default AuthTextField;

const styles = StyleSheet.create({
  field: { gap: 8 },
  label: { fontSize: 14, lineHeight: 20 },
  inputWrap: { minHeight: layout.control.inputMinHeight, borderWidth: 1, borderRadius: 14, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 12 },
  input: { flex: 1, minHeight: 52, paddingVertical: 0 },
  eyeButton: { width: 40, height: 44, alignItems: 'center', justifyContent: 'center' },
});
