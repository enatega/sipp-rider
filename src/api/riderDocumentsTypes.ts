export type UpdateRiderDocumentsPayload = {
  licenseNumber?: string;
  vehicleNo?: string;
  driverLicenseFrontUri?: string;
  driverLicenseBackUri?: string;
  vehicleRegistrationFrontUri?: string;
  vehicleRegistrationBackUri?: string;
};

export type UpdateRiderDocumentsResponse = {
  message: string;
};
