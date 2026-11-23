import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Text from '../../../components/Text';
import { useAppTheme } from '../../../theme/ThemeProvider';
import { useTranslations } from '../../../localization/LocalizationProvider';

type Props = { title: string; onBackPress: () => void };

export default function ProfileScreenHeader({ title, onBackPress }: Props) {
  const { theme } = useAppTheme();
  const { t } = useTranslations('app');
  return (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('wallet_back')}
        onPress={onBackPress}
        style={({ pressed }) => [styles.backButton, { backgroundColor: pressed ? theme.colors.gray200 : theme.colors.gray100 }]}
      >
        <Feather name="arrow-left" size={22} color={theme.colors.gray900} />
      </Pressable>
      <Text weight="semiBold" color={theme.colors.gray900} style={styles.title} numberOfLines={1}>{title}</Text>
      <View style={styles.spacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { minHeight: 64, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  backButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, textAlign: 'center', fontSize: 17, lineHeight: 24 },
  spacer: { width: 40 },
});
