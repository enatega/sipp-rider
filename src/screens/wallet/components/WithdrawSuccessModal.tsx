import React from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Button from '../../../components/Button';
import Text from '../../../components/Text';
import { useAppTheme } from '../../../theme/ThemeProvider';

type Props = {
  visible: boolean;
  title: string;
  subtitle: string;
  doneLabel: string;
  onClose: () => void;
};

export default function WithdrawSuccessModal({ visible, title, subtitle, doneLabel, onClose }: Props) {
  const { theme } = useAppTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.backdrop, { backgroundColor: theme.colors.modalBackdrop }]}>
        <View accessibilityViewIsModal style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <View style={[styles.badge, { backgroundColor: theme.colors.green50 }]}>
            <Feather name="check" size={36} color={theme.colors.green600} />
          </View>
          <Text weight="bold" color={theme.colors.gray900} style={styles.title}>{title}</Text>
          <Text color={theme.colors.gray600} style={styles.subtitle}>{subtitle}</Text>
          <Button label={doneLabel} onPress={onClose} textColor={theme.colors.black} containerStyle={styles.button} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  card: { width: '100%', borderRadius: 24, padding: 24, alignItems: 'center', gap: 10 },
  badge: { width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  title: { fontSize: 20, lineHeight: 28, textAlign: 'center' },
  subtitle: { fontSize: 14, lineHeight: 22, textAlign: 'center' },
  button: { alignSelf: 'stretch', height: 52, borderRadius: 14, marginTop: 12 },
});
