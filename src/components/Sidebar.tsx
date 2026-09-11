import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Image, Pressable, ScrollView, StyleSheet, TouchableWithoutFeedback, View } from 'react-native';
import { Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Text from './Text';
import ToggleSwitch from './ToggleSwitch';
import { useAppTheme } from '../theme/ThemeProvider';
import { useAuth } from '../auth/AuthProvider';
import { useLogoutMutation } from '../hooks/useAuthMutations';
import { useTranslations } from '../localization/LocalizationProvider';
import { useRiderProfileQuery } from '../hooks/useRiderProfileQuery';

type Props = {
  visible: boolean;
  onClose: () => void;
  availability: boolean;
  onAvailabilityChange: (v: boolean) => void;
  onNavigate: (screen: 'Language' | 'VehicleType' | 'BankManagement' | 'WorkSchedule') => void;
  onSwitchTab?: () => void;
};

type MenuItemBase = { key: string; label: string; icon: React.ReactNode };
type MenuItemNav = MenuItemBase & { type: 'nav'; onPress: () => void };
type MenuItemToggle = MenuItemBase & { type: 'toggle'; value: boolean; onToggle: (v: boolean) => void; subLabel?: string };
type MenuItem = MenuItemNav | MenuItemToggle;

const DRAWER_WIDTH = 332;
const ANIMATION_DURATION = 280;
const SIDEBAR_ICONS = {
  availability: require('../assets/images/availability.png'),
  language: require('../assets/images/language.png'),
  vehicleType: require('../assets/images/vehicle-type.png'),
  bankManagement: require('../assets/images/bank-managment.png'),
  workSchedule: require('../assets/images/work-schedule.png'),
  profile: require('../assets/images/profile.png'),
  aboutUs: require('../assets/images/about-us.png'),
  help: require('../assets/images/help.png'),
  logout: require('../assets/images/logout.png'),
} as const;
const ABOUT_URL = 'https://multivendor.enatega.com/about';
const PRIVACY_URL = 'https://multivendor.enatega.com/privacy';
const HELP_URL = 'https://ninjascode.com/';

function IconBox({ children }: { children: React.ReactNode }) { return <View style={styles.iconBox}>{children}</View>; }
function ChevronRight({ color }: { color: string }) { return <View style={[styles.chevron, { borderColor: color }]} />; }

export default function Sidebar({ visible, onClose, availability, onAvailabilityChange, onNavigate, onSwitchTab }: Props) {
  const { theme } = useAppTheme();
  const { t } = useTranslations('app');
  const { session } = useAuth();
  const profileQuery = useRiderProfileQuery();
  const logoutMutation = useLogoutMutation();
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = useState(visible);
  const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const animateOpen = useCallback(() => {
    translateX.setValue(-DRAWER_WIDTH);
    backdropOpacity.setValue(0);
    setMounted(true);
    Animated.parallel([
      Animated.timing(translateX, { toValue: 0, duration: ANIMATION_DURATION, useNativeDriver: true }),
      Animated.timing(backdropOpacity, { toValue: 1, duration: ANIMATION_DURATION, useNativeDriver: true }),
    ]).start();
  }, [translateX, backdropOpacity]);

  const animateClose = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateX, { toValue: -DRAWER_WIDTH, duration: ANIMATION_DURATION, useNativeDriver: true }),
      Animated.timing(backdropOpacity, { toValue: 0, duration: ANIMATION_DURATION, useNativeDriver: true }),
    ]).start(() => setMounted(false));
  }, [translateX, backdropOpacity]);

  useEffect(() => { if (visible) animateOpen(); else animateClose(); }, [visible, animateOpen, animateClose]);
  if (!mounted) return null;

  const openExternalUrl = async (url: string) => {
    onClose();
    await Linking.openURL(url);
  };

  const user = session.user;
  const profile = profileQuery.data;
  const displayName = profile?.userName?.trim() || user?.name || 'John Smith';
  const displayId =
    profile?.riderCode?.trim() ||
    profile?.riderId?.trim() ||
    profile?.userId?.trim() ||
    user?.id ||
    'ID-7853';
  const initials = displayName
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  const items: MenuItem[] = [
    {
      key: 'availability',
      type: 'toggle',
      label: t('menu_availability'),
      icon: <Image source={SIDEBAR_ICONS.availability} style={[styles.iconImage, { tintColor: theme.colors.primary }]} resizeMode="contain" />,
      value: availability,
      onToggle: onAvailabilityChange,
      subLabel: availability ? t('menu_available') : t('menu_unavailable'),
    },
    {
      key: 'language',
      type: 'nav',
      label: t('menu_language'),
      icon: <Image source={SIDEBAR_ICONS.language} style={[styles.iconImage, { tintColor: theme.colors.primary }]} resizeMode="contain" />,
      onPress: () => {
        onClose();
        onNavigate('Language');
      },
    },
    {
      key: 'vehicle',
      type: 'nav',
      label: t('menu_vehicle_type'),
      icon: <Image source={SIDEBAR_ICONS.vehicleType} style={[styles.iconImage, { tintColor: theme.colors.primary }]} resizeMode="contain" />,
      onPress: () => {
        onClose();
        onNavigate('VehicleType');
      },
    },
    {
      key: 'bank',
      type: 'nav',
      label: t('menu_bank_management'),
      icon: <Image source={SIDEBAR_ICONS.bankManagement} style={[styles.iconImage, { tintColor: theme.colors.primary }]} resizeMode="contain" />,
      onPress: () => {
        onClose();
        onNavigate('BankManagement');
      },
    },
    {
      key: 'schedule',
      type: 'nav',
      label: t('menu_work_schedule'),
      icon: <Image source={SIDEBAR_ICONS.workSchedule} style={[styles.iconImage, { tintColor: theme.colors.primary }]} resizeMode="contain" />,
      onPress: () => {
        onClose();
        onNavigate('WorkSchedule');
      },
    },
    {
      key: 'profile',
      type: 'nav',
      label: t('menu_profile'),
      icon: <Image source={SIDEBAR_ICONS.profile} style={[styles.iconImage, { tintColor: theme.colors.primary }]} resizeMode="contain" />,
      onPress: () => {
        onClose();
        onSwitchTab?.();
      },
    },
    {
      key: 'privacy',
      type: 'nav',
      label: t('menu_privacy_policy'),
      icon: <Image source={SIDEBAR_ICONS.vehicleType} style={[styles.iconImage, { tintColor: theme.colors.primary }]} resizeMode="contain" />,
      onPress: () => {
        void openExternalUrl(PRIVACY_URL);
      },
    },
    {
      key: 'about',
      type: 'nav',
      label: t('menu_about_us'),
      icon: <Image source={SIDEBAR_ICONS.aboutUs} style={[styles.iconImage, { tintColor: theme.colors.primary }]} resizeMode="contain" />,
      onPress: () => {
        void openExternalUrl(ABOUT_URL);
      },
    },
    {
      key: 'help',
      type: 'nav',
      label: t('menu_help'),
      icon: <Image source={SIDEBAR_ICONS.help} style={[styles.iconImage, { tintColor: theme.colors.primary }]} resizeMode="contain" />,
      onPress: () => {
        void openExternalUrl(HELP_URL);
      },
    },
    {
      key: 'logout',
      type: 'nav',
      label: t('menu_logout'),
      icon: <Image source={SIDEBAR_ICONS.logout} style={styles.iconImage} resizeMode="contain" />,
      onPress: () => logoutMutation.mutate(),
    },
  ];

  return (
    <View style={[StyleSheet.absoluteFill, styles.container]} pointerEvents="box-none">
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View
          style={[
            styles.backdrop,
            {
              opacity: backdropOpacity,
              backgroundColor: theme.colors.black,
            },
          ]}
        />
      </TouchableWithoutFeedback>
      <Animated.View style={[styles.drawer, { backgroundColor: theme.colors.gray50, transform: [{ translateX }] }]}>
        <View style={[styles.header, { backgroundColor: theme.colors.primary, paddingTop: insets.top + 10 }]}>
          <View style={[styles.avatarCircle, { backgroundColor: theme.colors.white }]}>
            <Text variant="body" weight="semiBold" color={theme.colors.primary}>{initials}</Text>
          </View>
          <Text variant="subtitle" weight="bold" color={theme.colors.text} style={styles.userName}>{displayName}</Text>
          <View style={[styles.riderBadge, { backgroundColor: theme.colors.tertiary }]}>
            <Text variant="caption" weight="semiBold" color={theme.colors.gray600}>{displayId}</Text>
          </View>
        </View>

        <ScrollView style={styles.menuScroll} showsVerticalScrollIndicator={false} contentContainerStyle={[styles.menuContent, { paddingBottom: insets.bottom + 24 }]}>
          {items.map((item, idx) => (
            <View
              key={item.key}
              style={[
                styles.row,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.gray200,
                  marginBottom: idx === items.length - 1 ? 0 : 10,
                },
              ]}
            >
              <View style={[styles.iconBox, { backgroundColor: theme.colors.tertiary }]}>{item.icon}</View>
              <Text variant="body" weight="semiBold" color={theme.colors.text} style={styles.rowLabel}>{item.label}</Text>
              {item.type === 'toggle' ? (
                <View style={styles.toggleWrapper}>
                  <ToggleSwitch value={item.value} onValueChange={item.onToggle} />
                  {item.subLabel ? <Text variant="caption" color={theme.colors.gray600}>{item.subLabel}</Text> : null}
                </View>
              ) : (
                <Pressable onPress={item.onPress} style={StyleSheet.absoluteFill} accessibilityRole="button" accessibilityLabel={item.label} />
              )}
              {item.type === 'nav' && <ChevronRight color={theme.colors.gray500} />}
            </View>
          ))}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { zIndex: 20 },
  backdrop: { ...StyleSheet.absoluteFillObject, opacity: 0.3 },
  drawer: {
    width: DRAWER_WIDTH,
    height: '100%',
    overflow: 'hidden',
    elevation: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 6, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  avatarCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  userName: { marginBottom: 6 },
  riderBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  menuScroll: { flex: 1 },
  menuContent: { paddingTop: 14, paddingHorizontal: 12 },
  row: {
    minHeight: 68,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowLabel: { flex: 1, fontSize: 14, lineHeight: 20 },
  iconBox: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  iconImage: { width: 18, height: 18 },
  toggleWrapper: { alignItems: 'center', justifyContent: 'center', gap: 4, marginRight: 8 },
  chevron: { width: 10, height: 10, borderTopWidth: 1.5, borderRightWidth: 1.5, transform: [{ rotate: '45deg' }] },
});
