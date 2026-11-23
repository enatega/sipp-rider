import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Text from '../../../components/Text';
import { useAppTheme } from '../../../theme/ThemeProvider';

type Props = { title: string; amountLabel: string; statusLabel: string; dateLabel: string };

export default function PendingWithdrawalCard({ title, amountLabel, statusLabel, dateLabel }: Props) {
  const { theme } = useAppTheme();
  return (
    <View style={[styles.card, { backgroundColor: theme.colors.amber100 }]}>
      <View style={[styles.iconTile, { backgroundColor: theme.colors.white }]}>
        <Feather name="clock" size={18} color={theme.colors.amber800} />
      </View>
      <View style={styles.copy}>
        <Text weight="semiBold" color={theme.colors.amber800}>{title}</Text>
        <Text variant="caption" color={theme.colors.amber800}>{amountLabel} · {statusLabel}</Text>
        <Text variant="caption" color={theme.colors.amber800} style={styles.date}>{dateLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, padding: 14 },
  iconTile: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, gap: 2 },
  date: { opacity: 0.8 },
});
