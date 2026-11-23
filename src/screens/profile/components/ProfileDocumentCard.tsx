import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Text from '../../../components/Text';
import { useAppTheme } from '../../../theme/ThemeProvider';

type Props = {
  icon: React.ComponentProps<typeof Feather>['name'];
  title: string;
  numberText?: string;
  statusLabel: string;
  isComplete: boolean;
  actionLabel: string;
  onPress: () => void;
};

export default function ProfileDocumentCard({ icon, title, numberText, statusLabel, isComplete, actionLabel, onPress }: Props) {
  const { theme } = useAppTheme();
  const tone = isComplete
    ? { background: theme.colors.emerald100, foreground: theme.colors.emerald900 }
    : { background: theme.colors.red100, foreground: theme.colors.red800 };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${actionLabel}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, { borderColor: theme.colors.gray200, backgroundColor: pressed ? theme.colors.gray100 : theme.colors.surface }]}
    >
      <View style={[styles.iconTile, { backgroundColor: theme.colors.sky100 }]}>
        <Feather name={icon} size={20} color={theme.colors.sky600} />
      </View>
      <View style={styles.copy}>
        <Text weight="semiBold" color={theme.colors.gray900}>{title}</Text>
        {numberText ? <Text variant="caption" color={theme.colors.gray600} numberOfLines={1}>{numberText}</Text> : null}
        <View style={[styles.status, { backgroundColor: tone.background }]}>
          <Feather name={isComplete ? 'check-circle' : 'alert-circle'} size={12} color={tone.foreground} />
          <Text variant="caption" weight="semiBold" color={tone.foreground}>{statusLabel}</Text>
        </View>
      </View>
      <View style={[styles.action, { backgroundColor: theme.colors.gray100 }]}>
        <Text variant="caption" weight="semiBold" color={theme.colors.gray900}>{actionLabel}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderRadius: 18, padding: 14 },
  iconTile: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, gap: 4 },
  status: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3, marginTop: 2 },
  action: { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
});
