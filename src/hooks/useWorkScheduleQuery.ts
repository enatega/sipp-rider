import { useQuery } from '@tanstack/react-query';
import { workScheduleService } from '../api/workScheduleService';
import { workScheduleKeys } from '../api/queryKeys';

export function useWorkScheduleQuery() {
  return useQuery({
    queryKey: workScheduleKeys.detail(),
    queryFn: workScheduleService.getWorkSchedule,
    staleTime: 30_000,
  });
}
