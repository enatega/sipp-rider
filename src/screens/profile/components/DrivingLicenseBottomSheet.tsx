import React from 'react';
import { useTranslations } from '../../../localization/LocalizationProvider';
import { useUpdateRiderDocumentsMutation } from '../../../hooks/useRiderDocumentsMutations';
import DocumentFormSheet, { type DocumentFormValues } from './DocumentFormSheet';

type Props = {
  visible: boolean;
  onClose: () => void;
  initialLicenseNumber?: string;
  initialFrontImageUri?: string | null;
  initialBackImageUri?: string | null;
};

export default function DrivingLicenseBottomSheet({ visible, onClose, initialLicenseNumber, initialFrontImageUri, initialBackImageUri }: Props) {
  const { t } = useTranslations('app');
  const mutation = useUpdateRiderDocumentsMutation();

  const onSubmit = async ({ number, frontUri, backUri }: DocumentFormValues) => {
    try {
      await mutation.mutateAsync({
        licenseNumber: number,
        driverLicenseFrontUri: frontUri,
        driverLicenseBackUri: backUri,
      });
      onClose();
    } catch {
      // Error surfaced through mutation state.
    }
  };

  return (
    <DocumentFormSheet
      visible={visible}
      onClose={onClose}
      title={t('profile_driving_license')}
      numberLabel={t('profile_license_no')}
      numberPlaceholder={t('profile_license_no')}
      initialNumber={initialLicenseNumber}
      initialFrontImageUri={initialFrontImageUri}
      initialBackImageUri={initialBackImageUri}
      isSubmitting={mutation.isPending}
      errorMessage={mutation.error?.message}
      onSubmit={onSubmit}
      onEdit={mutation.reset}
    />
  );
}
