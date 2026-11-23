import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Text from '../../../components/Text';
import { useAppTheme } from '../../../theme/ThemeProvider';
import type { DeliveryProblemReason } from '../../../api/deliveryProblemService';

const REASON_ICONS: Record<DeliveryProblemReason, React.ComponentProps<typeof Feather>['name']> = {
  customer_unreachable: 'phone-missed',
  address_access: 'map-pin',
  vehicle: 'tool',
  safety: 'shield',
  other: 'more-horizontal',
};

type Props = { reason: DeliveryProblemReason; label: string; isSelected: boolean; onPress: () => void };

export default function ProblemReasonOption({ reason, label, isSelected, onPress }: Props) {
  const { theme } = useAppTheme();
  const isSafety = reason === 'safety';
  const tile = isSafety
    ? { background: theme.colors.red100, foreground: theme.colors.red800 }
    : { background: theme.colors.primarySoft, foreground: theme.colors.brandInk };

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: isSelected }}
      onPress={onPress}
      style={[
        styles.row,
        {
          backgroundColor: isSelected ? theme.colors.primarySoft : theme.colors.surface,
          borderColor: isSelected ? theme.colors.brandInk : theme.colors.gray200,
          borderWidth: isSelected ? 1.5 : 1,
        },
      ]}
    >
      <View style={[styles.iconTile, { backgroundColor: isSelected ? theme.colors.surface : tile.background }]}>
        <Feather name={REASON_ICONS[reason]} size={20} color={tile.foreground} />
      </View>
      <Text weight={isSelected ? 'bold' : 'medium'} color={theme.colors.gray900} style={styles.label}>{label}</Text>
      <Feather name={isSelected ? 'check-circle' : 'circle'} size={22} color={isSelected ? theme.colors.brandInk : theme.colors.gray300} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 16, padding: 12, minHeight: 64 },
  iconTile: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  label: { flex: 1 },
});
