import React, { useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Text } from '../components';
import AuthScreenLayout from '../components/auth/AuthScreenLayout';
import AuthTextField from '../components/auth/AuthTextField';
import AuthPrimaryButton from '../components/auth/AuthPrimaryButton';
import PasswordRequirements from '../components/auth/PasswordRequirements';
import { useTranslations } from '../localization/LocalizationProvider';
import { useAppTheme } from '../theme/ThemeProvider';
import { useResetPasswordMutation } from '../hooks/useForgotPasswordMutations';
import { usePasswordResetErrorMessage } from '../hooks/usePasswordResetErrorMessage';
import { meetsPasswordRules } from '../auth/credentialRules';
import type { AuthStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'ResetPassword'>;

export default function ResetPasswordScreen({ navigation, route }: Props) {
  const { email, resetToken } = route.params;
  const { t } = useTranslations('app');
  const { theme } = useAppTheme();
  const errorMessage = usePasswordResetErrorMessage();
  const resetMutation = useResetPasswordMutation();
  const confirmRef = useRef<TextInput>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');

  const validate = () => {
    const nextPasswordError = !password
      ? t('auth_password_required')
      : meetsPasswordRules(password) ? '' : t('reset_password_rules_error');
    const nextConfirmError = !confirm
      ? t('reset_confirm_required')
      : confirm === password ? '' : t('reset_password_mismatch');
    setPasswordError(nextPasswordError);
    setConfirmError(nextConfirmError);
    return !nextPasswordError && !nextConfirmError;
  };

  const handleSubmit = () => {
    if (resetMutation.isPending || !validate()) return;
    resetMutation.mutate({ resetToken, password }, {
      onSuccess: () => navigation.reset({ index: 0, routes: [{ name: 'Login', params: { notice: 'password_reset', email } }] }),
    });
  };

  // The token is single-use and expires after 15 minutes; a 400 here means
  // the user has to start over with a fresh code.
  const tokenRejected = resetMutation.error?.status === 400;

  return (
    <AuthScreenLayout title={t('reset_title')} subtitle={t('reset_subtitle')} icon="lock" onBack={() => navigation.goBack()}>
      <AuthTextField
        label={t('reset_new_password')}
        icon="lock"
        value={password}
        onChangeText={(value) => { setPassword(value); if (passwordError) setPasswordError(''); }}
        error={passwordError}
        placeholder={t('reset_new_password')}
        isPassword
        autoComplete="new-password"
        textContentType="newPassword"
        autoCapitalize="none"
        autoCorrect={false}
        autoFocus
        returnKeyType="next"
        onSubmitEditing={() => confirmRef.current?.focus()}
      />
      <PasswordRequirements password={password} />

      <AuthTextField
        ref={confirmRef}
        label={t('reset_confirm_password')}
        icon="lock"
        value={confirm}
        onChangeText={(value) => { setConfirm(value); if (confirmError) setConfirmError(''); }}
        error={confirmError}
        placeholder={t('reset_confirm_password')}
        isPassword
        autoComplete="new-password"
        textContentType="newPassword"
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="done"
        onSubmitEditing={handleSubmit}
      />

      {resetMutation.error ? (
        <Text variant="caption" color={theme.colors.red500}>{errorMessage(resetMutation.error)}</Text>
      ) : null}

      <AuthPrimaryButton
        label={t('reset_submit')}
        loadingLabel={t('reset_submitting')}
        loading={resetMutation.isPending}
        onPress={handleSubmit}
      />

      {tokenRejected ? (
        <Pressable onPress={() => navigation.popTo('ForgotPassword', { email })} accessibilityRole="button" hitSlop={8} style={styles.restart}>
          <Text weight="semiBold" color={theme.colors.brandInk}>{t('reset_request_new_code')}</Text>
        </Pressable>
      ) : null}
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  restart: { alignSelf: 'center', minHeight: 44, justifyContent: 'center' },
});
