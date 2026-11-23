import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Text from '../../../components/Text';
import Button from '../../../components/Button';
import TextInput from '../../../components/TextInput';
import { useAppTheme } from '../../../theme/ThemeProvider';
import { useTranslations } from '../../../localization/LocalizationProvider';
import { useRiderDocumentDraft } from '../../../hooks/useRiderDocumentDraft';
import ProfileBottomSheetBase from './ProfileBottomSheetBase';
import DocumentImagePickerModal from './DocumentImagePickerModal';
import DocumentUploadRow from './DocumentUploadRow';
import DocumentImageViewerModal from './DocumentImageViewerModal';

/** Only the fields the rider actually changed, so untouched documents are never re-uploaded. */
export type DocumentFormValues = { number?: string; frontUri?: string; backUri?: string };

type Props = {
  visible: boolean;
  onClose: () => void;
  title: string;
  numberLabel: string;
  numberPlaceholder: string;
  initialNumber?: string;
  initialFrontImageUri?: string | null;
  initialBackImageUri?: string | null;
  isSubmitting: boolean;
  errorMessage?: string;
  onSubmit: (values: DocumentFormValues) => Promise<void>;
  onEdit?: () => void;
};

/**
 * Shared "number + front/back photos" form for the driving license and vehicle plate sheets.
 * Mount it only while open so the draft baseline reflects the profile at that moment.
 */
export default function DocumentFormSheet({
  visible, onClose, title, numberLabel, numberPlaceholder, initialNumber, initialFrontImageUri, initialBackImageUri,
  isSubmitting, errorMessage, onSubmit, onEdit,
}: Props) {
  const { theme } = useAppTheme();
  const { t } = useTranslations('app');
  const draft = useRiderDocumentDraft({ number: initialNumber, front: initialFrontImageUri, back: initialBackImageUri });
  const { number, setNumber, picker } = draft;
  const [previewImageUri, setPreviewImageUri] = useState<string | null>(null);
  const [isViewerVisible, setViewerVisible] = useState(false);
  const isSubmitDisabled = isSubmitting || !draft.isDirty || !draft.isValid;

  const submit = async () => {
    if (isSubmitDisabled) return;
    await onSubmit({ number: draft.changedNumber, frontUri: draft.changedFront, backUri: draft.changedBack });
  };

  const openPreview = (uri: string | null) => {
    if (!uri) return;
    setPreviewImageUri(uri);
    setViewerVisible(true);
  };

  const uploadRow = (side: 'front' | 'back') => (
    <DocumentUploadRow
      label={t(side === 'front' ? 'profile_front_image' : 'profile_back_image')}
      imageUri={side === 'front' ? picker.frontUri : picker.backUri}
      onPress={() => picker.openPickerModalFor(side)}
      onPreview={() => openPreview(side === 'front' ? picker.frontUri : picker.backUri)}
      uploadedLabel={t('profile_uploaded')}
      missingLabel={t('profile_missing_data')}
      emptyLabel={t('profile_tap_to_upload')}
      changeLabel={t('profile_change_photo')}
    />
  );

  return (
    <ProfileBottomSheetBase visible={visible} onClose={onClose} title={title}>
      <View style={styles.content}>
        <View style={styles.field}>
          <Text variant="label" weight="semiBold" color={theme.colors.gray700}>{numberLabel}</Text>
          <TextInput
            value={number}
            onChangeText={(value) => { setNumber(value); onEdit?.(); }}
            placeholder={numberPlaceholder}
            accessibilityLabel={numberLabel}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={100}
            editable={!isSubmitting}
            returnKeyType="done"
          />
        </View>

        <View style={styles.field}>
          <Text variant="label" weight="semiBold" color={theme.colors.gray700}>{t('profile_add_registration_document')}</Text>
          <View style={styles.uploadRow}>
            {uploadRow('front')}
            {uploadRow('back')}
          </View>
        </View>

        {errorMessage ? (
          <View accessibilityRole="alert" style={[styles.notice, { backgroundColor: theme.colors.red100 }]}>
            <Feather name="alert-circle" size={16} color={theme.colors.red800} />
            <Text variant="caption" color={theme.colors.red800} style={styles.noticeText}>{errorMessage}</Text>
          </View>
        ) : !draft.isValid ? (
          <Text variant="caption" color={theme.colors.gray500}>{t('profile_document_number_hint')}</Text>
        ) : null}

        <Button
          label={isSubmitting ? t('profile_updating_documents') : t('profile_save')}
          onPress={submit}
          disabled={isSubmitDisabled}
          textColor={theme.colors.black}
          containerStyle={styles.saveButton}
        />
      </View>

      <DocumentImagePickerModal
        visible={picker.isPickerModalVisible}
        onClose={picker.closePickerModal}
        onPickFromCamera={picker.pickFromCamera}
        onPickFromGallery={picker.pickFromGallery}
      />
      <DocumentImageViewerModal visible={isViewerVisible} imageUri={previewImageUri} onClose={() => setViewerVisible(false)} />
    </ProfileBottomSheetBase>
  );
}

const styles = StyleSheet.create({
  content: { gap: 18 },
  field: { gap: 8 },
  uploadRow: { flexDirection: 'row', gap: 12 },
  notice: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, padding: 12 },
  noticeText: { flex: 1 },
  saveButton: { height: 54, borderRadius: 14 },
});
