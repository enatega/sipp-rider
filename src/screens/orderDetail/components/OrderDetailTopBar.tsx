import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Text from '../../../components/Text';
import { useAppTheme } from '../../../theme/ThemeProvider';
import { useTranslations } from '../../../localization/LocalizationProvider';

type Props = {
  title: string;
  onBack: () => void;
};

export default function OrderDetailTopBar({ title, onBack }: Props) {
  const { theme } = useAppTheme();
  const { t } = useTranslations('app');

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.white }]}>
      <Pressable style={styles.iconButton} onPress={onBack} accessibilityRole="button" accessibilityLabel={t('order_back')}>
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
          <Path
            d="M15 18L9 12L15 6"
            stroke={theme.colors.gray900}
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </Pressable>

      <Text variant="body" weight="bold" color={theme.colors.gray900} numberOfLines={1} style={styles.title}>
        {title}
      </Text>

      <View style={styles.iconButton} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { flex: 1, textAlign: 'center' },
});
