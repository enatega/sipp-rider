import { useQuery } from '@tanstack/react-query';
import { bankDetailsService } from '../api/bankDetailsService';
import { bankDetailsKeys } from '../api/queryKeys';

export function useBankDetailsQuery() {
  return useQuery({
    queryKey: bankDetailsKeys.detail(),
    queryFn: bankDetailsService.getBankDetails,
    staleTime: 30_000,
  });
}
