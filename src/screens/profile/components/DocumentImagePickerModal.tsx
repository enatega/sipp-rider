import React from 'react';
import { Modal, Pressable, StyleSheet } from 'react-native';
import Text from '../../../components/Text';
import { useTranslations } from '../../../localization/LocalizationProvider';
import { useAppTheme } from '../../../theme/ThemeProvider';

type Props = {
  visible: boolean;
  onClose: () => void;
  onPickFromCamera: () => void;
  onPickFromGallery: () => void;
};

export default function DocumentImagePickerModal({
  visible,
  onClose,
  onPickFromCamera,
  onPickFromGallery,
}: Props) {
  const { theme } = useAppTheme();
  const { t } = useTranslations('app');

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={[styles.modalCard, { backgroundColor: theme.colors.surface }]} onPress={() => {}}>
          <Text weight="semiBold" style={[styles.modalTitle, { color: theme.colors.gray900 }]}>
            {t('profile_upload_document')}
          </Text>

          <Pressable style={[styles.modalOption, { borderColor: theme.colors.gray300 }]} onPress={onPickFromCamera}>
            <Text style={{ color: theme.colors.gray900 }}>{t('profile_take_photo')}</Text>
          </Pressable>

          <Pressable style={[styles.modalOption, { borderColor: theme.colors.gray300 }]} onPress={onPickFromGallery}>
            <Text style={{ color: theme.colors.gray900 }}>{t('profile_choose_from_gallery')}</Text>
          </Pressable>

          <Pressable onPress={onClose}>
            <Text weight="medium" style={{ color: theme.colors.blue400 }}>
              {t('profile_cancel')}
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
    padding: 16,
  },
  modalCard: {
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  modalTitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  modalOption: {
    borderWidth: 1,
    borderRadius: 8,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
