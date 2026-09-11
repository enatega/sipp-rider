import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import WalletScreen from '../screens/WalletScreen';
import EarningsScreen from '../screens/EarningsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import BottomTabBar from '../components/BottomTabBar';

export type RiderTabParamList = {
  HomeTab: undefined;
  WalletTab: undefined;
  EarningsTab: undefined;
  ProfileTab: undefined;
};

const Tab = createBottomTabNavigator<RiderTabParamList>();

export default function MainTabsNavigator() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }} tabBar={(props) => <BottomTabBar {...props} />}>
      <Tab.Screen name="HomeTab" component={HomeScreen} />
      <Tab.Screen name="WalletTab" component={WalletScreen} />
      <Tab.Screen name="EarningsTab" component={EarningsScreen} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
