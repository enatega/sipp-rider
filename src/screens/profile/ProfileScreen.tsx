import React, { useState } from 'react';
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
import { useLogoutMutation } from '../../hooks/useAuthMutations';
import { MainStackParamList } from '../../navigation/types';

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
  const logoutMutation = useLogoutMutation();
  const [availability, setAvailability] = useState(true);

  if (profileLoading) {
    return (
      <View style={[styles.flex, styles.center, { backgroundColor: theme.colors.gray100 }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
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
        Alert.alert('Unable to open link', url);
        return;
      }
      await Linking.openURL(url);
    } catch {
      Alert.alert('Unable to open link', url);
    }
  };

  const menuPrimary = [
    {
      key: 'language',
      icon: 'globe',
      title: 'Language',
      subtitle: 'Choose your preferred language',
      onPress: () => navigation.navigate('Language'),
    },
    {
      key: 'vehicle-type',
      icon: 'vehicle-type',
      title: 'Vehicle Type',
      subtitle: 'Choose your delivery vehicle',
      onPress: () => navigation.navigate('VehicleType'),
    },
    {
      key: 'bank',
      icon: 'credit-card',
      title: 'Bank Management',
      subtitle: 'Manage your bank accounts',
      onPress: () => navigation.navigate('BankManagement'),
    },
    {
      key: 'schedule',
      icon: 'clock',
      title: 'Work schedule',
      subtitle: 'Set your working hours and days',
      onPress: () => navigation.navigate('WorkSchedule'),
    },
    
  ] as const;

  const menuSecondary = [
    {
      key: 'privacy',
      icon: 'shield',
      title: 'Privacy Policy',
      subtitle: 'Read our privacy policy',
      onPress: () => openExternalUrl('https://multivendor.enatega.com/privacy'),
    },
    {
      key: 'about',
      icon: 'info',
      title: 'About Us',
      subtitle: 'Learn more about our company',
      onPress: () => openExternalUrl('https://multivendor.enatega.com/about'),
    },
    {
      key: 'help',
      icon: 'help-circle',
      title: 'Help',
      subtitle: 'Get help and support',
      onPress: () => openExternalUrl('https://ninjascode.com/'),
    },
  ] as const;

  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.gray100 }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.contentContainer}>
        <ImageBackground
          source={profileBackground}
          style={[styles.hero, { backgroundColor: theme.colors.primary }]}
          imageStyle={[styles.heroImage, { tintColor: theme.colors.primary }]}
        >
          <View style={styles.profileRow}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.avatarImage} />
            ) : (
              <View style={[styles.avatarCircle, { backgroundColor: theme.colors.surface }]}>
                <Text weight="semiBold" color={theme.colors.primary} style={styles.avatarText}>
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
                tintColor={theme.colors.primary}
              />
            </View>
            <View style={styles.menuTextWrap}>
              <Text weight="semiBold" style={[styles.menuTitle, { color: theme.colors.gray900 }]}>
                Availability
              </Text>
              <Text style={[styles.menuSubtitle, { color: theme.colors.gray600 }]}>Let others know you&apos;re available</Text>
            </View>
          </View>
          <View style={styles.availabilityRight}>
            <ToggleSwitch value={availability} onValueChange={setAvailability} />
            <Text style={[styles.availableText, { color: theme.colors.gray600 }]}>
              {availability ? t('menu_available') : t('menu_unavailable')}
            </Text>
          </View>
        </View>

        <Text weight="medium" style={[styles.sectionTitle, { color: theme.colors.gray600 }]}>
          Account &amp; Settings
        </Text>

        <View style={[styles.cardGroup, { borderColor: theme.colors.gray300, backgroundColor: theme.colors.surface }]}>
          <Pressable style={[styles.menuRow, styles.menuRowDivider, { borderBottomColor: theme.colors.gray200 }]} onPress={() => navigation.navigate('ProfileDetails')}>
            <View style={[styles.iconCircle, { backgroundColor: theme.colors.tertiary }]}>
              <Image
                source={rowIcons.user}
                style={styles.rowIconImage}
                resizeMode="contain"
                tintColor={theme.colors.primary}
              />
            </View>
            <View style={styles.menuTextWrap}>
              <Text weight="semiBold" style={[styles.menuTitle, { color: theme.colors.gray900 }]}>
                User Profile
              </Text>
              <Text style={[styles.menuSubtitle, { color: theme.colors.gray500 }]}>Tap to view profile details</Text>
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
          onPress={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
        >
          <View style={[styles.iconCircleDanger, { backgroundColor: theme.colors.surface }]}>
            <Image source={rowIcons.logout} style={styles.rowIconImage} resizeMode="contain" />
          </View>
          <View style={styles.menuTextWrap}>
            <Text weight="semiBold" style={[styles.logoutTitle, { color: theme.colors.red500 }]}>
              {logoutMutation.isPending ? t('auth_logout_loading') : t('auth_logout')}
            </Text>
            <Text style={[styles.menuSubtitle, { color: theme.colors.gray600 }]}>Sign out from your account</Text>
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
          tintColor={theme.colors.primary}
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
