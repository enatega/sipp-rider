import React, { useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Text } from '../components';
import AuthScreenLayout from '../components/auth/AuthScreenLayout';
import AuthTextField from '../components/auth/AuthTextField';
import AuthPrimaryButton from '../components/auth/AuthPrimaryButton';
import { useTranslations } from '../localization/LocalizationProvider';
import { useAppTheme } from '../theme/ThemeProvider';
import { getResetCodeCooldownSeconds, useSendResetCodeMutation } from '../hooks/useForgotPasswordMutations';
import { usePasswordResetErrorMessage } from '../hooks/usePasswordResetErrorMessage';
import { isValidEmail } from '../auth/credentialRules';
import type { AuthStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

export default function ForgotPasswordScreen({ navigation, route }: Props) {
  const { t } = useTranslations('app');
  const { theme } = useAppTheme();
  const errorMessage = usePasswordResetErrorMessage();
  const sendMutation = useSendResetCodeMutation();
  const [email, setEmail] = useState(route.params?.email ?? '');
  const [emailError, setEmailError] = useState('');

  // A cooldown means a code was sent moments ago, so the user goes straight
  // to entering it rather than seeing an error.
  const serverError = getResetCodeCooldownSeconds(sendMutation.error) === null ? errorMessage(sendMutation.error) : '';

  const handleSubmit = () => {
    if (sendMutation.isPending) return;
    const normalized = email.trim().toLowerCase();
    if (!normalized) return setEmailError(t('auth_email_required'));
    if (!isValidEmail(normalized)) return setEmailError(t('auth_email_invalid'));
    setEmailError('');

    sendMutation.mutate({ email: normalized }, {
      onSuccess: (data) => navigation.navigate('VerifyResetCode', { email: normalized, resendAfterSeconds: data.resendAfterSeconds }),
      onError: (error) => {
        const cooldown = getResetCodeCooldownSeconds(error);
        if (cooldown !== null) navigation.navigate('VerifyResetCode', { email: normalized, resendAfterSeconds: cooldown });
      },
    });
  };

  return (
    <AuthScreenLayout title={t('forgot_title')} subtitle={t('forgot_subtitle')} icon="key" onBack={() => navigation.goBack()}>
      <AuthTextField
        label={t('auth_email_placeholder')}
        icon="mail"
        value={email}
        onChangeText={(value) => {
          setEmail(value);
          if (emailError) setEmailError('');
          if (sendMutation.isError) sendMutation.reset();
        }}
        error={emailError}
        placeholder={t('auth_email_placeholder')}
        keyboardType="email-address"
        autoComplete="email"
        textContentType="emailAddress"
        autoCapitalize="none"
        autoCorrect={false}
        autoFocus={!email}
        returnKeyType="send"
        onSubmitEditing={handleSubmit}
      />

      {serverError ? <Text variant="caption" color={theme.colors.red500}>{serverError}</Text> : null}

      <AuthPrimaryButton
        label={t('forgot_send_code')}
        loadingLabel={t('forgot_sending_code')}
        loading={sendMutation.isPending}
        onPress={handleSubmit}
      />
    </AuthScreenLayout>
  );
}
