import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Text from '../../components/Text';
import { useTranslations } from '../../localization/LocalizationProvider';
import { useAppTheme } from '../../theme/ThemeProvider';
import DrivingLicenseBottomSheet from './components/DrivingLicenseBottomSheet';
import VehiclePlateBottomSheet from './components/VehiclePlateBottomSheet';
import { useRiderProfileQuery } from '../../hooks/useRiderProfileQuery';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../navigation/types';

export default function ProfileDetailsScreen() {
  const { t } = useTranslations('app');
  const { theme } = useAppTheme();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const profileQuery = useRiderProfileQuery();
  const [isDrivingLicenseSheetVisible, setDrivingLicenseSheetVisible] = useState(false);
  const [isVehiclePlateSheetVisible, setVehiclePlateSheetVisible] = useState(false);
  const [hasProfileImageError, setHasProfileImageError] = useState(false);

  const profile = profileQuery.data;
  const profileName = profile?.userName?.trim() || t('profile_name');
  const profileId =
    profile?.riderCode?.trim() ||
    profile?.riderId?.trim() ||
    profile?.userId?.trim() ||
    t('profile_id');
  const profileEmail = profile?.email?.trim() || t('status_unknown');
  const profileMobile = profile?.mobileNumber?.trim() || t('status_unknown');
  const drivingLicenseNumber = profile?.drivingLicense?.licenseNo?.trim() || '';
  const vehiclePlateNumber = profile?.vehiclePlate?.plateNo?.trim() || '';

  const hasDrivingLicenseDocs = Boolean(
    profile?.drivingLicense?.registrationDocument?.front ||
      profile?.drivingLicense?.registrationDocument?.back,
  );
  const hasVehiclePlateDocs = Boolean(
    profile?.vehiclePlate?.registrationDocument?.front ||
      profile?.vehiclePlate?.registrationDocument?.back,
  );

  const hasDrivingLicenseData = Boolean(drivingLicenseNumber || hasDrivingLicenseDocs);
  const hasVehiclePlateData = Boolean(vehiclePlateNumber || hasVehiclePlateDocs);

  const profileInitials = useMemo(() => getInitials(profileName), [profileName]);
  const shouldShowProfileImage = Boolean(profile?.profileImage) && !hasProfileImageError;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton} accessibilityRole="button">
          <Text weight="bold" style={[styles.backIcon, { color: theme.colors.gray900 }]}>{'‹'}</Text>
        </Pressable>
        <Text weight="semiBold" style={[styles.headerTitle, { color: theme.colors.gray900 }]}>
          {t('menu_profile')}
        </Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileHeader}>
          <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
            {shouldShowProfileImage ? (
              <Image
                source={{ uri: profile?.profileImage ?? '' }}
                style={styles.avatarImage}
                resizeMode="cover"
                onError={() => setHasProfileImageError(true)}
              />
            ) : (
              <Text weight="semiBold" color={theme.colors.white}>{profileInitials}</Text>
            )}
          </View>
          <View style={styles.profileMeta}>
            <Text weight="semiBold" style={styles.name}>{profileName}</Text>
            <Text weight="medium" style={{ color: theme.colors.gray600 }}>{`id:: ${profileId}`}</Text>
          </View>
        </View>

        <ProfileStatusRow
          title={t('profile_driving_license')}
          action={t('profile_add')}
          hasData={hasDrivingLicenseData}
          valueText={drivingLicenseNumber}
          onPressAction={() => setDrivingLicenseSheetVisible(true)}
        />
        <ProfileStatusRow
          title={t('profile_vehicle_plate')}
          action={t('profile_add')}
          hasData={hasVehiclePlateData}
          valueText={vehiclePlateNumber}
          onPressAction={() => setVehiclePlateSheetVisible(true)}
        />

        <Text weight="semiBold" style={[styles.sectionTitle, { color: theme.colors.gray900 }]}>
          {t('profile_other_information')}
        </Text>

        {profileQuery.isLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={theme.colors.primary} />
          </View>
        ) : null}

        {profileQuery.isError ? (
          <Text variant="caption" color={theme.colors.red500}>
            {profileQuery.error?.message || t('status_unknown')}
          </Text>
        ) : null}

        <InfoCard label={t('profile_email')} value={profileEmail} />
        <InfoCard
          label={t('profile_password')}
          value={t('profile_password_value')}
          action={t('profile_change')}
          onPressAction={() => navigation.navigate('UpdatePassword')}
        />
        <InfoCard label={t('profile_mobile_number')} value={profileMobile} />
      </ScrollView>

      <DrivingLicenseBottomSheet
        visible={isDrivingLicenseSheetVisible}
        onClose={() => setDrivingLicenseSheetVisible(false)}
        initialLicenseNumber={drivingLicenseNumber}
        initialFrontImageUri={profile?.drivingLicense?.registrationDocument?.front ?? null}
        initialBackImageUri={profile?.drivingLicense?.registrationDocument?.back ?? null}
      />
      <VehiclePlateBottomSheet
        visible={isVehiclePlateSheetVisible}
        onClose={() => setVehiclePlateSheetVisible(false)}
        initialVehicleNo={vehiclePlateNumber}
        initialFrontImageUri={profile?.vehiclePlate?.registrationDocument?.front ?? null}
        initialBackImageUri={profile?.vehiclePlate?.registrationDocument?.back ?? null}
      />
    </SafeAreaView>
  );
}

function ProfileStatusRow({
  title,
  action,
  hasData,
  valueText,
  onPressAction,
}: {
  title: string;
  action: string;
  hasData: boolean;
  valueText?: string;
  onPressAction: () => void;
}) {
  const { theme } = useAppTheme();
  const { t } = useTranslations('app');

  return (
    <View style={[styles.rowBlock, { borderBottomColor: theme.colors.gray300 }]}>
      <View style={styles.rowHeader}>
        <Text weight="semiBold">{title}</Text>
        <Pressable onPress={onPressAction}>
          <Text weight="medium" style={{ color: theme.colors.blue400 }}>{action}</Text>
        </Pressable>
      </View>
      <View
        style={[
          styles.badge,
          { backgroundColor: hasData ? theme.colors.emerald100 : theme.colors.red100 },
        ]}
      >
        <Text
          weight="medium"
          style={{ color: hasData ? theme.colors.emerald900 : theme.colors.red800 }}
        >
          {hasData ? valueText || t('profile_add') : t('profile_missing_data')}
        </Text>
      </View>
    </View>
  );
}

function InfoCard({
  label,
  value,
  action,
  onPressAction,
}: {
  label: string;
  value: string;
  action?: string;
  onPressAction?: () => void;
}) {
  const { theme } = useAppTheme();

  return (
    <View style={[styles.infoCard, { backgroundColor: theme.colors.gray100, borderColor: theme.colors.gray200 }]}>
      <View style={styles.infoHeader}>
        <Text>{label}</Text>
        {action ? (
          <Pressable onPress={onPressAction}>
            <Text weight="medium" style={{ color: theme.colors.blue400 }}>{action}</Text>
          </Pressable>
        ) : null}
      </View>
      <Text weight="bold">{value}</Text>
    </View>
  );
}

function getInitials(name: string): string {
  const parts = name
    .split(' ')
    .map((part) => part.trim())
    .filter(Boolean);

  if (!parts.length) return 'NA';

  return parts
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    minHeight: 56,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 20,
    lineHeight: 20,
  },
  headerTitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  content: { padding: 16, paddingTop: 16, paddingBottom: 24, gap: 16 },
  profileHeader: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingBottom: 8 },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 54,
    height: 54,
  },
  profileMeta: { gap: 4 },
  name: { fontSize: 16, lineHeight: 24 },
  rowBlock: { borderBottomWidth: 1, paddingVertical: 8, gap: 16 },
  rowHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  badge: { paddingHorizontal: 12, paddingVertical: 2, borderRadius: 12, alignSelf: 'flex-start' },
  sectionTitle: { marginTop: 8, fontSize: 18, lineHeight: 28 },
  infoCard: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 17, paddingVertical: 9, gap: 6 },
  infoHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  loadingWrap: {
    paddingVertical: 8,
    alignItems: 'center',
  },
});
