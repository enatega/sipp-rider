import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Text from '../../../components/Text';
import { useAppTheme } from '../../../theme/ThemeProvider';

interface Props {
  title: string;
  distanceLabel: string;
  etaLabel: string | null;
  exitLabel: string;
  onExit: () => void;
}

export default function NavigationInfoCard({ title, distanceLabel, etaLabel, exitLabel, onExit }: Props) {
  const { theme } = useAppTheme();

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface, shadowColor: theme.colors.shadow }]}>
      <View style={styles.copy}>
        <Text variant="caption" weight="semiBold" color={theme.colors.gray600} numberOfLines={1}>{title}</Text>
        <Text variant="subtitle" weight="bold" color={theme.colors.gray900} numberOfLines={1}>{distanceLabel}</Text>
        {etaLabel ? <Text variant="caption" color={theme.colors.gray600} numberOfLines={1}>{etaLabel}</Text> : null}
      </View>
      <Pressable
        onPress={onExit}
        accessibilityRole="button"
        accessibilityLabel={exitLabel}
        style={[styles.exit, { backgroundColor: theme.colors.gray100 }]}
      >
        <Text variant="caption" weight="semiBold" color={theme.colors.gray900}>{exitLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 4,
  },
  copy: { flex: 1, minWidth: 0, gap: 2 },
  exit: { minHeight: 36, borderRadius: 18, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
});
