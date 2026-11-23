import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Text from '../../../components/Text';
import { useAppTheme } from '../../../theme/ThemeProvider';

type Props = { title: string; body: string; currencyLabel: string; currency: string };

export default function BankIntroCard({ title, body, currencyLabel, currency }: Props) {
  const { theme } = useAppTheme();
  return (
    <View style={[styles.card, { backgroundColor: theme.colors.primarySoft }]}>
      <View style={[styles.iconTile, { backgroundColor: theme.colors.white }]}>
        <Feather name="shield" size={20} color={theme.colors.brandInk} />
      </View>
      <View style={styles.copy}>
        <Text weight="semiBold" color={theme.colors.gray900}>{title}</Text>
        <Text variant="caption" color={theme.colors.gray700}>{body}</Text>
        {currency ? (
          <View style={[styles.pill, { backgroundColor: theme.colors.white }]}>
            <Text variant="caption" color={theme.colors.gray600}>{currencyLabel}</Text>
            <Text variant="caption" weight="bold" color={theme.colors.gray900}>{currency}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', gap: 12, borderRadius: 18, padding: 16 },
  iconTile: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, gap: 4 },
  pill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, marginTop: 4 },
});
