import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { ApiError } from '../api/apiClient';
import { currencyService } from '../api/currencyService';
import { appCurrencyKeys } from '../api/queryKeys';

const FALLBACK_CURRENCY_CODE = 'USD';
const FALLBACK_CURRENCY_SYMBOL = '$';

export function useAppCurrency() {
  const query = useQuery({
    queryKey: appCurrencyKeys.detail(),
    queryFn: currencyService.getCurrency,
    staleTime: 5 * 60_000,
  });

  const code = query.data?.code || FALLBACK_CURRENCY_CODE;
  const symbol = query.data?.symbol || FALLBACK_CURRENCY_SYMBOL;

  const formatter = useMemo(
    () =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: code,
        maximumFractionDigits: 0,
      }),
    [code]
  );

  const formatCurrency = (amount: number) => formatter.format(amount);

  return {
    ...query,
    code,
    symbol,
    formatCurrency,
  };
}

export type AppCurrencyQueryError = ApiError;

