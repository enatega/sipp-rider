import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Text from './Text';
import { useAppTheme } from '../theme/ThemeProvider';

type Props = {
  label: string;
  /** Present once a report exists, e.g. "Awaiting review". */
  statusLabel?: string;
  onPress: () => void;
};

/** Entry point on the order sheet: calm and secondary until a report exists, then a status summary. */
export default function DeliveryProblemAction({ label, statusLabel, onPress }: Props) {
  const { theme } = useAppTheme();
  const hasReport = Boolean(statusLabel);
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, { borderColor: theme.colors.gray200, backgroundColor: pressed ? theme.colors.gray100 : theme.colors.surface }]}
    >
      <View style={[styles.iconTile, { backgroundColor: hasReport ? theme.colors.sky100 : theme.colors.amber100 }]}>
        <Feather name={hasReport ? 'file-text' : 'alert-triangle'} size={18} color={hasReport ? theme.colors.sky600 : theme.colors.amber800} />
      </View>
      <View style={styles.copy}>
        <Text variant="label" weight="semiBold" color={theme.colors.gray900}>{label}</Text>
        {statusLabel ? <Text variant="caption" color={theme.colors.gray600}>{statusLabel}</Text> : null}
      </View>
      <Feather name="chevron-right" size={18} color={theme.colors.gray500} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, marginVertical: 8 },
  iconTile: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, gap: 1 },
});
