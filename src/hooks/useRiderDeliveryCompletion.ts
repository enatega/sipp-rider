import { useEffect, useRef } from 'react';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../navigation/types';
import { stopRiderBackgroundLocation } from '../location/riderBackgroundLocationTask';

type Options = {
  orderId: string; orderCode: string; status?: string | null; requestedStatus?: string;
  focused: boolean; navigation: NativeStackNavigationProp<MainStackParamList, 'ProcessingOrderDetail'>;
};
export function useRiderDeliveryCompletion({ orderId, orderCode, status, requestedStatus, focused, navigation }: Options) {
  const completedOrder = useRef<string | null>(null);
  useEffect(() => {
    // History visits remain readable. Only finish the delivery submitted in this screen.
    if (!focused || status !== 'delivered' || requestedStatus !== 'delivered' || completedOrder.current === orderId) return;
    completedOrder.current = orderId;
    // Cleanup must not delay leaving a completed order, or stop tracking a different order.
    void stopRiderBackgroundLocation(orderId).catch((error) => console.warn('[rider][location] completed delivery cleanup failed', error));
    navigation.replace('Home', { screen: 'HomeTab', params: { completedOrder: { orderCode } } });
  }, [focused, navigation, orderCode, orderId, requestedStatus, status]);
}
