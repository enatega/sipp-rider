import apiClient from './apiClient';
import {
  LanguageSettingsResponse,
  UpdateLanguagePayload,
  UpdateLanguageResponse,
} from './languageTypes';

const LANGUAGE_SETTINGS_PATH = '/apps/deliveries/settings/language';

export const languageService = {
  getLanguageSettings: () =>
    apiClient.get<LanguageSettingsResponse>(LANGUAGE_SETTINGS_PATH),
  updateLanguage: (payload: UpdateLanguagePayload) =>
    apiClient.patch<UpdateLanguageResponse>(LANGUAGE_SETTINGS_PATH, payload),
};
