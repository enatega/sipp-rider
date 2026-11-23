import { useQuery } from '@tanstack/react-query';
import type { ApiError } from '../api/apiClient';
import { vehicleTypesService } from '../api/vehicleTypesService';
import { vehicleTypesKeys } from '../api/queryKeys';
import type { VehicleTypesResponse } from '../api/vehicleTypesTypes';

export function useVehicleTypesQuery() {
  const query = useQuery<VehicleTypesResponse, ApiError>({
    queryKey: vehicleTypesKeys.list(),
    queryFn: vehicleTypesService.getVehicleTypes,
    staleTime: 30_000,
  });

  const rawData = query.error?.data as { message?: string | string[] } | undefined;
  const errorMessage = Array.isArray(rawData?.message)
    ? rawData.message.join('\n')
    : typeof rawData?.message === 'string' && rawData.message.trim()
      ? rawData.message
      : query.error?.message?.trim() || 'Unknown error';

  return {
    ...query,
    errorMessage,
  };
}
