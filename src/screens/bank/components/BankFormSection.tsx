import React from 'react';
import { StyleSheet, View } from 'react-native';
import Text from '../../../components/Text';
import { useAppTheme } from '../../../theme/ThemeProvider';

type Props = { title: string; children: React.ReactNode };

export default function BankFormSection({ title, children }: Props) {
  const { theme } = useAppTheme();
  return (
    <View style={styles.section}>
      <Text variant="caption" weight="semiBold" color={theme.colors.gray600} style={styles.title}>{title}</Text>
      <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.gray200 }]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 8 },
  title: { textTransform: 'uppercase', letterSpacing: 0.6, paddingHorizontal: 4 },
  card: { borderWidth: 1, borderRadius: 18, padding: 16, gap: 16 },
});
