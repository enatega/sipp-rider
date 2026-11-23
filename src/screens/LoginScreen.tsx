import { useRememberedEmail } from '../hooks/useRememberedEmail';
import RememberEmailOption from '../components/RememberEmailOption';
import React, { useEffect, useRef, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Text } from '../components';
import { useTranslations } from '../localization/LocalizationProvider';
import { useAppTheme } from '../theme/ThemeProvider';
import { useLoginMutation } from '../hooks/useAuthMutations';
import { useExpoPushToken } from '../hooks/useExpoPushToken';
import { layout } from '../theme/layout';
import AuthTextField from '../components/auth/AuthTextField';
import AuthNotice from '../components/auth/AuthNotice';
import { isValidEmail } from '../auth/credentialRules';
import type { AuthStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({ navigation, route }: Props) {
  const { t } = useTranslations('app');
  const { theme } = useAppTheme();
  const { height } = useWindowDimensions();
  const compact = height < 740;
  const remembered = useRememberedEmail();
  const { email, setEmail } = remembered;
  const loginMutation = useLoginMutation({ onSuccess: (_data, variables) => remembered.save(variables.email) });
  const { getExpoPushToken, isLoading: isFetchingExpoPushToken } = useExpoPushToken();
  const passwordRef = useRef<TextInput>(null);
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const resetEmail = route.params?.email;
  const showResetNotice = route.params?.notice === 'password_reset' && !loginMutation.error;

  // After a password reset, prefill the account that was just recovered once
  // any remembered email has loaded, so it is not overwritten.
  useEffect(() => {
    if (remembered.isReady && resetEmail) setEmail(resetEmail);
  }, [remembered.isReady, resetEmail, setEmail]);

  const validate = (): boolean => {
    let valid = true;

    if (!email.trim()) {
      setEmailError(t('auth_email_required'));
      valid = false;
    } else if (!isValidEmail(email)) {
      setEmailError(t('auth_email_invalid'));
      valid = false;
    } else {
      setEmailError('');
    }

    if (!password) {
      setPasswordError(t('auth_password_required'));
      valid = false;
    } else {
      setPasswordError('');
    }

    return valid;
  };

  const handleLogin = async () => {
    if (!remembered.isReady || loginMutation.isPending || isFetchingExpoPushToken || !validate()) return;

    const devicePushToken = await getExpoPushToken();

    loginMutation.mutate({
      email: email.trim(),
      password,
      device_push_token: devicePushToken ?? undefined,
    });
  };

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: theme.colors.background }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
      <ScrollView
        contentContainerStyle={[styles.scrollContent, compact && styles.scrollContentCompact]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="none"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Text weight="bold" color={theme.colors.loginAccent} style={styles.brand}>{t('auth_brand_name')}</Text>
          <Image
            source={require('../assets/images/bikeImageBlue.png')}
            style={[styles.heroImage, compact && styles.heroImageCompact]}
            resizeMode="contain"
          />

          <View style={styles.headingWrap}>
            <Text weight="bold" color={theme.colors.gray900} style={styles.title}>
              {t('auth_rider_title')}
            </Text>
            <Text color={theme.colors.gray600} style={styles.subtitle}>
              {t('auth_rider_subtitle')}
            </Text>
          </View>

          <View style={styles.form}>
            {showResetNotice ? <AuthNotice message={t('auth_password_reset_success')} /> : null}

            <AuthTextField
              label={t('auth_email_placeholder')}
              icon="mail"
              editable={remembered.isReady}
              value={email}
              onChangeText={(v) => {
                setEmail(v);
                if (emailError) setEmailError('');
              }}
              error={emailError}
              placeholder={t('auth_email_placeholder')}
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
            />

            <AuthTextField
              ref={passwordRef}
              label={t('auth_password_placeholder')}
              icon="lock"
              value={password}
              onChangeText={(v) => {
                setPassword(v);
                if (passwordError) setPasswordError('');
              }}
              error={passwordError}
              placeholder={t('auth_password_placeholder')}
              isPassword
              autoComplete="password"
              textContentType="password"
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />

            <View style={styles.optionsRow}>
              <View style={styles.flex}>
                <RememberEmailOption checked={remembered.remember} disabled={!remembered.isReady || loginMutation.isPending} onPress={remembered.toggle} />
              </View>
              <Pressable
                onPress={() => navigation.navigate('ForgotPassword', { email: email.trim() || undefined })}
                disabled={loginMutation.isPending || isFetchingExpoPushToken}
                accessibilityRole="button"
                hitSlop={8}
                style={styles.forgotButton}
              >
                <Text weight="semiBold" color={theme.colors.loginAccent}>{t('auth_forgot_password')}</Text>
              </Pressable>
            </View>

            {loginMutation.error?.message ? (
              <Text variant="caption" color={theme.colors.red500}>
                {loginMutation.error.message}
              </Text>
            ) : null}
          </View>
        </View>

        <Pressable
          onPress={handleLogin}
          disabled={loginMutation.isPending || isFetchingExpoPushToken}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.loginButton,
            {
              backgroundColor: theme.colors.loginAccent,
              opacity: pressed ? 0.86 : 1,
            },
            loginMutation.isPending || isFetchingExpoPushToken ? styles.disabled : null,
          ]}
        >
          <Text weight="bold" color={theme.colors.gray900} style={styles.loginButtonText}>
            {loginMutation.isPending || isFetchingExpoPushToken ? t('auth_login_loading') : t('auth_login')}
          </Text>
        </Pressable>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 30,
  },
  scrollContentCompact: {
    paddingTop: 10,
    paddingBottom: 18,
  },
  content: {
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
  },
  brand: {
    fontSize: 25,
    lineHeight: 32,
    letterSpacing: -0.7,
  },
  heroImage: {
    width: '100%',
    height: 205,
    marginTop: 4,
  },
  heroImageCompact: {
    height: 145,
  },
  headingWrap: {
    marginTop: 12,
    gap: 6,
  },
  title: {
    fontSize: 30,
    lineHeight: 37,
    letterSpacing: -0.7,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  form: {
    width: '100%',
    marginTop: 28,
    gap: 18,
  },
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  forgotButton: {
    minHeight: 44,
    justifyContent: 'center',
  },
  loginButton: {
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
    minHeight: layout.control.buttonMinHeight,
    borderRadius: 14,
    marginTop: 26,
    marginBottom: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButtonText: {
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 22,
  },
  disabled: {
    opacity: 0.55,
  },
});
