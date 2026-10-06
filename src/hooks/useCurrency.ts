import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { ApiError } from '../api/apiClient';
import { currencyService } from '../api/currencyService';
import { appCurrencyKeys } from '../api/queryKeys';

const FALLBACK_CURRENCY_CODE = 'CRC';
const FALLBACK_CURRENCY_SYMBOL = '₡';

export function useAppCurrency() {
  const query = useQuery({
    queryKey: appCurrencyKeys.detail(),
    queryFn: currencyService.getCurrency,
    staleTime: 5 * 60_000,
  });

  const code = query.data?.code || FALLBACK_CURRENCY_CODE;
  const configuredSymbol = query.data?.symbol?.trim();
  let symbol = configuredSymbol && configuredSymbol.toUpperCase() !== code.toUpperCase()
    ? configuredSymbol === '¡' ? '₡' : configuredSymbol
    : FALLBACK_CURRENCY_SYMBOL;
  if (!configuredSymbol || configuredSymbol.toUpperCase() === code.toUpperCase()) {
    if (code.toUpperCase() !== 'CRC') {
      try {
        const resolved = new Intl.NumberFormat('en', {
          style: 'currency', currency: code, currencyDisplay: 'narrowSymbol',
        }).formatToParts(0).find((part) => part.type === 'currency')?.value;
        symbol = resolved && resolved.toUpperCase() !== code.toUpperCase() ? resolved : '¤';
      } catch {
        symbol = '¤';
      }
    }
  }

  const formatter = useMemo(
    () =>
      new Intl.NumberFormat('en-US', {
        maximumFractionDigits: 0,
      }),
    []
  );

  const formatCurrency = (amount: number) => `${symbol}${formatter.format(amount)}`;

  return {
    ...query,
    code,
    symbol,
    formatCurrency,
  };
}

export type AppCurrencyQueryError = ApiError;
