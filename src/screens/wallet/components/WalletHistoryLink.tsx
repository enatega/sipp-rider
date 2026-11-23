import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Text from '../../../components/Text';
import { useAppTheme } from '../../../theme/ThemeProvider';

type Props = { title: string; hint: string; onPress: () => void };

export default function WalletHistoryLink({ title, hint, onPress }: Props) {
  const { theme } = useAppTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, { borderColor: theme.colors.gray200, backgroundColor: pressed ? theme.colors.gray100 : theme.colors.surface }]}
    >
      <View style={[styles.iconTile, { backgroundColor: theme.colors.sky100 }]}>
        <Feather name="file-text" size={20} color={theme.colors.sky600} />
      </View>
      <View style={styles.copy}>
        <Text weight="semiBold" color={theme.colors.gray900}>{title}</Text>
        <Text variant="caption" color={theme.colors.gray600}>{hint}</Text>
      </View>
      <Feather name="chevron-right" size={20} color={theme.colors.gray500} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderRadius: 16, padding: 14 },
  iconTile: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, gap: 2 },
});
