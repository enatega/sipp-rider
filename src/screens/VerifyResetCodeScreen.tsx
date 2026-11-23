import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Text } from '../components';
import AuthScreenLayout from '../components/auth/AuthScreenLayout';
import AuthPrimaryButton from '../components/auth/AuthPrimaryButton';
import ResetCodeInput from '../components/auth/ResetCodeInput';
import { useTranslations } from '../localization/LocalizationProvider';
import { useAppTheme } from '../theme/ThemeProvider';
import {
  getResetCodeCooldownSeconds,
  useSendResetCodeMutation,
  useVerifyResetCodeMutation,
} from '../hooks/useForgotPasswordMutations';
import { usePasswordResetErrorMessage } from '../hooks/usePasswordResetErrorMessage';
import { useResendCountdown } from '../hooks/useResendCountdown';
import { RESET_CODE_LENGTH } from '../auth/credentialRules';
import type { AuthStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'VerifyResetCode'>;

const formatCountdown = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

export default function VerifyResetCodeScreen({ navigation, route }: Props) {
  const { email, resendAfterSeconds } = route.params;
  const { t } = useTranslations('app');
  const { theme } = useAppTheme();
  const errorMessage = usePasswordResetErrorMessage();
  const verifyMutation = useVerifyResetCodeMutation();
  const resendMutation = useSendResetCodeMutation();
  const countdown = useResendCountdown(resendAfterSeconds);
  const [code, setCode] = useState('');
  const [resent, setResent] = useState(false);

  const verify = (value: string) => {
    if (verifyMutation.isPending || value.length !== RESET_CODE_LENGTH) return;
    verifyMutation.mutate({ email, otp: value }, {
      // Replace so going back never lands on an already-used code.
      onSuccess: (data) => navigation.replace('ResetPassword', { email, resetToken: data.resetToken }),
    });
  };

  const handleCodeChange = (value: string) => {
    setCode(value);
    if (verifyMutation.isError) verifyMutation.reset();
  };

  const resend = () => {
    if (!countdown.canResend || resendMutation.isPending) return;
    setResent(false);
    resendMutation.mutate({ email }, {
      onSuccess: (data) => {
        countdown.restart(data.resendAfterSeconds);
        handleCodeChange('');
        setResent(true);
      },
      onError: (error) => {
        const cooldown = getResetCodeCooldownSeconds(error);
        if (cooldown !== null) countdown.restart(cooldown);
      },
    });
  };

  const resendError = getResetCodeCooldownSeconds(resendMutation.error) === null ? errorMessage(resendMutation.error) : '';
  const error = errorMessage(verifyMutation.error) || resendError;

  const subtitle = (
    <Text color={theme.colors.gray600} style={styles.subtitle}>
      {t('verify_subtitle', { length: RESET_CODE_LENGTH })}{' '}
      <Text weight="semiBold" color={theme.colors.gray900} style={styles.subtitle}>{email}</Text>
    </Text>
  );

  return (
    <AuthScreenLayout title={t('verify_title')} subtitle={subtitle} icon="mail" onBack={() => navigation.goBack()}>
      <ResetCodeInput
        value={code}
        onChange={handleCodeChange}
        onComplete={verify}
        length={RESET_CODE_LENGTH}
        hasError={verifyMutation.isError}
        editable={!verifyMutation.isPending}
        accessibilityLabel={t('verify_code_label')}
      />

      {error ? <Text variant="caption" color={theme.colors.red500} style={styles.center}>{error}</Text> : null}
      {resent && !error ? <Text variant="caption" color={theme.colors.green600} style={styles.center}>{t('verify_code_resent')}</Text> : null}

      <AuthPrimaryButton
        label={t('verify_submit')}
        loadingLabel={t('verify_submitting')}
        loading={verifyMutation.isPending}
        disabled={code.length !== RESET_CODE_LENGTH}
        onPress={() => verify(code)}
      />

      <View style={styles.resendRow}>
        <Text color={theme.colors.gray600}>{t('verify_no_code')}</Text>
        {countdown.canResend ? (
          <Pressable onPress={resend} disabled={resendMutation.isPending} accessibilityRole="button" hitSlop={8}>
            <Text weight="semiBold" color={theme.colors.loginAccent}>
              {resendMutation.isPending ? t('forgot_sending_code') : t('verify_resend')}
            </Text>
          </Pressable>
        ) : (
          <Text weight="semiBold" color={theme.colors.gray500}>
            {t('verify_resend_in', { time: formatCountdown(countdown.secondsLeft) })}
          </Text>
        )}
      </View>

      <Pressable onPress={() => navigation.goBack()} accessibilityRole="button" hitSlop={8} style={styles.changeEmail}>
        <Text weight="semiBold" color={theme.colors.gray900}>{t('verify_change_email')}</Text>
      </Pressable>
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  subtitle: { fontSize: 15, lineHeight: 22 },
  center: { textAlign: 'center' },
  resendRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 6 },
  changeEmail: { alignSelf: 'center', minHeight: 44, justifyContent: 'center' },
});
