import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Text from '../../../components/Text';
import { useAppTheme } from '../../../theme/ThemeProvider';

type Props = {
  visible: boolean;
  title: string;
  subtitle: string;
  onClose: () => void;
};

export default function WithdrawSuccessModal({ visible, title, subtitle, onClose }: Props) {
  const { theme } = useAppTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.gray300 }]}>
          <Pressable onPress={onClose} accessibilityRole="button" style={styles.closeButton}>
            <Text style={[styles.closeIcon, { color: theme.colors.gray900 }]}>{'⊗'}</Text>
          </Pressable>

          <Text style={styles.emoji}>{'💰'}</Text>
          <Text weight="bold" style={[styles.title, { color: theme.colors.gray900 }]}>
            {title}
          </Text>
          <Text style={[styles.subtitle, { color: '#374151' }]}>{subtitle}</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(17, 17, 17, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
    alignItems: 'center',
  },
  closeButton: {
    alignSelf: 'flex-end',
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    fontSize: 26,
    lineHeight: 26,
  },
  emoji: {
    fontSize: 74,
    lineHeight: 78,
    textAlign: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    lineHeight: 28,
    textAlign: 'center',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },
});
