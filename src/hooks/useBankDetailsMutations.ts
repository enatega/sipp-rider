import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ApiError } from '../api/apiClient';
import { bankDetailsService } from '../api/bankDetailsService';
import { bankDetailsKeys } from '../api/queryKeys';
import type { BankDetailsResponse, UpdateBankDetailsPayload } from '../api/bankDetailsTypes';

export function useUpdateBankDetailsMutation() {
  const queryClient = useQueryClient();

  return useMutation<BankDetailsResponse, ApiError, UpdateBankDetailsPayload>({
    mutationFn: bankDetailsService.updateBankDetails,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: bankDetailsKeys.all });
    },
  });
}
