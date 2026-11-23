import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View, type TextInput as RNTextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Button from '../components/Button';
import Sidebar from '../components/Sidebar';
import Text from '../components/Text';
import { useUpdateBankDetailsMutation } from '../hooks/useBankDetailsMutations';
import { useBankDetailsQuery } from '../hooks/useBankDetailsQuery';
import { useSidebar } from '../hooks/useSidebar';
import { useTranslations } from '../localization/LocalizationProvider';
import { MainStackParamList } from '../navigation/types';
import { useAppTheme } from '../theme/ThemeProvider';
import { UpdateBankDetailsPayload } from '../api/bankDetailsTypes';
import { useAppCurrency } from '../hooks/useCurrency';
import BankField from './bank/components/BankField';
import BankFormSection from './bank/components/BankFormSection';
import BankIntroCard from './bank/components/BankIntroCard';
import BankNotice from './bank/components/BankNotice';

type BankFormState = Required<UpdateBankDetailsPayload>;
type BankFormErrors = Partial<Record<keyof BankFormState, string>>;
type RequiredField = 'bankName' | 'accountTitle' | 'iban' | 'accountNumber';

const EMPTY_FORM: BankFormState = { bankName: '', accountTitle: '', accountNumber: '', iban: '', currency: '', accountCode: '' };
const REQUIRED_FIELDS: RequiredField[] = ['bankName', 'accountTitle', 'iban', 'accountNumber'];

export default function BankManagementScreen() {
  const { theme } = useAppTheme();
  const { t } = useTranslations('app');
  const { code: activeCurrencyCode } = useAppCurrency();
  const sidebar = useSidebar();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const bankDetailsQuery = useBankDetailsQuery();
  const updateBankDetailsMutation = useUpdateBankDetailsMutation();
  const bankDetails = bankDetailsQuery.data?.data;
  const [form, setForm] = useState<BankFormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<BankFormErrors>({});
  const [successMessage, setSuccessMessage] = useState('');
  const holderRef = useRef<RNTextInput>(null);
  const ibanRef = useRef<RNTextInput>(null);
  const accountNumberRef = useRef<RNTextInput>(null);
  const accountCodeRef = useRef<RNTextInput>(null);

  const savedForm = useMemo<BankFormState>(() => bankDetails ? {
    bankName: bankDetails.bankName,
    accountTitle: bankDetails.accountTitle,
    accountNumber: bankDetails.accountNumber,
    iban: bankDetails.iban,
    currency: bankDetails.currency,
    accountCode: bankDetails.accountCode,
  } : EMPTY_FORM, [bankDetails]);

  useEffect(() => { setForm(savedForm); }, [savedForm]);

  const isDirty = (Object.keys(savedForm) as Array<keyof BankFormState>).some((key) => (form[key] ?? '').trim() !== (savedForm[key] ?? '').trim());
  const currency = form.currency.trim() || bankDetails?.currency || activeCurrencyCode;

  const onChangeField = (field: keyof BankFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
    setSuccessMessage('');
    updateBankDetailsMutation.reset();
  };

  const validateField = (field: RequiredField) => {
    setErrors((prev) => ({ ...prev, [field]: form[field].trim() ? '' : t('bank_required_field') }));
  };

  // Optional: only checked when the rider types something.
  const getAccountCodeError = (value: string) => {
    const code = value.trim();
    return code && (code.length < 2 || code.length > 10) ? t('bank_account_code_length') : '';
  };

  const validate = (): boolean => {
    const nextErrors: BankFormErrors = {};
    REQUIRED_FIELDS.forEach((field) => { if (!form[field].trim()) nextErrors[field] = t('bank_required_field'); });
    const accountCodeError = getAccountCodeError(form.accountCode);
    if (accountCodeError) nextErrors.accountCode = accountCodeError;
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
        currency,
        ...(form.accountCode.trim() ? { accountCode: form.accountCode.trim() } : {}),
      });
      setSuccessMessage(response.message);
    } catch {
      // Error surfaced through mutation state.
    }
  };

  const isSaving = updateBankDetailsMutation.isPending;
  const errorMessage = updateBankDetailsMutation.error?.message;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" onPress={sidebar.openSidebar} hitSlop={8} style={styles.menuButton}>
          <HamburgerIcon color={theme.colors.gray900} />
        </Pressable>
        <Text weight="semiBold" color={theme.colors.gray900} style={styles.headerTitle}>{t('menu_bank_management')}</Text>
        <View style={styles.menuButton} />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {bankDetailsQuery.isLoading ? (
          <View style={styles.centerState}><ActivityIndicator color={theme.colors.brandInk} /></View>
        ) : bankDetailsQuery.isError ? (
          <View style={styles.centerState}>
            <Text color={theme.colors.gray600}>{t('bank_load_error')}</Text>
            <Button variant="secondary" label={t('wallet_retry')} onPress={() => void bankDetailsQuery.refetch()} containerStyle={styles.retryButton} />
          </View>
        ) : (
          <ScrollView style={styles.flex} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <BankIntroCard title={t('bank_intro_title')} body={t('bank_intro_body')} currencyLabel={t('bank_currency_label')} currency={currency} />

            <BankFormSection title={t('bank_section_holder')}>
              <BankField
                label={t('bank_bank_name_label')}
                placeholder={t('bank_bank_name_placeholder')}
                value={form.bankName}
                onChangeText={(value) => onChangeField('bankName', value)}
                onBlur={() => validateField('bankName')}
                error={errors.bankName}
                autoCapitalize="words"
                returnKeyType="next"
                onSubmitEditing={() => holderRef.current?.focus()}
              />
              <BankField
                label={t('bank_holder_name_label')}
                placeholder={t('bank_holder_name_placeholder')}
                inputRef={holderRef}
                value={form.accountTitle}
                onChangeText={(value) => onChangeField('accountTitle', value)}
                onBlur={() => validateField('accountTitle')}
                error={errors.accountTitle}
                autoCapitalize="words"
                returnKeyType="next"
                onSubmitEditing={() => ibanRef.current?.focus()}
              />
            </BankFormSection>

            <BankFormSection title={t('bank_section_account')}>
              <BankField
                label={t('bank_iban_label')}
                placeholder={t('bank_iban_placeholder')}
                inputRef={ibanRef}
                value={form.iban}
                onChangeText={(value) => onChangeField('iban', value)}
                onBlur={() => validateField('iban')}
                error={errors.iban}
                autoCapitalize="characters"
                autoCorrect={false}
                returnKeyType="next"
                onSubmitEditing={() => accountNumberRef.current?.focus()}
              />
              <BankField
                label={t('bank_account_number_label')}
                placeholder={t('bank_account_number_placeholder')}
                inputRef={accountNumberRef}
                value={form.accountNumber}
                onChangeText={(value) => onChangeField('accountNumber', value)}
                onBlur={() => validateField('accountNumber')}
                error={errors.accountNumber}
                keyboardType="number-pad"
                returnKeyType="next"
                onSubmitEditing={() => accountCodeRef.current?.focus()}
              />
              <BankField
                label={t('bank_account_code_label')}
                optionalLabel={t('bank_optional')}
                placeholder={t('bank_account_code_placeholder')}
                inputRef={accountCodeRef}
                value={form.accountCode}
                onChangeText={(value) => onChangeField('accountCode', value)}
                onBlur={() => setErrors((prev) => ({ ...prev, accountCode: getAccountCodeError(form.accountCode) }))}
                error={errors.accountCode}
                autoCapitalize="characters"
                maxLength={10}
                returnKeyType="done"
                onSubmitEditing={() => void onConfirm()}
              />
            </BankFormSection>
          </ScrollView>
        )}

        <View style={[styles.footer, { backgroundColor: theme.colors.background, borderTopColor: theme.colors.gray200 }]}>
          {errorMessage ? <BankNotice tone="error" message={errorMessage} /> : null}
          {successMessage && !isDirty ? <BankNotice tone="success" message={successMessage} /> : null}
          <Button
            label={isSaving ? t('bank_updating_button') : t('bank_save_button')}
            onPress={onConfirm}
            disabled={isSaving || bankDetailsQuery.isLoading || bankDetailsQuery.isError || !isDirty}
            textColor={theme.colors.black}
            containerStyle={styles.confirmButton}
          />
        </View>
      </KeyboardAvoidingView>

      <Sidebar
        visible={sidebar.sidebarOpen}
        availability={sidebar.availability}
        isAvailabilityPending={sidebar.isAvailabilityPending}
        onAvailabilityChange={sidebar.setAvailability}
        onClose={sidebar.closeSidebar}
        onNavigate={(screen) => navigation.navigate(screen)}
        onSwitchTab={() => navigation.navigate('Home', { screen: 'ProfileTab' })}
      />
    </SafeAreaView>
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
  flex: { flex: 1 },
  header: { minHeight: 56, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 17, lineHeight: 24 },
  menuButton: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24, gap: 20 },
  centerState: { flex: 1, minHeight: 220, alignItems: 'center', justifyContent: 'center', gap: 16, paddingHorizontal: 24 },
  retryButton: { alignSelf: 'stretch' },
  footer: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, gap: 10, borderTopWidth: StyleSheet.hairlineWidth },
  confirmButton: { height: 54, borderRadius: 14 },
});
