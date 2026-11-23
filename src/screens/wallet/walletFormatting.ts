import type { RiderWalletHistoryItem } from '../../api/riderWalletTypes';

type Translate = (key: string, options?: Record<string, string>) => string;

export function walletDate(value?: string | null, includeTime = false) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return includeTime ? date.toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export function walletDateTime(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short',
  });
}

export function isOutgoingWalletTransaction(item: RiderWalletHistoryItem) {
  return item.type === 'debit' || item.type === 'withdrawal';
}

export function getRiderWalletTransactionLabel(item: RiderWalletHistoryItem, t: Translate) {
  const isOutgoing = isOutgoingWalletTransaction(item);
  const [entryType, reference] = (item.entry_type ?? '').split(':');
  if (entryType === 'rider_order_earning') return t('wallet_tx_delivery_earning');
  if (entryType === 'refund_rider_deduction' && reference) return t('wallet_tx_refund_rider_deduction', { code: reference });
  if (!entryType) return t(isOutgoing ? 'wallet_tx_cash_out' : 'wallet_tx_top_up');
  return item.label || (isOutgoing ? t('wallet_withdraw_now') : t('wallet_recent_transactions'));
}
