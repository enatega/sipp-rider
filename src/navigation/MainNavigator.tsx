import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainTabsNavigator from './MainTabsNavigator';
import LanguageScreen from '../screens/LanguageScreen';
import VehicleTypeScreen from '../screens/VehicleTypeScreen';
import BankManagementScreen from '../screens/BankManagementScreen';
import WorkScheduleScreen from '../screens/WorkScheduleScreen';
import ProcessingOrderDetailScreen from '../screens/ProcessingOrderDetailScreen';
import OrderChatScreen from '../screens/OrderChatScreen';
import EarningsDetailScreen from '../screens/EarningsDetailScreen';
import DeliveriesDetailScreen from '../screens/DeliveriesDetailScreen';
import ProfileDetailsScreen from '../screens/profile/ProfileDetailsScreen';
import UpdatePasswordScreen from '../screens/profile/UpdatePasswordScreen';
import { MainStackParamList } from './types';

const Stack = createNativeStackNavigator<MainStackParamList>();

export default function MainNavigator() {
  return (
      <Stack.Navigator>
      <Stack.Screen name="Home" component={MainTabsNavigator} options={{ headerShown: false }} />
      <Stack.Screen name="ProfileDetails" component={ProfileDetailsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="UpdatePassword" component={UpdatePasswordScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="ProcessingOrderDetail"
        component={ProcessingOrderDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="OrderChat" component={OrderChatScreen} options={{ headerShown: false }} />
      <Stack.Screen name="EarningsDetail" component={EarningsDetailScreen} options={{ headerShown: false }} />
      <Stack.Screen name="DeliveriesDetail" component={DeliveriesDetailScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Language" component={LanguageScreen} options={{ headerShown: false }} />
      <Stack.Screen name="VehicleType" component={VehicleTypeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="BankManagement" component={BankManagementScreen} options={{ headerShown: false }} />
      <Stack.Screen name="WorkSchedule" component={WorkScheduleScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}
