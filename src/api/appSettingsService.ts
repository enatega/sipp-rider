import apiClient from './apiClient';
import type { RiderAppSettingsApiResponse } from './appSettingsTypes';

const RIDER_APP_SETTINGS_PATH = '/apps/deliveries/app-settings/RIDER';

export const appSettingsService = {
  getRiderAppSettings: () =>
    apiClient.get<RiderAppSettingsApiResponse>(
      RIDER_APP_SETTINGS_PATH,
      undefined,
      { skipAuth: true }
    ),
};
