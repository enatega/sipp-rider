import { useCallback } from 'react';
import type { ApiError } from '../api/apiClient';
import { useTranslations } from '../localization/LocalizationProvider';

// Server error codes from the rider password reset endpoints that have a
// translated message. Anything else falls back to the server's message.
const ERROR_KEYS: Record<string, string> = {
  RIDER_PROFILE_REQUIRED: 'forgot_error_no_rider',
  RIDER_PASSWORD_CHANGE_DISABLED: 'forgot_error_change_disabled',
  ACCOUNT_INACTIVE: 'forgot_error_inactive',
  NETWORK_ERROR: 'forgot_error_network',
};

export function usePasswordResetErrorMessage() {
  const { t } = useTranslations('app');

  return useCallback(
    (error: ApiError | null | undefined): string => {
      if (!error) return '';
      const key = error.code ? ERROR_KEYS[error.code] : undefined;
      if (key) return t(key);
      return error.message || t('forgot_error_generic');
    },
    [t]
  );
}
