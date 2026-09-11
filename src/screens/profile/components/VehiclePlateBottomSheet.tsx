import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Text from '../../../components/Text';
import Button from '../../../components/Button';
import TextInput from '../../../components/TextInput';
import { useAppTheme } from '../../../theme/ThemeProvider';
import { useTranslations } from '../../../localization/LocalizationProvider';
import { useDualDocumentImagePicker } from '../../../hooks/useDualDocumentImagePicker';
import { useUpdateRiderDocumentsMutation } from '../../../hooks/useRiderDocumentsMutations';
import ProfileBottomSheetBase from './ProfileBottomSheetBase';
import DocumentImagePickerModal from './DocumentImagePickerModal';
import DocumentUploadRow from './DocumentUploadRow';
import DocumentImageViewerModal from './DocumentImageViewerModal';

type Props = {
  visible: boolean;
  onClose: () => void;
  initialVehicleNo?: string;
  initialFrontImageUri?: string | null;
  initialBackImageUri?: string | null;
};

export default function VehiclePlateBottomSheet({
  visible,
  onClose,
  initialVehicleNo,
  initialFrontImageUri,
  initialBackImageUri,
}: Props) {
  const { theme } = useAppTheme();
  const { t } = useTranslations('app');
  const [vehicleNo, setVehicleNo] = useState(initialVehicleNo ?? '');
  const [successMessage, setSuccessMessage] = useState('');
  const [previewImageUri, setPreviewImageUri] = useState<string | null>(null);
  const [isViewerVisible, setViewerVisible] = useState(false);
  const picker = useDualDocumentImagePicker({
    initialFrontUri: initialFrontImageUri,
    initialBackUri: initialBackImageUri,
  });
  const updateDocumentsMutation = useUpdateRiderDocumentsMutation();

  useEffect(() => {
    if (initialVehicleNo) {
      setVehicleNo(initialVehicleNo);
    }
  }, [initialVehicleNo]);

  const isSubmitDisabled =
    updateDocumentsMutation.isPending ||
    !vehicleNo.trim() ||
    !picker.frontUri ||
    !picker.backUri;

  const onSubmit = async () => {
    if (isSubmitDisabled) return;

    try {
      const response = await updateDocumentsMutation.mutateAsync({
        vehicleNo: vehicleNo.trim(),
        vehicleRegistrationFrontUri: picker.frontUri ?? undefined,
        vehicleRegistrationBackUri: picker.backUri ?? undefined,
      });
      setSuccessMessage(response.message || t('profile_documents_updated'));
      onClose();
    } catch {
      setSuccessMessage('');
    }
  };

  const openPreview = (uri: string | null) => {
    if (!uri) return;
    setPreviewImageUri(uri);
    setViewerVisible(true);
  };

  return (
    <ProfileBottomSheetBase visible={visible} onClose={onClose} title={t('profile_vehicle_plate')}>
      <View style={styles.content}>
        <FieldLabel label={t('profile_plate_no')} />
        <TextInput
          value={vehicleNo}
          onChangeText={(value) => {
            setVehicleNo(value);
            setSuccessMessage('');
          }}
          placeholder={t('profile_plate_no_value')}
          autoCapitalize="characters"
          autoCorrect={false}
          containerStyle={styles.inputWrapper}
        />

        <FieldLabel label={t('profile_add_registration_document')} />
        <DocumentUploadRow
          label={t('profile_front_image')}
          imageUri={picker.frontUri}
          onPress={() => picker.openPickerModalFor('front')}
          onPreview={() => openPreview(picker.frontUri)}
          uploadedLabel={t('profile_uploaded')}
          missingLabel={t('profile_missing_data')}
        />
        <DocumentUploadRow
          label={t('profile_back_image')}
          imageUri={picker.backUri}
          onPress={() => picker.openPickerModalFor('back')}
          onPreview={() => openPreview(picker.backUri)}
          uploadedLabel={t('profile_uploaded')}
          missingLabel={t('profile_missing_data')}
        />

        {updateDocumentsMutation.error?.message ? (
          <Text variant="caption" color={theme.colors.red500}>
            {updateDocumentsMutation.error.message}
          </Text>
        ) : null}

        {successMessage ? (
          <Text variant="caption" color={theme.colors.emerald900}>
            {successMessage}
          </Text>
        ) : null}

        <View style={[styles.footerDivider, { backgroundColor: theme.colors.gray200 }]} />

        <Button
          label={
            updateDocumentsMutation.isPending ? t('profile_updating_documents') : t('profile_save')
          }
          onPress={onSubmit}
          disabled={isSubmitDisabled}
          textColor={theme.colors.gray900}
          containerStyle={styles.saveButton}
        />
      </View>

      <DocumentImagePickerModal
        visible={picker.isPickerModalVisible}
        onClose={picker.closePickerModal}
        onPickFromCamera={picker.pickFromCamera}
        onPickFromGallery={picker.pickFromGallery}
      />
      <DocumentImageViewerModal
        visible={isViewerVisible}
        imageUri={previewImageUri}
        onClose={() => setViewerVisible(false)}
      />
    </ProfileBottomSheetBase>
  );
}

function FieldLabel({ label }: { label: string }) {
  const { theme } = useAppTheme();
  return (
    <Text weight="semiBold" style={[styles.label, { color: theme.colors.gray600 }]}>
      {label}
    </Text>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 12,
    paddingBottom: 14,
  },
  label: {
    fontSize: 14,
    lineHeight: 18,
  },
  inputWrapper: {
    minHeight: 42,
  },
  footerDivider: {
    height: 1,
    marginTop: 2,
    marginBottom: 10,
  },
  saveButton: {
    height: 54,
    borderRadius: 32,
  },
});
