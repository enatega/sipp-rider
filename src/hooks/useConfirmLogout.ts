import { Alert } from 'react-native';
import { useTranslations } from '../localization/LocalizationProvider';
import { useLogoutMutation } from './useAuthMutations';

export function useConfirmLogout() {
  const { t } = useTranslations('app');
  const mutation = useLogoutMutation({
    onError: () => Alert.alert(t('auth_logout_confirm_title'), t('auth_logout_error')),
  });
  const confirmLogout = () => {
    if (mutation.isPending) return;
    Alert.alert(t('auth_logout_confirm_title'), t('auth_logout_confirm_message'), [
      { text: t('profile_cancel'), style: 'cancel' },
      { text: t('auth_logout'), style: 'destructive', onPress: () => mutation.mutate() },
    ]);
  };
  return { confirmLogout, isPending: mutation.isPending };
}
