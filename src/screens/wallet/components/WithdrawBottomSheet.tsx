import React from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import Button from '../../../components/Button';
import Text from '../../../components/Text';
import { useAppTheme } from '../../../theme/ThemeProvider';
import { useAppCurrency } from '../../../hooks/useCurrency';

type Props = {
  visible: boolean;
  availableAmount: number;
  amountInput: string;
  onAmountInputChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
  titleLabel: string;
  subtitleLabel: string;
  confirmLabel: string;
  availableLabel: string;
  enterAmountLabel: string;
  maxLabel: string;
  closeLabel: string;
  isLoading: boolean;
  errorMessage?: string;
  bottomInset?: number;
};

const QUICK_FRACTIONS = [0.25, 0.5] as const;
// Round to cents first so float noise (1234.57 * 100 = 123456.999…) can't drop a cent.
const toAmountInput = (value: number) => (Math.floor(Math.round(value * 10000) / 100) / 100).toFixed(2);

export default function WithdrawBottomSheet({
  visible, availableAmount, amountInput, onAmountInputChange, onClose, onConfirm,
  titleLabel, subtitleLabel, confirmLabel, availableLabel, enterAmountLabel, maxLabel, closeLabel,
  isLoading, errorMessage, bottomInset = 0,
}: Props) {
  const { theme } = useAppTheme();
  const { formatCurrency, symbol } = useAppCurrency();
  const hasError = Boolean(errorMessage);
  const chipStyle = [styles.chip, { borderColor: theme.colors.gray200, backgroundColor: theme.colors.gray50 }];

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent navigationBarTranslucent onRequestClose={onClose}>
      <KeyboardAvoidingView style={[styles.backdrop, { backgroundColor: theme.colors.modalBackdrop }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Pressable style={StyleSheet.absoluteFill} onPress={isLoading ? undefined : onClose} accessibilityLabel={closeLabel} />
        <ScrollView keyboardShouldPersistTaps="handled" bounces={false} style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <View style={[styles.sheet, { backgroundColor: theme.colors.surface, paddingBottom: Math.max(bottomInset, 16) + 8 }]}>
            <View style={[styles.handle, { backgroundColor: theme.colors.gray300 }]} />
            <View style={styles.headerRow}>
              <View style={styles.headerCopy}>
                <Text weight="bold" color={theme.colors.gray900} style={styles.title}>{titleLabel}</Text>
                <Text variant="caption" color={theme.colors.gray600}>{subtitleLabel}</Text>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel={closeLabel} onPress={onClose} disabled={isLoading} hitSlop={8}
                style={[styles.closeButton, { backgroundColor: theme.colors.gray100 }]}>
                <Feather name="x" size={18} color={theme.colors.gray900} />
              </Pressable>
            </View>

            <View style={[styles.availableCard, { backgroundColor: theme.colors.sky100 }]}>
              <Text variant="label" color={theme.colors.gray700}>{availableLabel}</Text>
              <Text weight="bold" color={theme.colors.gray900}>{formatCurrency(availableAmount)}</Text>
            </View>

            <View style={styles.inputBlock}>
              <Text variant="label" weight="semiBold" color={theme.colors.gray600}>{enterAmountLabel}</Text>
              <View style={[styles.amountField, { borderColor: hasError ? theme.colors.red500 : theme.colors.gray300, backgroundColor: theme.colors.surface }]}>
                <Text weight="bold" color={theme.colors.gray600} style={styles.symbol}>{symbol}</Text>
                <TextInput
                  autoFocus
                  value={amountInput}
                  onChangeText={onAmountInputChange}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={theme.colors.gray400}
                  accessibilityLabel={enterAmountLabel}
                  style={[styles.amountInput, { color: theme.colors.gray900 }]}
                />
              </View>
              <View style={styles.chipRow}>
                {QUICK_FRACTIONS.map((fraction) => (
                  <Pressable key={fraction} accessibilityRole="button" onPress={() => onAmountInputChange(toAmountInput(availableAmount * fraction))} style={chipStyle}>
                    <Text variant="caption" weight="semiBold" color={theme.colors.gray900}>{`${fraction * 100}%`}</Text>
                  </Pressable>
                ))}
                <Pressable accessibilityRole="button" onPress={() => onAmountInputChange(toAmountInput(availableAmount))} style={chipStyle}>
                  <Text variant="caption" weight="semiBold" color={theme.colors.gray900}>{maxLabel}</Text>
                </Pressable>
              </View>
              {hasError ? (
                <View accessibilityRole="alert" style={styles.errorRow}>
                  <Feather name="alert-circle" size={15} color={theme.colors.red500} />
                  <Text variant="caption" color={theme.colors.red500} style={styles.errorText}>{errorMessage}</Text>
                </View>
              ) : null}
            </View>

            <View>
              <Button label={confirmLabel} onPress={onConfirm} disabled={isLoading} textColor={theme.colors.black} containerStyle={styles.confirmButton} />
              {isLoading ? <View style={styles.loaderOverlay}><ActivityIndicator color={theme.colors.black} /></View> : null}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 10, gap: 18 },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  headerCopy: { flex: 1, gap: 2 },
  title: { fontSize: 22, lineHeight: 30 },
  closeButton: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  availableCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12 },
  inputBlock: { gap: 10 },
  amountField: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1.5, borderRadius: 16, paddingHorizontal: 16, minHeight: 68 },
  symbol: { fontSize: 24, lineHeight: 32 },
  amountInput: { flex: 1, fontSize: 32, lineHeight: 40, fontWeight: '700', padding: 0, fontVariant: ['tabular-nums'] },
  chipRow: { flexDirection: 'row', gap: 8 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8 },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  errorText: { flex: 1 },
  confirmButton: { height: 54, borderRadius: 14 },
  loaderOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
});
