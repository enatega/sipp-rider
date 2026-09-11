import apiClient from './apiClient';
import {
  RiderFullProfileResponse,
  UpdateRiderPasswordPayload,
  UpdateRiderPasswordResponse,
} from './riderProfileTypes';

const RIDER_FULL_PROFILE_PATH = '/apps/deliveries/rider/home/rider/full-profile';
const RIDER_PASSWORD_PATH = '/users/password';

export const riderProfileService = {
  getFullProfile: () => apiClient.get<RiderFullProfileResponse>(RIDER_FULL_PROFILE_PATH),
  updatePassword: (payload: UpdateRiderPasswordPayload) =>
    apiClient.patch<UpdateRiderPasswordResponse>(RIDER_PASSWORD_PATH, payload),
};
