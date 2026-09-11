import React, { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput as RNTextInput,
  View,
} from 'react-native';
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
    if (!validate()) return;

    const devicePushToken = await getExpoPushToken();

    loginMutation.mutate({
      email: email.trim(),
      password,
      device_push_token: devicePushToken ?? undefined,
    });
  };

  const titleTextStyle = {
    fontSize: theme.typography.size.xl,
    lineHeight: theme.typography.lineHeight.xl,
  };

  const subtitleTextStyle = {
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.sm,
  };

  const inputTextStyle = {
    fontSize: theme.typography.size.md,
    lineHeight: theme.typography.lineHeight.md,
  };

  const buttonTextStyle = {
    fontSize: theme.typography.size.lg,
    lineHeight: theme.typography.lineHeight.lg,
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Image
            source={require('../assets/images/bikeImage.png')}
            style={styles.heroImage}
            resizeMode="contain"
          />

          <View style={[styles.brandBadge, { backgroundColor: theme.colors.gray100, shadowColor: theme.colors.shadow }]}>
            <ScooterIcon color={theme.colors.primary} size={layout.icon.xl} />
          </View>

          <View style={styles.headingWrap}>
            <View style={styles.titleRow}>
              <Text weight="bold" color={theme.colors.gray900} style={[styles.titlePart, titleTextStyle]}>
                Rider
              </Text>
              <Text weight="bold" color={theme.colors.primary} style={[styles.titlePart, titleTextStyle]}>
                {' '}Login
              </Text>
            </View>
            <Text weight="medium" color={theme.colors.gray600} style={[styles.subtitle, subtitleTextStyle]}>
              Welcome back! Please login to continue
            </Text>
          </View>

          <View style={styles.form}>
            <View>
              <View
                style={[
                  styles.inputWrap,
                  {
                    backgroundColor: theme.colors.white,
                    borderColor: theme.colors.gray200,
                    shadowColor: theme.colors.shadow,
                  },
                ]}
              >
                <EnvelopeIcon color={theme.colors.primary} size={layout.icon.xl} />
                <RNTextInput
                  value={email}
                  onChangeText={(v) => {
                    setEmail(v);
                    if (emailError) setEmailError('');
                  }}
                  placeholder={t('auth_email_placeholder')}
                  placeholderTextColor={theme.colors.gray500}
                  keyboardType="email-address"
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

            <View>
              <View
                style={[
                  styles.inputWrap,
                  {
                    backgroundColor: theme.colors.white,
                    borderColor: theme.colors.gray200,
                    shadowColor: theme.colors.shadow,
                  },
                ]}
              >
                <LockIcon color={theme.colors.primary} size={layout.icon.xl} />
                <RNTextInput
                  value={password}
                  onChangeText={(v) => {
                    setPassword(v);
                    if (passwordError) setPasswordError('');
                  }}
                  placeholder={t('auth_password_placeholder')}
                  placeholderTextColor={theme.colors.gray500}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                  secureTextEntry={!passwordVisible}
                  style={[styles.input, { color: theme.colors.gray900 }, inputTextStyle]}
                />
                <Pressable onPress={() => setPasswordVisible((v) => !v)} hitSlop={8}>
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
          style={({ pressed }) => [
            styles.loginButton,
            {
              backgroundColor: theme.colors.primary,
              shadowColor: theme.colors.primary,
              opacity: pressed ? 0.95 : 1,
            },
            loginMutation.isPending || isFetchingExpoPushToken ? styles.disabled : null,
          ]}
        >
          <Text weight="semiBold" color={theme.colors.white} style={[styles.loginButtonText, buttonTextStyle]}>
            {loginMutation.isPending || isFetchingExpoPushToken ? t('auth_login_loading') : t('auth_login')}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    minHeight: '100%',
    paddingHorizontal: layout.spacing.xl,
    paddingTop: layout.spacing.md,
    paddingBottom: layout.spacing.xxl,
  },
  content: {
    alignItems: 'center',
  },
  heroImage: {
    width: '100%',
    maxWidth: 520,
    height: layout.control.heroHeight,
    marginTop: layout.spacing.sm,
  },
  brandBadge: {
    width: layout.control.badgeSize,
    height: layout.control.badgeSize,
    borderRadius: layout.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: layout.shadow.softOffsetY },
    shadowOpacity: layout.shadow.softOpacity,
    shadowRadius: layout.shadow.softRadius,
    elevation: 2,
  },
  headingWrap: {
    alignItems: 'center',
    marginTop: layout.spacing.md,
    gap: layout.spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titlePart: {
    letterSpacing: -0.8,
  },
  subtitle: {
    textAlign: 'center',
  },
  form: {
    width: '100%',
    marginTop: layout.spacing.lg,
    gap: layout.spacing.lg,
  },
  inputWrap: {
    minHeight: layout.control.inputMinHeight,
    borderRadius: layout.radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: layout.spacing.lg,
    paddingVertical: layout.spacing.sm,
    gap: layout.spacing.sm,
    shadowOffset: { width: 0, height: layout.shadow.softOffsetY },
    shadowOpacity: layout.shadow.softOpacity,
    shadowRadius: layout.shadow.softRadius,
    elevation: 2,
  },
  input: {
    flex: 1,
    minHeight: 20,
    paddingVertical: 0,
  },
  errorText: {
    marginTop: layout.spacing.xs,
  },
  loginButton: {
    minHeight: layout.control.buttonMinHeight,
    borderRadius: layout.radius.pill,
    marginTop: layout.spacing.xl,
    marginBottom: layout.spacing.sm,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: layout.shadow.glowOffsetY },
    shadowOpacity: layout.shadow.glowOpacity,
    shadowRadius: layout.shadow.glowRadius,
    elevation: 8,
    position: 'relative',
  },
  loginButtonText: {
    textAlign: 'center',
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

function ScooterIcon({ color, size }: { color: string; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 16.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Zm12 0a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z" stroke={color} strokeWidth={1.8} />
      <Path d="M7.5 19h7.8l2.2-4.5H14l-2-5H9.5" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M11.8 8.2h2.6l1.8 4.3" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Path d="M6 19h2.6m8.8 0h-1.8" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
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
