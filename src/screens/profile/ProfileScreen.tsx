import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useTranslations } from '../../localization/LocalizationProvider';
import Text from '../../components/Text';
import ToggleSwitch from '../../components/ToggleSwitch';
import { useRiderProfileQuery } from '../../hooks/useRiderProfileQuery';
import { useRiderAvailability } from '../../hooks/useRiderAvailability';
import { useConfirmLogout } from '../../hooks/useConfirmLogout';
import { MainStackParamList } from '../../navigation/types';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../api/apiClient';
import { ABOUT_US_URL, PRIVACY_POLICY_URL } from '../../utils/legalLinks';

const profileBackground = require('../../assets/images/profileBackground.png');
const rowIcons = {
  clock: require('../../assets/images/availability.png'),
  user: require('../../assets/images/profile.png'),
  globe: require('../../assets/images/language.png'),
  vehicle: require('../../assets/images/Bike.png'),
  card: require('../../assets/images/bank-managment.png'),
  schedule: require('../../assets/images/work-schedule.png'),
  list: require('../../assets/images/help.png'),
  shield: require('../../assets/images/vehicle-type.png'),
  info: require('../../assets/images/about-us.png'),
  help: require('../../assets/images/help.png'),
  logout: require('../../assets/images/logout.png'),
} as const;

export default function ProfileScreen() {
  const { theme } = useAppTheme();
  const { t } = useTranslations('app');
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { data: profileData, isLoading: profileLoading } = useRiderProfileQuery();
  const { confirmLogout, isPending: isLoggingOut } = useConfirmLogout();
  const notificationCount = useQuery({
    queryKey: ['rider-notification-count'],
    queryFn: () => apiClient.get<{ unreadCount: number }>('/apps/deliveries/users-notifications/count-unread'),
  });
  const { availability, setAvailability, isPending: isAvailabilityPending } = useRiderAvailability();

  if (profileLoading) {
    return (
      <View style={[styles.flex, styles.center, { backgroundColor: theme.colors.gray100 }]}>
        <ActivityIndicator size="large" color={theme.colors.brandInk} />
      </View>
    );
  }

  const profileName = profileData?.userName?.trim() || t('profile_name');
  const profileImage = profileData?.profileImage?.trim() || '';
  const riderId =
    profileData?.riderCode?.trim() ||
    profileData?.riderId?.trim() ||
    profileData?.userId?.trim() ||
    '7853';
  const initials = profileName
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  const openExternalUrl = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        Alert.alert(t('profile_open_link_error'), url);
        return;
      }
      await Linking.openURL(url);
    } catch {
      Alert.alert(t('profile_open_link_error'), url);
    }
  };

  const menuPrimary = [
    {
      key: 'notifications',
      icon: 'list',
      title: notificationCount.data?.unreadCount ? `${t('notifications_title')} (${notificationCount.data.unreadCount})` : t('notifications_title'),
      subtitle: t('notifications_profile_subtitle'),
      onPress: () => navigation.navigate('Notifications'),
    },
    {
      key: 'language',
      icon: 'globe',
      title: t('menu_language'),
      subtitle: t('profile_menu_language_subtitle'),
      onPress: () => navigation.navigate('Language'),
    },
    {
      key: 'vehicle-type',
      icon: 'vehicle-type',
      title: t('menu_vehicle_type'),
      subtitle: t('profile_menu_vehicle_type_subtitle'),
      onPress: () => navigation.navigate('VehicleType'),
    },
    {
      key: 'bank',
      icon: 'credit-card',
      title: t('menu_bank_management'),
      subtitle: t('profile_menu_bank_subtitle'),
      onPress: () => navigation.navigate('BankManagement'),
    },
    {
      key: 'schedule',
      icon: 'clock',
      title: t('menu_work_schedule'),
      subtitle: t('profile_menu_schedule_subtitle'),
      onPress: () => navigation.navigate('WorkSchedule'),
    },
    
  ] as const;

  const menuSecondary = [
    {
      key: 'privacy',
      icon: 'shield',
      title: t('menu_privacy_policy'),
      subtitle: t('profile_menu_privacy_subtitle'),
      onPress: () => openExternalUrl(PRIVACY_POLICY_URL),
    },
    {
      key: 'about',
      icon: 'info',
      title: t('menu_about_us'),
      subtitle: t('profile_menu_about_subtitle'),
      onPress: () => openExternalUrl(ABOUT_US_URL),
    },
    {
      key: 'help',
      icon: 'help-circle',
      title: t('menu_help'),
      subtitle: t('profile_menu_help_subtitle'),
      onPress: () => navigation.navigate('SupportTickets'),
    },
  ] as const;

  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.gray100 }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.contentContainer}>
        <ImageBackground
          source={profileBackground}
          style={[styles.hero, { backgroundColor: theme.colors.primary }]}
          imageStyle={[styles.heroImage, { tintColor: theme.colors.primaryPressed }]}
        >
          <View style={styles.profileRow}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.avatarImage} />
            ) : (
              <View style={[styles.avatarCircle, { backgroundColor: theme.colors.surface }]}>
                <Text weight="semiBold" color={theme.colors.brandInk} style={styles.avatarText}>
                  {initials}
                </Text>
              </View>
            )}
            <View style={styles.profileTextWrap}>
              <Text weight="semiBold" style={[styles.profileName, { color: theme.colors.gray900 }]}>
                {profileName}
              </Text>
              <Text style={[styles.profileId, { color: theme.colors.gray600 }]}>{`ID-${riderId.toString().slice(0, 4)}`}</Text>
            </View>
          </View>
        </ImageBackground>

        <View style={[styles.availabilityCard, { borderColor: theme.colors.gray300, backgroundColor: theme.colors.surface }]}>
          <View style={styles.availabilityLeft}>
            <View style={[styles.iconCircle, { backgroundColor: theme.colors.tertiary }]}>
              <Image
                source={rowIcons.clock}
                style={styles.rowIconImage}
                resizeMode="contain"
                tintColor={theme.colors.brandInk}
              />
            </View>
            <View style={styles.menuTextWrap}>
              <Text weight="semiBold" style={[styles.menuTitle, { color: theme.colors.gray900 }]}>
                {t('menu_availability')}
              </Text>
              <Text style={[styles.menuSubtitle, { color: theme.colors.gray600 }]}>{t('profile_availability_subtitle')}</Text>
            </View>
          </View>
          <View style={styles.availabilityRight}>
            <ToggleSwitch value={availability} onValueChange={setAvailability} disabled={isAvailabilityPending} />
            <Text style={[styles.availableText, { color: theme.colors.gray600 }]}>
              {availability ? t('menu_available') : t('menu_unavailable')}
            </Text>
          </View>
        </View>

        <Text weight="medium" style={[styles.sectionTitle, { color: theme.colors.gray600 }]}>
          {t('profile_account_settings')}
        </Text>

        <View style={[styles.cardGroup, { borderColor: theme.colors.gray300, backgroundColor: theme.colors.surface }]}>
          <Pressable style={[styles.menuRow, styles.menuRowDivider, { borderBottomColor: theme.colors.gray200 }]} onPress={() => navigation.navigate('ProfileDetails')}>
            <View style={[styles.iconCircle, { backgroundColor: theme.colors.tertiary }]}>
              <Image
                source={rowIcons.user}
                style={styles.rowIconImage}
                resizeMode="contain"
                tintColor={theme.colors.brandInk}
              />
            </View>
            <View style={styles.menuTextWrap}>
              <Text weight="semiBold" style={[styles.menuTitle, { color: theme.colors.gray900 }]}>
                {t('profile_user_profile')}
              </Text>
              <Text style={[styles.menuSubtitle, { color: theme.colors.gray500 }]}>{t('profile_user_profile_subtitle')}</Text>
            </View>
            <Text style={[styles.chevron, { color: theme.colors.gray900 }]}>{'>'}</Text>
          </Pressable>

          {menuPrimary.map((item, index) => (
            <MenuRow
              key={item.key}
              icon={item.icon}
              title={item.title}
              subtitle={item.subtitle}
              onPress={item.onPress}
              showDivider={index < menuPrimary.length - 1}
            />
          ))}
        </View>

        <View style={[styles.cardGroup, { borderColor: theme.colors.gray300, backgroundColor: theme.colors.surface }]}>
          {menuSecondary.map((item, index) => (
            <MenuRow
              key={item.key}
              icon={item.icon}
              title={item.title}
              subtitle={item.subtitle}
              onPress={item.onPress}
              showDivider={index < menuSecondary.length - 1}
            />
          ))}
        </View>

        <Pressable
          style={[styles.logoutCard, { borderColor: theme.colors.gray300, backgroundColor: theme.colors.red100 }]}
          onPress={confirmLogout}
          disabled={isLoggingOut}
        >
          <View style={[styles.iconCircleDanger, { backgroundColor: theme.colors.surface }]}>
            <Image source={rowIcons.logout} style={styles.rowIconImage} resizeMode="contain" />
          </View>
          <View style={styles.menuTextWrap}>
            <Text weight="semiBold" style={[styles.logoutTitle, { color: theme.colors.red500 }]}>
              {isLoggingOut ? t('auth_logout_loading') : t('auth_logout')}
            </Text>
            <Text style={[styles.menuSubtitle, { color: theme.colors.gray600 }]}>{t('profile_logout_subtitle')}</Text>
          </View>
          <Text style={[styles.chevron, { color: theme.colors.gray900 }]}>{'>'}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

type MenuRowProps = {
  icon: 'globe' | 'vehicle-type' | 'credit-card' | 'clock' | 'list' | 'shield' | 'info' | 'help-circle';
  title: string;
  subtitle: string;
  onPress?: (() => void) | undefined;
  showDivider?: boolean;
};

function MenuRow({ icon, title, subtitle, onPress, showDivider = false }: MenuRowProps) {
  const { theme } = useAppTheme();
  const iconSource =
    icon === 'globe'
      ? rowIcons.globe
      : icon === 'vehicle-type'
        ? rowIcons.vehicle
      : icon === 'credit-card'
        ? rowIcons.card
        : icon === 'clock'
          ? rowIcons.schedule
          : icon === 'list'
            ? rowIcons.list
            : icon === 'shield'
              ? rowIcons.shield
              : icon === 'info'
                ? rowIcons.info
                : rowIcons.help;

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.menuRow,
        showDivider ? styles.menuRowDivider : null,
        showDivider ? { borderBottomColor: theme.colors.gray200 } : null,
      ]}
    >
      <View style={[styles.iconCircle, { backgroundColor: theme.colors.tertiary }]}>
        <Image
          source={iconSource}
          style={styles.rowIconImage}
          resizeMode="contain"
          tintColor={theme.colors.brandInk}
        />
      </View>
      <View style={styles.menuTextWrap}>
        <Text weight="semiBold" style={[styles.menuTitle, { color: theme.colors.gray900 }]}>
          {title}
        </Text>
        <Text style={[styles.menuSubtitle, { color: theme.colors.gray500 }]}>{subtitle}</Text>
      </View>
      <Text style={[styles.chevron, { color: theme.colors.gray900 }]}>{'>'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  contentContainer: {
    paddingBottom: 120,
    gap: 12,
  },
  hero: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    height: 150,
    justifyContent: 'center',
    paddingHorizontal: 16,
    overflow: 'hidden',
    marginTop: 6,
  },
  heroImage: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  avatarText: {
    fontSize: 16,
    lineHeight: 24,
  },
  profileTextWrap: {
    gap: 4,
  },
  profileName: {
    fontSize: 16,
    lineHeight: 24,
  },
  profileId: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  availabilityCard: {
    marginHorizontal: 16,
    marginTop: -34,
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  availabilityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  availabilityRight: {
    alignItems: 'center',
    gap: 6,
  },
  availableText: {
    fontSize: 12,
    lineHeight: 16,
  },
  sectionTitle: {
    marginHorizontal: 16,
    marginTop: 4,
    fontSize: 14,
    lineHeight: 20,
  },
  cardGroup: {
    marginHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
    paddingHorizontal: 16,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 16,
  },
  menuRowDivider: {
    borderBottomWidth: 1,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleDanger: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowIconImage: {
    width: 18,
    height: 18,
  },
  menuTextWrap: {
    flex: 1,
    gap: 4,
  },
  menuTitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  menuSubtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  logoutCard: {
    marginHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  logoutTitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  chevron: {
    fontSize: 22,
    lineHeight: 22,
  },
});
