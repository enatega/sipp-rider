import { useQuery } from '@tanstack/react-query';
import type { ApiError } from '../api/apiClient';
import { riderProfileKeys } from '../api/queryKeys';
import { riderProfileService } from '../api/riderProfileService';
import type { RiderFullProfileResponse } from '../api/riderProfileTypes';

export function useRiderProfileQuery(enabled = true) {
  return useQuery<RiderFullProfileResponse, ApiError>({
    queryKey: riderProfileKeys.detail(),
    queryFn: riderProfileService.getFullProfile,
    enabled,
    staleTime: 30_000,
  });
}
