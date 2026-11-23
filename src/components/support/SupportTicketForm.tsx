import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Text from '../Text';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useTranslations } from '../../localization/LocalizationProvider';

const reasons = ['using_the_app', 'payments_and_payouts', 'technical_issues', 'account_setup', 'other'] as const;
type Reason = (typeof reasons)[number];
type Props = {
  initialEmail: string;
  isSubmitting: boolean;
  onSubmit: (email: string, reason: Reason, description: string) => Promise<void>;
};

export default function SupportTicketForm({ initialEmail, isSubmitting, onSubmit }: Props) {
  const { theme } = useAppTheme();
  const { t } = useTranslations('app');
  const [email, setEmail] = useState(initialEmail);
  const [reason, setReason] = useState<Reason | null>(null);
  const [description, setDescription] = useState('');
  const [submitError, setSubmitError] = useState(false);
  useEffect(() => { if (!email && initialEmail) setEmail(initialEmail); }, [email, initialEmail]);
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && reason && description.trim().length > 0;

  const submit = async () => {
    if (!valid || isSubmitting || !reason) return;
    setSubmitError(false);
    try { await onSubmit(email.trim(), reason, description.trim()); }
    catch { setSubmitError(true); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: theme.colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.intro}>
          <Text weight="bold" style={[styles.title, { color: theme.colors.gray900 }]}>{t('support_form_heading')}</Text>
          <Text style={[styles.subtitle, { color: theme.colors.gray600 }]}>{t('support_form_subtitle')}</Text>
        </View>

        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.gray200 }]}>
          <Text weight="semiBold" style={[styles.label, { color: theme.colors.gray900 }]}>{t('support_email')}</Text>
          <TextInput value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none"
            autoCorrect={false} placeholder={t('support_email_hint')} placeholderTextColor={theme.colors.gray400}
            style={[styles.input, { backgroundColor: theme.colors.gray50, borderColor: theme.colors.gray200, color: theme.colors.gray900 }]} />
          <Text style={{ color: theme.colors.gray600 }}>{t('support_email_note')}</Text>
        </View>

        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.gray200 }]}>
          <Text weight="semiBold" style={[styles.label, { color: theme.colors.gray900 }]}>{t('support_reason')}</Text>
          <Text style={{ color: theme.colors.gray600 }}>{t('support_reason_hint')}</Text>
          <View style={styles.reasonList}>
            {reasons.map((item, index) => (
              <Pressable key={item} accessibilityRole="radio" accessibilityState={{ checked: reason === item }}
                onPress={() => setReason(item)} style={[styles.reasonRow, { borderTopColor: theme.colors.gray200, borderTopWidth: index ? StyleSheet.hairlineWidth : 0 }]}>
                <View style={[styles.radio, { borderColor: reason === item ? theme.colors.brandInk : theme.colors.gray400 }]}>
                  {reason === item && <View style={[styles.radioFill, { backgroundColor: theme.colors.brandInk }]} />}
                </View>
                <Text weight={reason === item ? 'semiBold' : 'regular'} style={[styles.reasonText, { color: theme.colors.gray900 }]}>{t(`support_reason_${item}`)}</Text>
                <Ionicons name="chevron-forward" size={18} color={theme.colors.gray400} />
              </Pressable>
            ))}
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.gray200 }]}>
          <Text weight="semiBold" style={[styles.label, { color: theme.colors.gray900 }]}>{t('support_description')}</Text>
          <TextInput multiline value={description} onChangeText={setDescription} maxLength={2000}
            placeholder={t('support_description_hint')} placeholderTextColor={theme.colors.gray400}
            style={[styles.description, { backgroundColor: theme.colors.gray50, borderColor: theme.colors.gray200, color: theme.colors.gray900 }]} />
          <Text style={[styles.counter, { color: theme.colors.gray500 }]}>{description.length}/2000</Text>
        </View>

        {submitError && <View style={[styles.error, { backgroundColor: theme.colors.amber100 }]}><Text style={{ color: theme.colors.amber800 }}>{t('support_submit_failed')}</Text></View>}
      </ScrollView>
      <View style={[styles.footer, { backgroundColor: theme.colors.background, borderColor: theme.colors.gray200 }]}>
        <Pressable accessibilityRole="button" accessibilityState={{ disabled: !valid || isSubmitting }} disabled={!valid || isSubmitting}
          onPress={() => void submit()} style={[styles.submit, { backgroundColor: theme.colors.primary, opacity: valid && !isSubmitting ? 1 : 0.5 }]}>
          <Text weight="bold" style={{ color: theme.colors.gray900 }}>{isSubmitting ? t('support_sending') : t('support_submit')}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 30, gap: 16 }, intro: { gap: 5, paddingVertical: 4 },
  title: { fontSize: 22, lineHeight: 28 }, subtitle: { lineHeight: 21 },
  card: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 10 }, label: { fontSize: 16 },
  input: { height: 50, borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, fontSize: 15 },
  reasonList: { marginTop: 4 }, reasonRow: { minHeight: 50, flexDirection: 'row', alignItems: 'center', gap: 12 },
  reasonText: { flex: 1 }, radio: { height: 20, width: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioFill: { height: 10, width: 10, borderRadius: 5 }, description: { minHeight: 144, borderWidth: 1, borderRadius: 10, padding: 14, textAlignVertical: 'top', fontSize: 15 },
  counter: { textAlign: 'right' }, error: { borderRadius: 10, padding: 12 },
  footer: { borderTopWidth: StyleSheet.hairlineWidth, padding: 16, paddingBottom: 12 }, submit: { minHeight: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
