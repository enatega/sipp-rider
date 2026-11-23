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
  /** English fallback label from the server. */
  label: string;
  amount: number;
  /** Ledger entry kind (e.g. "rider_order_earning"); refund deductions carry a ":<requestCode>" suffix. */
  entry_type?: string | null;
  order_id?: string | null;
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

export type WithdrawalHistoryItem = {
  request_id: string; amount: number; requested_amount: number;
  approved_amount: number | null; status: string; createdAt: string;
  updated_at: string; has_payment_proof: boolean;
};
export type WithdrawalHistoryResponse = { history: WithdrawalHistoryItem[]; isEnd: boolean };
export type WithdrawalDetail = {
  id: string; amount: number; approved_amount: number | null; status: string;
  createdAt: string; updatedAt: string; payment_proof: string | null;
  notes: string | null; rejection_reason: string | null;
};
