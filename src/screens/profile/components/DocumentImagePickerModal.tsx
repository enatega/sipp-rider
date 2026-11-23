import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Text from '../../../components/Text';
import { useTranslations } from '../../../localization/LocalizationProvider';
import { useAppTheme } from '../../../theme/ThemeProvider';

type Props = {
  visible: boolean;
  onClose: () => void;
  onPickFromCamera: () => void;
  onPickFromGallery: () => void;
};

type Option = { key: string; icon: 'camera' | 'image'; label: string; onPress: () => void };

export default function DocumentImagePickerModal({ visible, onClose, onPickFromCamera, onPickFromGallery }: Props) {
  const { theme } = useAppTheme();
  const { t } = useTranslations('app');
  const insets = useSafeAreaInsets();
  const options: Option[] = [
    { key: 'camera', icon: 'camera', label: t('profile_take_photo'), onPress: onPickFromCamera },
    { key: 'gallery', icon: 'image', label: t('profile_choose_from_gallery'), onPress: onPickFromGallery },
  ];

  return (
    <Modal transparent animationType="slide" statusBarTranslucent navigationBarTranslucent visible={visible} onRequestClose={onClose}>
      <Pressable style={[styles.backdrop, { backgroundColor: theme.colors.modalBackdrop }]} onPress={onClose}>
        <Pressable style={[styles.card, { backgroundColor: theme.colors.surface, paddingBottom: Math.max(insets.bottom, 16) }]} onPress={() => {}}>
          <View style={[styles.handle, { backgroundColor: theme.colors.gray300 }]} />
          <Text weight="bold" color={theme.colors.gray900} style={styles.title}>{t('profile_upload_document')}</Text>
          {options.map((option) => (
            <Pressable
              key={option.key}
              accessibilityRole="button"
              onPress={option.onPress}
              style={({ pressed }) => [styles.option, { borderColor: theme.colors.gray200, backgroundColor: pressed ? theme.colors.gray100 : theme.colors.surface }]}
            >
              <View style={[styles.iconTile, { backgroundColor: theme.colors.primarySoft }]}>
                <Feather name={option.icon} size={20} color={theme.colors.brandInk} />
              </View>
              <Text weight="medium" color={theme.colors.gray900} style={styles.optionLabel}>{option.label}</Text>
              <Feather name="chevron-right" size={18} color={theme.colors.gray500} />
            </Pressable>
          ))}
          <Pressable accessibilityRole="button" onPress={onClose} style={styles.cancel}>
            <Text weight="semiBold" color={theme.colors.gray700}>{t('profile_cancel')}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  card: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 10, gap: 10 },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, marginBottom: 8 },
  title: { fontSize: 18, lineHeight: 26, marginBottom: 4 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderRadius: 16, padding: 12 },
  iconTile: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  optionLabel: { flex: 1 },
  cancel: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },
});
