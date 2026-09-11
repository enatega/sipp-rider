import apiClient from './apiClient';
import { BankDetailsResponse, UpdateBankDetailsPayload } from './bankDetailsTypes';

const BANK_DETAILS_PATH = '/apps/deliveries/settings/bank-details';

export const bankDetailsService = {
  getBankDetails: () => apiClient.get<BankDetailsResponse>(BANK_DETAILS_PATH),
  updateBankDetails: (payload: UpdateBankDetailsPayload) =>
    apiClient.patch<BankDetailsResponse>(BANK_DETAILS_PATH, payload),
};
