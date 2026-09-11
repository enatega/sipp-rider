export type RegistrationDocument = {
  front: string | null;
  back: string | null;
};

export type DrivingLicenseProfile = {
  licenseNo: string | null;
  registrationDocument: RegistrationDocument;
};

export type VehiclePlateProfile = {
  plateNo: string | null;
  registrationDocument: RegistrationDocument;
};

export type RiderFullProfileResponse = {
  userName: string;
  userId: string;
  riderId: string;
  riderCode?: string | null;
  profileImage: string | null;
  drivingLicense: DrivingLicenseProfile | null;
  vehiclePlate: VehiclePlateProfile | null;
  email: string | null;
  mobileNumber: string | null;
  isApproved?: boolean;
};

export type UpdateRiderPasswordPayload = {
  previous_password: string;
  new_password: string;
};

export type UpdateRiderPasswordResponse = {
  message: string;
};
