import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ApiError } from '../api/apiClient';
import { vehicleTypesKeys } from '../api/queryKeys';
import { vehicleTypesService } from '../api/vehicleTypesService';
import type {
  UpdateVehicleTypePayload,
  UpdateVehicleTypeResponse,
} from '../api/vehicleTypesTypes';

export function useUpdateVehicleTypeMutation() {
  const queryClient = useQueryClient();

  return useMutation<UpdateVehicleTypeResponse, ApiError, UpdateVehicleTypePayload>({
    mutationFn: vehicleTypesService.updateVehicleType,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: vehicleTypesKeys.all });
    },
  });
}
