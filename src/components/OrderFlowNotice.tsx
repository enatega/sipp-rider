import React, { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../theme/ThemeProvider';
import Text from './Text';

type Props = {
  visible: boolean;
  title: string;
  orderCode?: string;
  actionLabel?: string;
  tone?: 'success' | 'error';
  placement?: 'top' | 'bottom';
  onAction?: () => void;
  onClose: () => void;
};

export default function OrderFlowNotice({ visible, title, orderCode, actionLabel, tone = 'success', placement = 'bottom', onAction, onClose }: Props) {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => {
    if (!visible) return;
    const timeout = setTimeout(() => onCloseRef.current(), 3500);
    return () => clearTimeout(timeout);
  }, [visible, title, orderCode]);

  if (!visible) return null;
  const accent = tone === 'error' ? theme.colors.red500 : theme.colors.green600;
  const code = orderCode?.replace(/^#/, '');
  return (
    <View pointerEvents="box-none" style={[styles.overlay, placement === 'top' ? { top: 8 } : { bottom: Math.max(insets.bottom, 8) + 8 }]}>
      <View style={[styles.notice, { backgroundColor: theme.colors.surface, shadowColor: theme.colors.shadow }]} accessibilityRole="alert">
        <Feather name={tone === 'error' ? 'alert-circle' : 'check-circle'} size={20} color={accent} />
        <View style={styles.copy}>
          <Text variant="label" weight="semiBold" color={theme.colors.gray900} numberOfLines={2}>{title}</Text>
          {code ? <Text variant="caption" color={theme.colors.gray600}>#{code}</Text> : null}
        </View>
        {actionLabel && onAction ? (
          <Pressable onPress={onAction} accessibilityRole="button" style={styles.action}>
            <Text variant="label" weight="semiBold" color={theme.colors.gray900}>{actionLabel}</Text>
          </Pressable>
        ) : null}
        <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel={actionLabel ?? title} hitSlop={8} style={styles.dismiss}>
          <Feather name="x" size={18} color={theme.colors.gray600} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', left: 16, right: 16, zIndex: 20, alignItems: 'center' },
  notice: { width: '100%', maxWidth: 480, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13, flexDirection: 'row', alignItems: 'center', gap: 12, shadowOpacity: 0.16, shadowRadius: 14, shadowOffset: { width: 0, height: 5 }, elevation: 6 },
  copy: { flex: 1, gap: 2 },
  action: { minHeight: 44, paddingHorizontal: 4, justifyContent: 'center' },
  dismiss: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', marginRight: -6 },
});
