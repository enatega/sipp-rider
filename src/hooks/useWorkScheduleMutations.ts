import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ApiError } from '../api/apiClient';
import { workScheduleKeys } from '../api/queryKeys';
import { workScheduleService } from '../api/workScheduleService';
import type { UpdateWorkSchedulePayload, WorkScheduleResponse } from '../api/workScheduleTypes';

export function useUpdateWorkScheduleMutation() {
  const queryClient = useQueryClient();

  return useMutation<WorkScheduleResponse, ApiError, UpdateWorkSchedulePayload>({
    mutationFn: workScheduleService.updateWorkSchedule,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: workScheduleKeys.all });
    },
  });
}
