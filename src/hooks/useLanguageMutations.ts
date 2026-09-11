import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ApiError } from '../api/apiClient';
import { languageKeys } from '../api/queryKeys';
import { languageService } from '../api/languageService';
import type { UpdateLanguagePayload, UpdateLanguageResponse } from '../api/languageTypes';

export function useUpdateLanguageMutation() {
  const queryClient = useQueryClient();

  return useMutation<UpdateLanguageResponse, ApiError, UpdateLanguagePayload>({
    mutationFn: languageService.updateLanguage,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: languageKeys.all });
    },
  });
}
