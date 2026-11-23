import { useRef } from 'react';
import { Alert } from 'react-native';
import { useTranslations } from '../localization/LocalizationProvider';
import { useLogoutMutation } from './useAuthMutations';

export function useConfirmLogout() {
  const showing = useRef(false);
  const { t } = useTranslations('app');
  const mutation = useLogoutMutation({
    onError: () => Alert.alert(t('auth_logout_confirm_title'), t('auth_logout_error')),
  });
  const confirmLogout = () => {
    if (mutation.isPending || showing.current) return;
    showing.current = true;
    Alert.alert(t('auth_logout_confirm_title'), t('auth_logout_confirm_message'), [
      { text: t('profile_cancel'), style: 'cancel', onPress: () => { showing.current = false; } },
      { text: t('auth_logout'), style: 'destructive', onPress: () => { showing.current = false; if (!mutation.isPending) mutation.mutate(); } },
    ], { cancelable: true, onDismiss: () => { showing.current = false; } });
  };
  return { confirmLogout, isPending: mutation.isPending };
}
