import React, { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, type TextInput as RNTextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Text from '../../components/Text';
import Button from '../../components/Button';
import TextInput from '../../components/TextInput';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useTranslations } from '../../localization/LocalizationProvider';
import { MainStackParamList } from '../../navigation/types';
import { useUpdateRiderPasswordMutation } from '../../hooks/useRiderProfileMutations';
import ProfileScreenHeader from './components/ProfileScreenHeader';

type Navigation = NativeStackNavigationProp<MainStackParamList>;

export default function UpdatePasswordScreen() {
  const { theme } = useAppTheme();
  const { t } = useTranslations('app');
  const navigation = useNavigation<Navigation>();
  const updatePasswordMutation = useUpdateRiderPasswordMutation();
  const [previousPassword, setPreviousPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [hasTouchedConfirm, setHasTouchedConfirm] = useState(false);
  const newPasswordRef = useRef<RNTextInput>(null);
  const confirmPasswordRef = useRef<RNTextInput>(null);

  const isMismatch = hasTouchedConfirm && confirmPassword.length > 0 && confirmPassword !== newPassword;
  const canSubmit = Boolean(
    previousPassword.trim() && newPassword.trim() && confirmPassword && confirmPassword === newPassword && !updatePasswordMutation.isPending,
  );

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Home', { screen: 'ProfileTab' });
    }
  };

  const onFieldChange = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    updatePasswordMutation.reset();
  };

  const onSubmit = async () => {
    if (!canSubmit) return;
    try {
      await updatePasswordMutation.mutateAsync({
        previous_password: previousPassword.trim(),
        new_password: newPassword.trim(),
      });
      handleBack();
    } catch {
      // Mutation error is displayed from state.
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top', 'bottom']}>
      <ProfileScreenHeader title={t('profile_password')} onBackPress={handleBack} />

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={styles.flex} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={[styles.iconTile, { backgroundColor: theme.colors.primarySoft }]}>
            <Feather name="lock" size={24} color={theme.colors.brandInk} />
          </View>
          <View style={styles.intro}>
            <Text weight="bold" color={theme.colors.gray900} style={styles.title}>{t('profile_update_password_title')}</Text>
            <Text color={theme.colors.gray600}>{t('profile_update_password_subtitle')}</Text>
          </View>

          <View style={styles.field}>
            <Text variant="label" weight="semiBold" color={theme.colors.gray700}>{t('profile_old_password_label')}</Text>
            <TextInput
              placeholder={t('profile_old_password_placeholder')}
              value={previousPassword}
              onChangeText={onFieldChange(setPreviousPassword)}
              isPassword
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="password"
              returnKeyType="next"
              onSubmitEditing={() => newPasswordRef.current?.focus()}
            />
          </View>
          <View style={styles.field}>
            <Text variant="label" weight="semiBold" color={theme.colors.gray700}>{t('profile_new_password_label')}</Text>
            <TextInput
              inputRef={newPasswordRef}
              placeholder={t('profile_new_password_placeholder')}
              value={newPassword}
              onChangeText={onFieldChange(setNewPassword)}
              isPassword
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="newPassword"
              returnKeyType="next"
              onSubmitEditing={() => confirmPasswordRef.current?.focus()}
            />
          </View>
          <View style={styles.field}>
            <Text variant="label" weight="semiBold" color={theme.colors.gray700}>{t('profile_confirm_password_label')}</Text>
            <TextInput
              inputRef={confirmPasswordRef}
              placeholder={t('profile_confirm_password_placeholder')}
              value={confirmPassword}
              onChangeText={onFieldChange(setConfirmPassword)}
              onBlur={() => setHasTouchedConfirm(true)}
              error={isMismatch ? t('profile_password_mismatch') : undefined}
              isPassword
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="newPassword"
              returnKeyType="done"
              onSubmitEditing={() => void onSubmit()}
            />
          </View>
        </ScrollView>

        <View style={[styles.footer, { borderTopColor: theme.colors.gray200, backgroundColor: theme.colors.background }]}>
          {updatePasswordMutation.error?.message ? (
            <View accessibilityRole="alert" style={[styles.notice, { backgroundColor: theme.colors.red100 }]}>
              <Feather name="alert-circle" size={16} color={theme.colors.red800} />
              <Text variant="caption" color={theme.colors.red800} style={styles.noticeText}>{updatePasswordMutation.error.message}</Text>
            </View>
          ) : null}
          <Button
            label={t('profile_update_password_button')}
            onPress={onSubmit}
            disabled={!canSubmit}
            textColor={theme.colors.black}
            containerStyle={styles.updateButton}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24, gap: 18 },
  iconTile: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  intro: { gap: 6 },
  title: { fontSize: 24, lineHeight: 32 },
  field: { gap: 8 },
  footer: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, gap: 10, borderTopWidth: StyleSheet.hairlineWidth },
  notice: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, padding: 12 },
  noticeText: { flex: 1 },
  updateButton: { height: 54, borderRadius: 14 },
});
