import type { NavigatorScreenParams } from '@react-navigation/native';
import type { RiderTabParamList } from './MainTabsNavigator';

export type AuthStackParamList = {
  Splash: undefined;
  Login: undefined;
};

export type MainStackParamList = {
  Home: NavigatorScreenParams<RiderTabParamList> | undefined;
  ProfileDetails: undefined;
  UpdatePassword: undefined;
  ProcessingOrderDetail: { orderId: string };
  OrderChat: {
    orderId: string;
    name: string;
    phone: string | null;
    chatBoxId?: string | null;
    receiverId?: string | null;
  };
  EarningsDetail: undefined;
  DeliveriesDetail: { earningId?: string };
  Language: undefined;
  VehicleType: undefined;
  BankManagement: undefined;
  WorkSchedule: undefined;
};
