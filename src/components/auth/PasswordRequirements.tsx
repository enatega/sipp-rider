import React from 'react';
import { StyleSheet, View } from 'react-native';
import AuthIcon from './AuthIcon';
import Text from '../Text';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useTranslations } from '../../localization/LocalizationProvider';
import { PASSWORD_RULES, PasswordRule } from '../../auth/credentialRules';

const RULE_LABELS: Record<PasswordRule, string> = {
  length: 'reset_rule_length',
  uppercase: 'reset_rule_uppercase',
  lowercase: 'reset_rule_lowercase',
  number: 'reset_rule_number',
};

/** Live checklist of the password rules the server enforces. */
export default function PasswordRequirements({ password }: { password: string }) {
  const { theme } = useAppTheme();
  const { t } = useTranslations('app');

  return (
    <View style={styles.list}>
      {(Object.keys(PASSWORD_RULES) as PasswordRule[]).map((rule) => {
        const met = PASSWORD_RULES[rule](password);
        const color = met ? theme.colors.green600 : theme.colors.gray500;
        return (
          <View key={rule} style={styles.item} accessibilityState={{ checked: met }}>
            <AuthIcon name={met ? 'check-circle' : 'circle'} size={16} color={color} />
            <Text variant="caption" color={color}>{t(RULE_LABELS[rule])}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 6, marginTop: -6 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
