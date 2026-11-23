import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ApiError } from '../api/apiClient';
import { riderProfileKeys } from '../api/queryKeys';
import { riderDocumentsService } from '../api/riderDocumentsService';
import type {
  UpdateRiderDocumentsPayload,
  UpdateRiderDocumentsResponse,
} from '../api/riderDocumentsTypes';

export function useUpdateRiderDocumentsMutation() {
  const queryClient = useQueryClient();

  return useMutation<UpdateRiderDocumentsResponse, ApiError, UpdateRiderDocumentsPayload>({
    mutationFn: riderDocumentsService.updateRiderDocuments,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: riderProfileKeys.all });
    },
  });
}
