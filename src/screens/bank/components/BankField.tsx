import React from 'react';
import { StyleSheet, View } from 'react-native';
import Text from '../../../components/Text';
import TextInput from '../../../components/TextInput';
import { useAppTheme } from '../../../theme/ThemeProvider';
import type { TextInputProps as RNTextInputProps, TextInput as RNTextInput } from 'react-native';

type Props = Omit<RNTextInputProps, 'style'> & {
  label: string;
  optionalLabel?: string;
  error?: string;
  inputRef?: React.Ref<RNTextInput>;
};

export default function BankField({ label, optionalLabel, error, inputRef, ...inputProps }: Props) {
  const { theme } = useAppTheme();
  return (
    <View style={styles.field}>
      <View style={styles.labelRow}>
        <Text variant="label" weight="semiBold" color={theme.colors.gray700}>{label}</Text>
        {optionalLabel ? <Text variant="caption" color={theme.colors.gray500}>{optionalLabel}</Text> : null}
      </View>
      <TextInput inputRef={inputRef} error={error} accessibilityLabel={label} {...inputProps} />
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 8 },
  labelRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 },
});
