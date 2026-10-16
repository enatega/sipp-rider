import { useEffect } from 'react';
import { Alert, AppState } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { riderHomeKeys, riderProfileKeys } from '../api/queryKeys';
import { riderProfileService } from '../api/riderProfileService';
import type { RiderFullProfileResponse } from '../api/riderProfileTypes';
import { useRiderProfileQuery } from './useRiderProfileQuery';
import { useTranslations } from '../localization/LocalizationProvider';

export function useRiderAvailability() {
  const { t } = useTranslations('app');
  const queryClient = useQueryClient();
  const profile = useRiderProfileQuery();
  const mutation = useMutation({
    mutationFn: riderProfileService.setAvailability,
    onSuccess: (response) => {
      queryClient.setQueryData<RiderFullProfileResponse>(riderProfileKeys.detail(), (previous) =>
        previous ? { ...previous, availabilityStatus: response.data.availabilityStatus } : previous,
      );
      void queryClient.invalidateQueries({ queryKey: riderHomeKeys.all });
    },
    onError: () => Alert.alert(t('menu_availability'), t('menu_availability_error')),
  });

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void profile.refetch();
    });
    return () => subscription.remove();
  }, [profile.refetch]);

  const availability = profile.data?.availabilityStatus === 'online';
  const setAvailability = (next: boolean) => {
    if (!profile.data || mutation.isPending || availability === next) return;
    mutation.mutate(next ? 'online' : 'offline');
  };

  return { availability, setAvailability, isPending: mutation.isPending || profile.isLoading };
}
