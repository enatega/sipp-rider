import React from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
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
  confirmLabel: string;
  availableLabel: string;
  enterAmountLabel: string;
  isLoading: boolean;
  errorMessage?: string;
  bottomInset?: number;
};

export default function WithdrawBottomSheet({
  visible,
  availableAmount,
  amountInput,
  onAmountInputChange,
  onClose,
  onConfirm,
  confirmLabel,
  availableLabel,
  enterAmountLabel,
  isLoading,
  errorMessage,
  bottomInset = 0,
}: Props) {
  const { theme } = useAppTheme();
  const { formatCurrency, symbol } = useAppCurrency();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable onPress={(event) => event.stopPropagation()}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.bottomContainer}
          >
          <View
            style={[
              styles.sheet,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.gray300,
                paddingBottom: Math.max(bottomInset + 8, 12),
              },
            ]}
          >
            <View style={styles.rowBetween}>
              <Text style={[styles.rowLabel, { color: theme.colors.gray600 }]}>{availableLabel}</Text>
              <Text weight="bold" style={styles.rowAmount}>{formatCurrency(availableAmount)}</Text>
            </View>

            <View style={[styles.separator, { backgroundColor: theme.colors.gray300 }]} />

            <View style={styles.inputBlock}>
              <Text weight="semiBold" style={[styles.inputLabel, { color: theme.colors.gray600 }]}>
                {enterAmountLabel}
              </Text>
              <TextInput
                value={amountInput}
                onChangeText={onAmountInputChange}
                keyboardType="decimal-pad"
                placeholder={`${symbol}0.00`}
                placeholderTextColor={theme.colors.gray500}
                style={[
                  styles.input,
                  {
                    color: theme.colors.gray500,
                    borderColor: theme.colors.gray300,
                    backgroundColor: theme.colors.white,
                  },
                ]}
              />
            </View>

            {errorMessage ? (
              <Text style={[styles.error, { color: theme.colors.red500 }]}>{errorMessage}</Text>
            ) : null}

            <View style={[styles.separator, { backgroundColor: theme.colors.gray300 }]} />

            <View style={styles.buttonWrap}>
              <Button
                label={confirmLabel}
                onPress={onConfirm}
                disabled={isLoading}
                textColor={theme.colors.gray900}
                containerStyle={styles.confirmButton}
              />
              {isLoading ? (
                <View style={styles.loaderOverlay}>
                  <ActivityIndicator color={theme.colors.gray900} />
                </View>
              ) : null}
            </View>
          </View>
          </KeyboardAvoidingView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(17, 17, 17, 0.4)',
    justifyContent: 'flex-end',
  },
  bottomContainer: {
    width: '100%',
  },
  sheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    paddingTop: 24,
    paddingHorizontal: 16,
    paddingBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
    gap: 16,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowLabel: {
    flex: 1,
    fontSize: 16,
    lineHeight: 18,
  },
  rowAmount: {
    flex: 1,
    textAlign: 'right',
    fontSize: 16,
    lineHeight: 22,
  },
  separator: {
    height: 1,
    width: '100%',
  },
  inputBlock: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 16,
    lineHeight: 18,
  },
  input: {
    height: 42,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 17,
    fontSize: 16,
    lineHeight: 24,
  },
  buttonWrap: {
    position: 'relative',
  },
  error: {
    fontSize: 14,
    lineHeight: 20,
  },
  confirmButton: {
    height: 54,
    borderRadius: 40,
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
