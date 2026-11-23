import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Text from '../Text';
import { useAppTheme } from '../../theme/ThemeProvider';

type Props = { title: string; backLabel: string; onBack: () => void };

export default function SupportPageHeader({ title, backLabel, onBack }: Props) {
  const { theme } = useAppTheme();
  return (
    <View style={[styles.header, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.gray200 }]}>
      <Pressable accessibilityRole="button" accessibilityLabel={backLabel} hitSlop={12} onPress={onBack}
        style={[styles.back, { backgroundColor: theme.colors.gray50 }]}>
        <Ionicons name="arrow-back" size={22} color={theme.colors.gray900} />
      </Pressable>
      <Text weight="bold" style={[styles.title, { color: theme.colors.gray900 }]} numberOfLines={1}>{title}</Text>
      <View style={styles.side} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { height: 60, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  back: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, textAlign: 'center', fontSize: 19 }, side: { width: 44 },
});
