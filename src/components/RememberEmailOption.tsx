import React from 'react';
import { Pressable, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Text from './Text';
import { useAppTheme } from '../theme/ThemeProvider';
import { useTranslations } from '../localization/LocalizationProvider';

type Props = { checked: boolean; disabled: boolean; onPress: () => void };
export default function RememberEmailOption({ checked, disabled, onPress }: Props) {
  const { theme } = useAppTheme();
  const { t } = useTranslations('app');
  return <Pressable accessibilityRole="checkbox" accessibilityState={{ checked, disabled }}
    disabled={disabled} onPress={onPress} style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
    <Feather name={checked ? 'check-square' : 'square'} size={22} color={theme.colors.brandInk} />
    <View style={{ flex: 1 }}><Text>{t('auth_remember_me')}</Text></View>
  </Pressable>;
}
