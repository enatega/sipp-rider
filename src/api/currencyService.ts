import apiClient from './apiClient';
import type { AppCurrencyResponse } from './currencyTypes';

const APP_CURRENCY_PATH = '/apps/deliveries/currency';

export const currencyService = {
  getCurrency: () => apiClient.get<AppCurrencyResponse>(APP_CURRENCY_PATH),
};

