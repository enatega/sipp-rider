import React from 'react';
import { useTranslations } from '../../../localization/LocalizationProvider';
import { useUpdateRiderDocumentsMutation } from '../../../hooks/useRiderDocumentsMutations';
import DocumentFormSheet, { type DocumentFormValues } from './DocumentFormSheet';

type Props = {
  visible: boolean;
  onClose: () => void;
  initialVehicleNo?: string;
  initialFrontImageUri?: string | null;
  initialBackImageUri?: string | null;
};

export default function VehiclePlateBottomSheet({ visible, onClose, initialVehicleNo, initialFrontImageUri, initialBackImageUri }: Props) {
  const { t } = useTranslations('app');
  const mutation = useUpdateRiderDocumentsMutation();

  const onSubmit = async ({ number, frontUri, backUri }: DocumentFormValues) => {
    try {
      await mutation.mutateAsync({
        vehicleNo: number,
        vehicleRegistrationFrontUri: frontUri,
        vehicleRegistrationBackUri: backUri,
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
      title={t('profile_vehicle_plate')}
      numberLabel={t('profile_plate_no')}
      numberPlaceholder={t('profile_plate_no')}
      initialNumber={initialVehicleNo}
      initialFrontImageUri={initialFrontImageUri}
      initialBackImageUri={initialBackImageUri}
      isSubmitting={mutation.isPending}
      errorMessage={mutation.error?.message}
      onSubmit={onSubmit}
      onEdit={mutation.reset}
    />
  );
}
