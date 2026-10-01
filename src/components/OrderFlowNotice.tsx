import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../theme/ThemeProvider';
import Text from './Text';

type Props = {
  visible: boolean;
  title: string;
  message: string;
  orderCode?: string;
  actionLabel: string;
  closeLabel?: string;
  tone?: 'success' | 'error';
  onAction: () => void;
  onClose: () => void;
};

export default function OrderFlowNotice({ visible, title, message, orderCode, actionLabel, closeLabel, tone = 'success', onAction, onClose }: Props) {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: theme.colors.modalBackdrop, paddingBottom: Math.max(insets.bottom, 16) + 12 }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel={closeLabel || actionLabel} />
        <View style={[styles.card, { backgroundColor: theme.colors.surface, shadowColor: theme.colors.shadow }]}>
          <View style={[styles.icon, { backgroundColor: tone === 'error' ? theme.colors.gray50 : theme.colors.green50 }]}>
            <Feather name={tone === 'error' ? 'alert-circle' : 'check'} size={25} color={tone === 'error' ? theme.colors.red500 : theme.colors.green600} />
          </View>
          {orderCode ? <Text variant="caption" weight="semiBold" color={theme.colors.gray600} style={styles.code}>#{orderCode.replace(/^#/, '')}</Text> : null}
          <Text variant="subtitle" weight="bold" color={theme.colors.gray900} style={styles.title}>{title}</Text>
          <Text variant="label" color={theme.colors.gray600} style={styles.message}>{message}</Text>
          <Pressable onPress={onAction} accessibilityRole="button" style={[styles.button, { backgroundColor: theme.colors.primary }]}>
            <Text variant="label" weight="bold" color={theme.colors.gray900}>{actionLabel}</Text>
            <Feather name="arrow-right" size={18} color={theme.colors.gray900} />
          </Pressable>
          {closeLabel ? <Pressable onPress={onClose} accessibilityRole="button" style={styles.close}>
            <Text variant="label" weight="semiBold" color={theme.colors.gray600}>{closeLabel}</Text>
          </Pressable> : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', paddingHorizontal: 16 },
  card: { width: '100%', maxWidth: 480, alignSelf: 'center', borderRadius: 20, padding: 22, shadowOpacity: 0.16, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
  icon: { width: 50, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  code: { marginTop: 14 },
  title: { marginTop: 5 },
  message: { marginTop: 7, lineHeight: 21 },
  button: { minHeight: 50, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, marginTop: 22 },
  close: { minHeight: 46, alignItems: 'center', justifyContent: 'center', marginTop: 5 },
});
