import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Text from '../../components/Text';
import Button from '../../components/Button';
import { useTranslations } from '../../localization/LocalizationProvider';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useRiderProfileQuery } from '../../hooks/useRiderProfileQuery';
import { MainStackParamList } from '../../navigation/types';
import DrivingLicenseBottomSheet from './components/DrivingLicenseBottomSheet';
import VehiclePlateBottomSheet from './components/VehiclePlateBottomSheet';
import ProfileScreenHeader from './components/ProfileScreenHeader';
import ProfileIdentityCard from './components/ProfileIdentityCard';
import ProfileDocumentCard from './components/ProfileDocumentCard';
import ProfileInfoCard from './components/ProfileInfoCard';

type DocumentSheet = 'license' | 'plate' | null;

export default function ProfileDetailsScreen() {
  const { t } = useTranslations('app');
  const { theme } = useAppTheme();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const profileQuery = useRiderProfileQuery();
  const [openSheet, setOpenSheet] = useState<DocumentSheet>(null);

  const profile = profileQuery.data;
  const licenseDocs = profile?.drivingLicense?.registrationDocument;
  const plateDocs = profile?.vehiclePlate?.registrationDocument;
  const licenseNumber = profile?.drivingLicense?.licenseNo?.trim() || '';
  const plateNumber = profile?.vehiclePlate?.plateNo?.trim() || '';
  const hasLicenseDocs = Boolean(licenseDocs?.front || licenseDocs?.back);
  const hasPlateDocs = Boolean(plateDocs?.front || plateDocs?.back);
  const profileId = profile?.riderCode?.trim() || profile?.riderId?.trim() || profile?.userId?.trim() || t('profile_id');
  const closeSheet = () => setOpenSheet(null);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <ProfileScreenHeader title={t('menu_profile')} onBackPress={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ProfileIdentityCard
          name={profile?.userName?.trim() || t('profile_name')}
          idLabel={`${t('profile_id_label')} ${profileId}`}
          imageUri={profile?.profileImage}
        />

        {profileQuery.isLoading ? <ActivityIndicator style={styles.loader} color={theme.colors.brandInk} /> : null}

        {profileQuery.isError ? (
          <View style={[styles.errorCard, { backgroundColor: theme.colors.red100 }]}>
            <Text color={theme.colors.red800}>{profileQuery.error?.message || t('status_unknown')}</Text>
            <Button variant="secondary" label={t('wallet_retry')} onPress={() => void profileQuery.refetch()} />
          </View>
        ) : null}

        {!profileQuery.isLoading && !profileQuery.isError ? (
          <>
            <SectionTitle title={t('profile_documents_section')} />
            <View style={styles.group}>
              <ProfileDocumentCard
                icon="credit-card"
                title={t('profile_driving_license')}
                numberText={licenseNumber}
                isComplete={hasLicenseDocs}
                statusLabel={t(hasLicenseDocs ? 'profile_documents_uploaded' : 'profile_missing_data')}
                actionLabel={t(licenseNumber || hasLicenseDocs ? 'profile_edit' : 'profile_add')}
                onPress={() => setOpenSheet('license')}
              />
              <ProfileDocumentCard
                icon="truck"
                title={t('profile_vehicle_plate')}
                numberText={plateNumber}
                isComplete={hasPlateDocs}
                statusLabel={t(hasPlateDocs ? 'profile_documents_uploaded' : 'profile_missing_data')}
                actionLabel={t(plateNumber || hasPlateDocs ? 'profile_edit' : 'profile_add')}
                onPress={() => setOpenSheet('plate')}
              />
            </View>
          </>
        ) : null}

        <SectionTitle title={t('profile_account_section')} />
        <ProfileInfoCard
          rows={[
            { key: 'email', icon: 'mail', label: t('profile_email'), value: profile?.email?.trim() || t('status_unknown') },
            { key: 'mobile', icon: 'phone', label: t('profile_mobile_number'), value: profile?.mobileNumber?.trim() || t('status_unknown') },
            {
              key: 'password',
              icon: 'lock',
              label: t('profile_password'),
              value: t('profile_password_value'),
              actionLabel: t('profile_change'),
              onActionPress: () => navigation.navigate('UpdatePassword'),
            },
          ]}
        />
      </ScrollView>

      {openSheet === 'license' ? (
        <DrivingLicenseBottomSheet
          visible
          onClose={closeSheet}
          initialLicenseNumber={licenseNumber}
          initialFrontImageUri={licenseDocs?.front ?? null}
          initialBackImageUri={licenseDocs?.back ?? null}
        />
      ) : null}
      {openSheet === 'plate' ? (
        <VehiclePlateBottomSheet
          visible
          onClose={closeSheet}
          initialVehicleNo={plateNumber}
          initialFrontImageUri={plateDocs?.front ?? null}
          initialBackImageUri={plateDocs?.back ?? null}
        />
      ) : null}
    </SafeAreaView>
  );
}

function SectionTitle({ title }: { title: string }) {
  const { theme } = useAppTheme();
  return <Text weight="bold" color={theme.colors.gray900} style={styles.sectionTitle}>{title}</Text>;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 32, gap: 12 },
  loader: { paddingVertical: 12 },
  errorCard: { borderRadius: 16, padding: 16, gap: 12 },
  sectionTitle: { fontSize: 18, lineHeight: 26, marginTop: 8 },
  group: { gap: 12 },
});
