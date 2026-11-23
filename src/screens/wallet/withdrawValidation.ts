export type WithdrawValidationError = 'invalid' | 'insufficient' | 'pending';

export const parseWithdrawAmount = (value: string): number => {
  const amount = Number(value.replace(/[^0-9.]/g, ''));
  return Number.isFinite(amount) ? amount : 0;
};

const toCents = (value: number) => Math.round(value * 100);

export const validateWithdraw = (
  amount: number,
  availableAmount: number,
  hasPendingRequest: boolean,
): WithdrawValidationError | null => {
  if (hasPendingRequest) return 'pending';
  // The backend accepts at most 2 decimal places.
  if (amount <= 0 || Math.abs(amount * 100 - toCents(amount)) > 1e-6) return 'invalid';
  if (toCents(amount) > toCents(availableAmount)) return 'insufficient';
  return null;
};
