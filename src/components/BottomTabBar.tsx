import React from 'react';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Text from './Text';
import HomeIcon from './icons/HomeIcon';
import WalletIcon from './icons/WalletIcon';
import EarningsIcon from './icons/EarningsIcon';
import ProfileIcon from './icons/ProfileIcon';
import { useTranslations } from '../localization/LocalizationProvider';
import { useAppTheme } from '../theme/ThemeProvider';
import { typography } from '../theme/typography';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TAB_META = {
  HomeTab: { key: 'nav_home', Icon: HomeIcon },
  WalletTab: { key: 'nav_wallet', Icon: WalletIcon },
  EarningsTab: { key: 'nav_earnings', Icon: EarningsIcon },
  ProfileTab: { key: 'nav_profile', Icon: ProfileIcon },
} as const;

export default function BottomTabBar({ state, navigation }: BottomTabBarProps) {
  const { t } = useTranslations('app');
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const bottomInset = Platform.OS === 'android'
    ? insets.bottom + 10
    : insets.bottom + 6;
  const horizontalPadding = Platform.OS === 'android' ? 8 : 12;

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: bottomInset,
          paddingHorizontal: horizontalPadding,
          backgroundColor: theme.colors.gray800,
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const meta = TAB_META[route.name as keyof typeof TAB_META];
        const label = t(meta?.key ?? 'nav_home');
        const Icon = meta?.Icon ?? HomeIcon;
        const iconColor = focused ? theme.colors.primary : theme.colors.gray400;

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <Pressable key={route.key} style={styles.tab} onPress={onPress} accessibilityRole="tab" accessibilityState={{ selected: focused }} accessibilityLabel={label}>
            <View style={styles.iconWrap}><Icon color={iconColor} /></View>
            <Text variant="caption" style={[styles.label, { color: iconColor }]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    minHeight: 76,
  },
  tab: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  iconWrap: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  label: {
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
    textAlign: 'center',
  },
});
