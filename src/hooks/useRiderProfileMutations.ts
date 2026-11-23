import { useMutation } from '@tanstack/react-query';
import type { ApiError } from '../api/apiClient';
import { riderProfileService } from '../api/riderProfileService';
import type {
  UpdateRiderPasswordPayload,
  UpdateRiderPasswordResponse,
} from '../api/riderProfileTypes';

export function useUpdateRiderPasswordMutation() {
  return useMutation<
    UpdateRiderPasswordResponse,
    ApiError,
    UpdateRiderPasswordPayload
  >({
    mutationFn: riderProfileService.updatePassword,
  });
}
