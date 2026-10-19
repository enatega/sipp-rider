import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslations } from '../localization/LocalizationProvider';
import { useAppTheme } from '../theme/ThemeProvider';
import Text from './Text';

type Props = {
  visible: boolean;
  onContinue: () => void;
  onNotNow: () => void;
};

export default function RiderLocationDisclosureModal({ visible, onContinue, onNotNow }: Props) {
  const { theme } = useAppTheme();
  const { t } = useTranslations('app');

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onNotNow}
      statusBarTranslucent
    >
      <View style={[styles.overlay, { backgroundColor: theme.colors.modalBackdrop }]}>
        <View
          accessibilityViewIsModal
          style={[styles.dialog, { backgroundColor: theme.colors.surface }]}
        >
          <ScrollView contentContainerStyle={styles.content} bounces={false}>
            <Text variant="subtitle" weight="bold" color={theme.colors.gray900}>
              {t('order_location_disclosure_title')}
            </Text>
            <Text variant="body" color={theme.colors.gray700} style={styles.description}>
              {t('order_location_disclosure_body')}
            </Text>
            <Text variant="label" color={theme.colors.gray700} style={styles.description}>
              {t('order_location_disclosure_control')}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={onContinue}
              style={[styles.action, { backgroundColor: theme.colors.primary }]}
            >
              <Text variant="body" weight="semiBold" color={theme.colors.gray900}>
                {t('order_location_disclosure_continue')}
              </Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={onNotNow} style={styles.action}>
              <Text variant="body" weight="semiBold" color={theme.colors.gray700}>
                {t('order_location_disclosure_not_now')}
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  dialog: {
    borderRadius: 16,
    maxHeight: '85%',
    overflow: 'hidden',
  },
  content: {
    padding: 24,
  },
  description: {
    marginTop: 16,
  },
  action: {
    alignItems: 'center',
    borderRadius: 12,
    justifyContent: 'center',
    minHeight: 48,
    marginTop: 20,
    paddingHorizontal: 16,
  },
});
