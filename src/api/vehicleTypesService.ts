import apiClient from './apiClient';
import {
  UpdateVehicleTypePayload,
  UpdateVehicleTypeResponse,
  VehicleTypesResponse,
} from './vehicleTypesTypes';

const VEHICLE_TYPES_PATH = '/apps/deliveries/settings/vehicle-types';
const VEHICLE_TYPE_UPDATE_PATH = '/apps/deliveries/settings/vehicle-type';

export const vehicleTypesService = {
  getVehicleTypes: () => apiClient.get<VehicleTypesResponse>(VEHICLE_TYPES_PATH),
  updateVehicleType: (payload: UpdateVehicleTypePayload) =>
    apiClient.patch<UpdateVehicleTypeResponse>(VEHICLE_TYPE_UPDATE_PATH, payload),
};
