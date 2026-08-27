import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Button from '../components/Button';
import Sidebar from '../components/Sidebar';
import Text from '../components/Text';
import TextInput from '../components/TextInput';
import { useUpdateBankDetailsMutation } from '../hooks/useBankDetailsMutations';
import { useBankDetailsQuery } from '../hooks/useBankDetailsQuery';
import { useSidebar } from '../hooks/useSidebar';
import { useTranslations } from '../localization/LocalizationProvider';
import { MainStackParamList } from '../navigation/types';
import { useAppTheme } from '../theme/ThemeProvider';
import { UpdateBankDetailsPayload } from '../api/bankDetailsTypes';

type BankFormState = UpdateBankDetailsPayload;
type BankFormErrors = Partial<Record<keyof BankFormState, string>>;

export default function BankManagementScreen() {
  const { theme } = useAppTheme();
  const { t } = useTranslations('app');
  const sidebar = useSidebar();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const bankDetailsQuery = useBankDetailsQuery();
  const updateBankDetailsMutation = useUpdateBankDetailsMutation();
  const bankDetails = bankDetailsQuery.data?.data;
  const [form, setForm] = useState<BankFormState>({
    bankName: '',
    accountTitle: '',
    accountNumber: '',
    iban: '',
    currency: 'USD',
    accountCode: '',
  });
  const [errors, setErrors] = useState<BankFormErrors>({});
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (!bankDetails) return;
    setForm({
      bankName: bankDetails.bankName,
      accountTitle: bankDetails.accountTitle,
      accountNumber: bankDetails.accountNumber,
      iban: bankDetails.iban,
      currency: bankDetails.currency,
      accountCode: bankDetails.accountCode,
    });
  }, [bankDetails]);

  const onChangeField = (field: keyof BankFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
    setSuccessMessage('');
  };

  const validate = (): boolean => {
    const nextErrors: BankFormErrors = {};

    if (!form.bankName.trim()) nextErrors.bankName = t('bank_required_field');
    if (!form.accountTitle.trim()) nextErrors.accountTitle = t('bank_required_field');
    if (!form.accountNumber.trim()) nextErrors.accountNumber = t('bank_required_field');
    if (!form.iban.trim()) nextErrors.iban = t('bank_required_field');

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const onConfirm = async () => {
    if (!validate()) return;
    try {
      const response = await updateBankDetailsMutation.mutateAsync({
        bankName: form.bankName.trim(),
        accountTitle: form.accountTitle.trim(),
        accountNumber: form.accountNumber.trim(),
        iban: form.iban.trim(),
        currency: form.currency.trim() || bankDetails?.currency || 'USD',
        accountCode: form.accountCode.trim(),
      });
      setSuccessMessage(response.message);
    } catch {
      // Error surfaced through mutation state.
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top', 'bottom']}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <Pressable onPress={sidebar.openSidebar} style={styles.menuButton}>
          <HamburgerIcon color={theme.colors.gray900} />
        </Pressable>
        <Text
          weight="semiBold"
          style={{ color: theme.colors.gray900, fontSize: theme.typography.size.md, lineHeight: theme.typography.lineHeight.md }}
        >
          {t('menu_bank_management')}
        </Text>
        <View style={styles.menuButton} />
      </View>

      <View style={styles.content}>
        {bankDetailsQuery.isLoading ? (
          <View style={styles.centerState}>
            <ActivityIndicator color={theme.colors.primary} />
          </View>
        ) : bankDetailsQuery.isError ? (
          <View style={styles.centerState}>
            <Text style={{ color: theme.colors.gray600 }}>{t('status_unknown')}</Text>
          </View>
        ) : (
          <>
            <FormField label={t('bank_bank_name_label')}>
              <TextInput
                value={form.bankName}
                onChangeText={(value) => onChangeField('bankName', value)}
                error={errors.bankName}
              />
            </FormField>

            <FormField label={t('bank_holder_name_label')}>
              <TextInput
                value={form.accountTitle}
                onChangeText={(value) => onChangeField('accountTitle', value)}
                error={errors.accountTitle}
              />
            </FormField>

            <FormField label={t('bank_iban_label')}>
              <TextInput
                value={form.iban}
                onChangeText={(value) => onChangeField('iban', value)}
                error={errors.iban}
                autoCapitalize="characters"
              />
            </FormField>

            <FormField label={t('bank_account_number_label')}>
              <TextInput
                value={form.accountNumber}
                onChangeText={(value) => onChangeField('accountNumber', value)}
                error={errors.accountNumber}
                keyboardType="number-pad"
              />
            </FormField>

            <FormField label={t('bank_account_code_label')}>
              <TextInput
                value={form.accountCode}
                onChangeText={(value) => onChangeField('accountCode', value)}
              />
            </FormField>

            {updateBankDetailsMutation.error?.message ? (
              <View
                style={[
                  styles.messageWrap,
                  {
                    borderColor: theme.colors.red500,
                  },
                ]}
              >
                <Text variant="caption" color={theme.colors.red500}>
                  {updateBankDetailsMutation.error.message}
                </Text>
              </View>
            ) : null}

            {successMessage ? (
              <View style={[styles.messageWrap, { borderColor: theme.colors.emerald500 }]}>
                <Text variant="caption" color={theme.colors.emerald900}>
                  {successMessage}
                </Text>
              </View>
            ) : null}
          </>
        )}
      </View>

      <View style={styles.footer}>
        <Button
          label={updateBankDetailsMutation.isPending ? t('bank_updating_button') : t('bank_confirm_button')}
          onPress={onConfirm}
          disabled={updateBankDetailsMutation.isPending || bankDetailsQuery.isLoading}
          textColor={theme.colors.gray900}
          containerStyle={styles.confirmButton}
        />
      </View>

      <Sidebar
        visible={sidebar.sidebarOpen}
        availability={sidebar.availability}
        onAvailabilityChange={sidebar.setAvailability}
        onClose={sidebar.closeSidebar}
        onNavigate={(screen) => navigation.navigate(screen)}
        onSwitchTab={() => navigation.navigate('Home', { screen: 'ProfileTab' })}
      />
    </SafeAreaView>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  const { theme } = useAppTheme();
  return (
    <View style={styles.field}>
      <Text
        weight="medium"
        style={{ color: theme.colors.gray600, fontSize: theme.typography.size.sm, lineHeight: 20 }}
      >
        {label}
      </Text>
      {children}
    </View>
  );
}

function HamburgerIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M4.5 7.5H19.5M4.5 12H19.5M4.5 16.5H19.5" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
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
  menuButton: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  content: {
    marginTop: 40,
    paddingHorizontal: 16,
    gap: 10,
  },
  field: {
    gap: 8,
    paddingBottom: 16,
  },
  footer: {
    marginTop: 'auto',
    paddingHorizontal: 16,
    paddingBottom: 32,
    paddingTop: 12,
  },
  confirmButton: {
    height: 54,
    borderRadius: 40,
  },
  centerState: {
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageWrap: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
});
