import { useQuery } from '@tanstack/react-query';
import type { ApiError } from '../api/apiClient';
import { languageKeys } from '../api/queryKeys';
import { languageService } from '../api/languageService';
import type { LanguageSettingsResponse } from '../api/languageTypes';

export function useLanguageQuery() {
  return useQuery<LanguageSettingsResponse, ApiError>({
    queryKey: languageKeys.detail(),
    queryFn: languageService.getLanguageSettings,
    staleTime: 30_000,
  });
}
