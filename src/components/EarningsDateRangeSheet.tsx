import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import Text from './Text';
import { useTranslations } from '../localization/LocalizationProvider';
import { useAppTheme } from '../theme/ThemeProvider';
import { isValidEarningsDate } from '../utils/earningsDates';

type Props = {
  visible: boolean;
  startDate?: string;
  endDate?: string;
  onApply: (startDate: string, endDate: string) => void;
  onClear: () => void;
  onClose: () => void;
};

export default function EarningsDateRangeSheet({ visible, startDate, endDate, onApply, onClear, onClose }: Props) {
  const { theme } = useAppTheme();
  const { t } = useTranslations('app');
  const [start, setStart] = useState(startDate ?? '');
  const [end, setEnd] = useState(endDate ?? '');
  const [error, setError] = useState(false);

  useEffect(() => {
    if (visible) {
      setStart(startDate ?? '');
      setEnd(endDate ?? '');
      setError(false);
    }
  }, [visible, startDate, endDate]);

  const apply = () => {
    const from = start.trim();
    const to = end.trim();
    if (!isValidEarningsDate(from) || !isValidEarningsDate(to) || from > to) {
      setError(true);
      return;
    }
    onApply(from, to);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: theme.colors.white }]}>
          <View style={styles.heading}>
            <Text variant="body" weight="semiBold" color={theme.colors.gray900}>{t('earnings_filter_title')}</Text>
            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close filter" hitSlop={12}>
              <Text variant="body" color={theme.colors.gray700}>×</Text>
            </Pressable>
          </View>
          <View style={styles.fields}>
            {([
              [t('earnings_start_date'), start, setStart],
              [t('earnings_end_date'), end, setEnd],
            ] as const).map(([label, value, setValue]) => (
              <View key={label} style={styles.field}>
                <Text variant="caption" color={theme.colors.gray700}>{label}</Text>
                <TextInput
                  value={value}
                  onChangeText={(next) => { setValue(next); setError(false); }}
                  placeholder={t('earnings_date_hint')}
                  placeholderTextColor={theme.colors.gray500}
                  keyboardType="numbers-and-punctuation"
                  maxLength={10}
                  accessibilityLabel={label}
                  style={[styles.input, { borderColor: error ? theme.colors.gray900 : theme.colors.gray300, color: theme.colors.gray900 }]}
                />
              </View>
            ))}
          </View>
          {error ? <Text variant="caption" color={theme.colors.gray900}>{t('earnings_date_error')}</Text> : null}
          <Pressable style={[styles.apply, { backgroundColor: theme.colors.blue500 }]} onPress={apply} accessibilityRole="button">
            <Text variant="body" weight="semiBold" color={theme.colors.white}>{t('earnings_apply_filter')}</Text>
          </Pressable>
          <Pressable style={styles.clear} onPress={onClear} accessibilityRole="button">
            <Text variant="body" color={theme.colors.gray700}>{t('earnings_clear_filter')}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.34)' },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 20, paddingTop: 22, paddingBottom: 36, gap: 18 },
  heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  fields: { flexDirection: 'row', gap: 12 },
  field: { flex: 1, gap: 8 },
  input: { borderWidth: 1, borderRadius: 12, minHeight: 48, paddingHorizontal: 12, fontSize: 16 },
  apply: { minHeight: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  clear: { minHeight: 36, alignItems: 'center', justifyContent: 'center' },
});
