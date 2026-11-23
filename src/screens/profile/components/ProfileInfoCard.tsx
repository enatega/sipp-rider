import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Text from '../../../components/Text';
import { useAppTheme } from '../../../theme/ThemeProvider';

export type ProfileInfoRow = {
  key: string;
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  value: string;
  actionLabel?: string;
  onActionPress?: () => void;
};

export default function ProfileInfoCard({ rows }: { rows: ProfileInfoRow[] }) {
  const { theme } = useAppTheme();
  return (
    <View style={[styles.card, { borderColor: theme.colors.gray200, backgroundColor: theme.colors.surface }]}>
      {rows.map((row, index) => (
        <View key={row.key} style={[styles.row, index > 0 && { borderTopColor: theme.colors.gray200, borderTopWidth: StyleSheet.hairlineWidth }]}>
          <View style={[styles.iconTile, { backgroundColor: theme.colors.gray100 }]}>
            <Feather name={row.icon} size={18} color={theme.colors.gray700} />
          </View>
          <View style={styles.copy}>
            <Text variant="caption" color={theme.colors.gray600}>{row.label}</Text>
            <Text weight="semiBold" color={theme.colors.gray900} numberOfLines={1}>{row.value}</Text>
          </View>
          {row.actionLabel ? (
            <Pressable accessibilityRole="button" onPress={row.onActionPress} hitSlop={8} style={[styles.action, { backgroundColor: theme.colors.primarySoft }]}>
              <Text variant="caption" weight="semiBold" color={theme.colors.brandInk}>{row.actionLabel}</Text>
            </Pressable>
          ) : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 18, paddingHorizontal: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 },
  iconTile: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, gap: 2 },
  action: { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
});
