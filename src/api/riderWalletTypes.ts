export type WalletPendingRequest = {
  request_id: string;
  amount: number;
  status: string;
  requested_at: string;
};

export type RiderWalletBalanceResponse = {
  current_balance: number;
  available_amount: number;
  pending_request: WalletPendingRequest | null;
};

export type RiderWalletTransactionType = 'deposit' | 'withdrawal';

export type RiderWalletHistoryItem = {
  transaction_id: string;
  type: string;
  label: string;
  amount: number;
  created_at: string;
};

export type RiderWalletHistoryResponse = {
  data: RiderWalletHistoryItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type RiderWalletHistoryQueryParams = {
  page?: number;
  limit?: number;
  transactionType?: RiderWalletTransactionType;
};

export type RiderWalletWithdrawPayload = {
  amount: number;
  notes?: string;
};

export type RiderWalletWithdrawResponse = {
  success: boolean;
  message: string;
  eta_message: string;
  request: WalletPendingRequest;
};
