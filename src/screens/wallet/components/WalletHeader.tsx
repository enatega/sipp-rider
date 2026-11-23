import React from 'react';
import { Pressable, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Text from '../../../components/Text';
import { useAppTheme } from '../../../theme/ThemeProvider';
import { useTranslations } from '../../../localization/LocalizationProvider';

type Props = { title: string; onBackPress?: () => void };
export default function WalletHeader({ title, onBackPress }: Props) {
  const { theme } = useAppTheme();
  const { t } = useTranslations('app');
  return <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12 }}>
    {onBackPress ? <Pressable accessibilityRole="button" accessibilityLabel={t('wallet_back')} onPress={onBackPress}
      style={({ pressed }) => ({ width: 44, height: 44, borderRadius: 22, backgroundColor: pressed ? theme.colors.gray200 : theme.colors.gray100, alignItems: 'center', justifyContent: 'center' })}>
      <Feather name="arrow-left" size={22} color={theme.colors.gray900} />
    </Pressable> : null}
    <Text weight="bold" style={{ flex: 1, fontSize: 24, lineHeight: 32 }}>{title}</Text>
  </View>;
}
