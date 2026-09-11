export type WithdrawValidationError = 'invalid' | 'insufficient' | 'pending';

export const parseWithdrawAmount = (value: string): number => {
  const amount = Number(value.replace(/[^0-9.]/g, ''));
  return Number.isFinite(amount) ? amount : 0;
};

export const validateWithdraw = (
  amount: number,
  availableAmount: number,
  hasPendingRequest: boolean,
): WithdrawValidationError | null => {
  if (hasPendingRequest) return 'pending';
  if (amount <= 0) return 'invalid';
  if (amount > availableAmount) return 'insufficient';
  return null;
};
