import apiClient from './apiClient';
import { UpdateWorkSchedulePayload, WorkScheduleResponse } from './workScheduleTypes';

const WORK_SCHEDULE_PATH = '/apps/deliveries/settings/work-schedule';

export const workScheduleService = {
  getWorkSchedule: () => apiClient.get<WorkScheduleResponse>(WORK_SCHEDULE_PATH),
  updateWorkSchedule: (payload: UpdateWorkSchedulePayload) =>
    apiClient.patch<WorkScheduleResponse>(WORK_SCHEDULE_PATH, payload),
};
