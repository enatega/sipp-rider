export type WorkScheduleSlot = {
  open: string;
  close: string;
};

export type WorkScheduleDay = {
  is_active: boolean;
  slots: WorkScheduleSlot[];
};

export type WorkScheduleData = {
  monday: WorkScheduleDay;
  tuesday: WorkScheduleDay;
  wednesday: WorkScheduleDay;
  thursday: WorkScheduleDay;
  friday: WorkScheduleDay;
  saturday: WorkScheduleDay;
  sunday: WorkScheduleDay;
};

export type WorkScheduleResponse = {
  message: string;
  data: WorkScheduleData;
};

export type UpdateWorkSchedulePayload = {
  weeklyShifts: Partial<WorkScheduleData>;
};
