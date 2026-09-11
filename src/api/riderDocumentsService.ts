import apiClient from './apiClient';
import type {
  UpdateRiderDocumentsPayload,
  UpdateRiderDocumentsResponse,
} from './riderDocumentsTypes';

const RIDER_DOCUMENTS_PATH = '/ride-vehicles/rider/documents';

type UploadField =
  | 'driver_license_front'
  | 'driver_license_back'
  | 'vehicle_registration_front'
  | 'vehicle_registration_back';

type ReactNativeFile = {
  uri: string;
  name: string;
  type: string;
};

const getFileNameFromUri = (uri: string): string => {
  const uriParts = uri.split('/');
  const lastPart = uriParts[uriParts.length - 1] || 'upload.jpg';
  return lastPart.includes('.') ? lastPart : `${lastPart}.jpg`;
};

const appendImageFile = (formData: FormData, key: UploadField, uri?: string) => {
  if (!uri) return;

  const fileName = getFileNameFromUri(uri);
  const file: ReactNativeFile = {
    uri,
    name: fileName,
    type: 'image/jpeg',
  };

  formData.append(key, file as unknown as Blob);
};

const toFormData = (payload: UpdateRiderDocumentsPayload): FormData => {
  const formData = new FormData();

  if (payload.licenseNumber) {
    formData.append('licenseNumber', payload.licenseNumber);
  }

  if (payload.vehicleNo) {
    formData.append('vehicle_no', payload.vehicleNo);
  }

  appendImageFile(formData, 'driver_license_front', payload.driverLicenseFrontUri);
  appendImageFile(formData, 'driver_license_back', payload.driverLicenseBackUri);
  appendImageFile(formData, 'vehicle_registration_front', payload.vehicleRegistrationFrontUri);
  appendImageFile(formData, 'vehicle_registration_back', payload.vehicleRegistrationBackUri);

  return formData;
};

export const riderDocumentsService = {
  updateRiderDocuments: (payload: UpdateRiderDocumentsPayload) =>
    apiClient.patch<UpdateRiderDocumentsResponse>(RIDER_DOCUMENTS_PATH, toFormData(payload), {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
};
