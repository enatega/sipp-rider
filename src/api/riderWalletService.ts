import apiClient from './apiClient';
import {
  RiderWalletBalanceResponse,
  WithdrawalHistoryResponse,
  WithdrawalHistoryItem,
  WithdrawalDetail,
  RiderWalletHistoryQueryParams,
  RiderWalletHistoryResponse,
  RiderWalletWithdrawPayload,
  RiderWalletWithdrawResponse,
} from './riderWalletTypes';

const BASE_PATH = '/apps/deliveries/rider/wallet';

export const riderWalletService = {
  getWithdrawals: async (offset: number): Promise<WithdrawalHistoryResponse> => {
    type LegacyItem = Partial<WithdrawalHistoryItem> & { id?: string; withdraw_id?: string; updatedAt?: string; payment_proof?: string };
    const response = await apiClient.get<{ history: LegacyItem[]; isEnd: boolean }>('/apps/deliveries/wallet/withdrawl/history', { offset });
    if (__DEV__ && response.history?.some(item => !item.request_id && !item.id && !item.withdraw_id)) {
      console.warn('[Withdrawal history] Server response missing request IDs; deploy the updated withdrawal-history endpoint.');
    }
    return { ...response, history: (response.history ?? []).map(item => ({
      request_id: item.request_id || item.id || item.withdraw_id || '',
      amount: Number(item.amount ?? item.requested_amount ?? 0),
      requested_amount: Number(item.requested_amount ?? item.amount ?? 0),
      approved_amount: item.approved_amount == null ? null : Number(item.approved_amount),
      status: item.status ?? '', createdAt: item.createdAt ?? '',
      updated_at: item.updated_at || item.updatedAt || item.createdAt || '',
      has_payment_proof: item.has_payment_proof ?? Boolean(item.payment_proof),
    })) };
  },
  getWithdrawal: (id: string) => apiClient.get<WithdrawalDetail>(`/apps/deliveries/wallet/withdrawl/${encodeURIComponent(id)}`),
  getBalance: () => apiClient.get<RiderWalletBalanceResponse>(`${BASE_PATH}/balance`),

  getHistory: (params: RiderWalletHistoryQueryParams) =>
    apiClient.get<RiderWalletHistoryResponse>(`${BASE_PATH}/history`, params),

  createWithdrawRequest: (payload: RiderWalletWithdrawPayload) =>
    apiClient.post<RiderWalletWithdrawResponse>(`${BASE_PATH}/withdraw`, payload),
};
