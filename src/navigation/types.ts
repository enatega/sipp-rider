import type { NavigatorScreenParams } from '@react-navigation/native';
import type { RiderTabParamList } from './MainTabsNavigator';
import type { RiderWalletHistoryItem } from '../api/riderWalletTypes';

export type AuthStackParamList = {
  Login: { notice?: 'password_reset'; email?: string } | undefined;
  ForgotPassword: { email?: string } | undefined;
  VerifyResetCode: { email: string; resendAfterSeconds: number };
  ResetPassword: { email: string; resetToken: string };
};

export type MainStackParamList = {
  Home: NavigatorScreenParams<RiderTabParamList> | undefined;
  ProfileDetails: undefined;
  Notifications: undefined;
  SupportTickets: undefined;
  UpdatePassword: undefined;
  ProcessingOrderDetail: { orderId: string };
  DeliveryIssueChat: { orderId: string; chatBoxId: string };
  DeliveryProblem: { orderId: string };
  OrderChat: {
    orderId: string;
    name: string;
    phone: string | null;
    chatBoxId?: string | null;
    receiverId?: string | null;
    kind: 'store_rider' | 'customer_rider';
  };
  EarningsDetail: undefined;
  DeliveriesDetail: { earningId?: string };
  Language: undefined;
  VehicleType: undefined;
  BankManagement: undefined;
  WorkSchedule: undefined;
  WalletTransactionDetail: { transaction: RiderWalletHistoryItem };
};
