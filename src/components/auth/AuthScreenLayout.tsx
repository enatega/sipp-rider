import React, { useEffect, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import AuthIcon, { AuthIconName } from './AuthIcon';
import { SafeAreaView } from 'react-native-safe-area-context';
import Text from '../Text';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useTranslations } from '../../localization/LocalizationProvider';

type Props = {
  title: string;
  subtitle: React.ReactNode;
  icon: AuthIconName;
  onBack: () => void;
  children: React.ReactNode;
};

/** Shared frame for the password recovery screens, styled like Login. */
export default function AuthScreenLayout({ title, subtitle, icon, onBack, children }: Props) {
  const { theme } = useAppTheme();
  const { t } = useTranslations('app');
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => { show.remove(); hide.remove(); };
  }, []);

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.colors.background }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <View style={styles.header}>
              <Pressable
                onPress={onBack}
                accessibilityRole="button"
                accessibilityLabel={t('auth_go_back')}
                hitSlop={8}
                style={({ pressed }) => [styles.backButton, { borderColor: theme.colors.gray200, backgroundColor: theme.colors.surface }, pressed && styles.pressed]}
              >
                <AuthIcon name="chevron-left" size={22} color={theme.colors.gray900} />
              </Pressable>
              <Text weight="bold" color={theme.colors.loginAccent} style={styles.wordmark}>{t('auth_brand_name')}</Text>
            </View>

            {!keyboardVisible ? (
              <View style={[styles.iconBadge, { backgroundColor: theme.colors.sky100 }]}>
                <AuthIcon name={icon} size={28} color={theme.colors.loginAccent} />
              </View>
            ) : null}

            <View style={styles.intro}>
              <Text weight="bold" color={theme.colors.gray900} style={styles.title} accessibilityRole="header">{title}</Text>
              {typeof subtitle === 'string'
                ? <Text color={theme.colors.gray600} style={styles.subtitle}>{subtitle}</Text>
                : subtitle}
            </View>

            <View style={styles.form}>{children}</View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 30 },
  content: { width: '100%', maxWidth: 460, alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  backButton: { width: 44, height: 44, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.7 },
  wordmark: { fontSize: 25, lineHeight: 32, letterSpacing: -0.7 },
  iconBadge: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginTop: 32 },
  intro: { marginTop: 24, gap: 8 },
  title: { fontSize: 30, lineHeight: 37, letterSpacing: -0.7 },
  subtitle: { fontSize: 15, lineHeight: 22 },
  form: { marginTop: 28, gap: 18 },
});
