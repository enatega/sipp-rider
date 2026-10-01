import React, { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput as RNTextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { Text } from '../components';
import { useTranslations } from '../localization/LocalizationProvider';
import { useAppTheme } from '../theme/ThemeProvider';
import { useLoginMutation } from '../hooks/useAuthMutations';
import { useExpoPushToken } from '../hooks/useExpoPushToken';
import { layout } from '../theme/layout';

export default function LoginScreen() {
  const { t } = useTranslations('app');
  const { theme } = useAppTheme();
  const { height } = useWindowDimensions();
  const compact = height < 740;
  const loginMutation = useLoginMutation();
  const { getExpoPushToken, isLoading: isFetchingExpoPushToken } = useExpoPushToken();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const validate = (): boolean => {
    let valid = true;

    if (!email.trim()) {
      setEmailError(t('auth_email_required'));
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
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
    if (loginMutation.isPending || isFetchingExpoPushToken || !validate()) return;

    const devicePushToken = await getExpoPushToken();

    loginMutation.mutate({
      email: email.trim(),
      password,
      device_push_token: devicePushToken ?? undefined,
    });
  };

  const inputTextStyle = {
    fontSize: theme.typography.size.md,
    lineHeight: theme.typography.lineHeight.md,
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
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
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
            <View style={styles.field}>
              <Text weight="semiBold" color={theme.colors.gray900} style={styles.fieldLabel}>{t('auth_email_placeholder')}</Text>
              <View
                style={[
                  styles.inputWrap,
                  {
                    backgroundColor: theme.colors.white,
                    borderColor: emailError ? theme.colors.red500 : theme.colors.gray200,
                  },
                ]}
              >
                <EnvelopeIcon color={theme.colors.loginAccent} size={layout.icon.xl} />
                <RNTextInput
                  value={email}
                  onChangeText={(v) => {
                    setEmail(v);
                    if (emailError) setEmailError('');
                  }}
                  placeholder={t('auth_email_placeholder')}
                  placeholderTextColor={theme.colors.gray500}
                  keyboardType="email-address"
                  autoComplete="email"
                  textContentType="emailAddress"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  style={[styles.input, { color: theme.colors.gray900 }, inputTextStyle]}
                />
              </View>
              {emailError ? (
                <Text variant="caption" color={theme.colors.red500} style={styles.errorText}>
                  {emailError}
                </Text>
              ) : null}
            </View>

            <View style={styles.field}>
              <Text weight="semiBold" color={theme.colors.gray900} style={styles.fieldLabel}>{t('auth_password_placeholder')}</Text>
              <View
                style={[
                  styles.inputWrap,
                  {
                    backgroundColor: theme.colors.white,
                    borderColor: passwordError ? theme.colors.red500 : theme.colors.gray200,
                  },
                ]}
              >
                <LockIcon color={theme.colors.loginAccent} size={layout.icon.xl} />
                <RNTextInput
                  value={password}
                  onChangeText={(v) => {
                    setPassword(v);
                    if (passwordError) setPasswordError('');
                  }}
                  placeholder={t('auth_password_placeholder')}
                  placeholderTextColor={theme.colors.gray500}
                  autoComplete="password"
                  textContentType="password"
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                  secureTextEntry={!passwordVisible}
                  style={[styles.input, { color: theme.colors.gray900 }, inputTextStyle]}
                />
                <Pressable
                  onPress={() => setPasswordVisible((v) => !v)}
                  accessibilityRole="button"
                  accessibilityLabel={passwordVisible ? t('auth_hide_password') : t('auth_show_password')}
                  hitSlop={8}
                  style={styles.eyeButton}
                >
                  <EyeIcon visible={passwordVisible} color={theme.colors.gray500} size={layout.icon.lg} />
                </Pressable>
              </View>
              {passwordError ? (
                <Text variant="caption" color={theme.colors.red500} style={styles.errorText}>
                  {passwordError}
                </Text>
              ) : null}
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
  field: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 14,
    lineHeight: 20,
  },
  inputWrap: {
    minHeight: layout.control.inputMinHeight,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
  },
  input: {
    flex: 1,
    minHeight: 52,
    paddingVertical: 0,
  },
  eyeButton: { width: 40, height: 44, alignItems: 'center', justifyContent: 'center' },
  errorText: {
    marginTop: layout.spacing.xs,
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

function EnvelopeIcon({ color, size }: { color: string; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 7.5A2.5 2.5 0 0 1 5.5 5h13A2.5 2.5 0 0 1 21 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 16.5v-9Z" stroke={color} strokeWidth={2} />
      <Path d="m4 8 8 6 8-6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function LockIcon({ color, size }: { color: string; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M7 11V8a5 5 0 1 1 10 0v3" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M6.5 11h11A1.5 1.5 0 0 1 19 12.5v7a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19.5v-7A1.5 1.5 0 0 1 6.5 11Z" stroke={color} strokeWidth={2} />
      <Path d="M12 15.5v2.5" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function EyeIcon({ visible, color, size }: { visible: boolean; color: string; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6Z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z" stroke={color} strokeWidth={1.8} />
      {!visible ? <Path d="m4 4 16 16" stroke={color} strokeWidth={1.8} strokeLinecap="round" /> : null}
    </Svg>
  );
}
