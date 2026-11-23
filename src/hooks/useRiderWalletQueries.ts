import { useAuth } from '../auth/AuthProvider';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { riderWalletService } from '../api/riderWalletService';
import {
  RiderWalletHistoryItem,
  RiderWalletTransactionType,
  RiderWalletWithdrawPayload,
  RiderWalletWithdrawResponse,
} from '../api/riderWalletTypes';
import type { ApiError } from '../api/apiClient';
import { riderWalletKeys } from '../api/queryKeys';

const DEFAULT_HISTORY_LIMIT = 10;

type WalletHistoryPage = {
  items: RiderWalletHistoryItem[];
  page: number;
  limit: number;
  hasNextPage: boolean;
};

export function useRiderWalletBalanceQuery() {
  return useQuery({
    queryKey: riderWalletKeys.balance(),
    queryFn: riderWalletService.getBalance,
    staleTime: 15_000,
  });
}

export function useRiderWalletHistoryInfiniteQuery(
  transactionType: RiderWalletTransactionType | 'all' = 'all',
) {
  return useInfiniteQuery<WalletHistoryPage, ApiError>({
    queryKey: riderWalletKeys.history(transactionType),
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const page = Number(pageParam ?? 1);
      const response = await riderWalletService.getHistory({
        page,
        limit: DEFAULT_HISTORY_LIMIT,
        transactionType: transactionType === 'all' ? undefined : transactionType,
      });

      return {
        items: response.data ?? [],
        page: response.page ?? page,
        limit: response.limit ?? DEFAULT_HISTORY_LIMIT,
        hasNextPage: Boolean(response.hasNextPage),
      };
    },
    getNextPageParam: (lastPage) => (lastPage.hasNextPage ? lastPage.page + 1 : undefined),
    staleTime: 10_000,
  });
}

export function useRiderWalletWithdrawMutation() {
  const queryClient = useQueryClient();

  return useMutation<RiderWalletWithdrawResponse, ApiError, RiderWalletWithdrawPayload>({
    mutationFn: riderWalletService.createWithdrawRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: riderWalletKeys.all });
    },
  });
}

export function useWithdrawalHistory(enabled: boolean) {
  const { session } = useAuth();
  return useInfiniteQuery({
    queryKey: [...riderWalletKeys.withdrawals(), session.user?.id], initialPageParam: 0, enabled: enabled && Boolean(session.token),
    queryFn: ({ pageParam }) => riderWalletService.getWithdrawals(pageParam),
    getNextPageParam: (last, pages) => last.isEnd ? undefined : pages.reduce((sum, page) => sum + page.history.length, 0),
    staleTime: 0,
  });
}
export function useWithdrawalDetail(id: string | null) {
  const { session } = useAuth();
  return useQuery({ queryKey: [...riderWalletKeys.withdrawal(id ?? ''), session.user?.id],
    queryFn: () => riderWalletService.getWithdrawal(id!), enabled: Boolean(id), staleTime: 0 });
}
