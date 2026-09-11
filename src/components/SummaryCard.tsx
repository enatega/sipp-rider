import React from 'react';
import { StyleSheet, View } from 'react-native';
import Text from './Text';
import { useAppTheme } from '../theme/ThemeProvider';
import { typography } from '../theme/typography';

export type SummaryCardItem = {
  label: string;
  value: string;
};

type Props = {
  title?: string;
  items: SummaryCardItem[];
};

export default function SummaryCard({ title = 'Summary', items }: Props) {
  const { theme } = useAppTheme();

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.gray100 }]}>
      <Text variant="body" weight="medium" color={theme.colors.gray700} style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.itemsRow}>
        {items.map((item, index) => (
          <React.Fragment key={item.label}>
            {index > 0 ? <View style={[styles.divider, { backgroundColor: theme.colors.gray300 }]} /> : null}
            <View style={styles.item}>
              <Text variant="caption" color={theme.colors.gray700} style={styles.label} numberOfLines={1}>
                {item.label}
              </Text>
              <Text variant="caption" weight="semiBold" color={theme.colors.gray700} style={[styles.value, { fontWeight: 'bold' }]} numberOfLines={1}>
                {item.value}
              </Text>
            </View>
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    gap: 16,
  },
  title: {
    fontSize: typography.size.md,
    lineHeight: typography.lineHeight.md,
  },
  itemsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  item: {
    flex: 1,
    gap: 8,
    minWidth: 0,
  },
  label: {
    fontSize: typography.size.sm,
    lineHeight: 20,
  },
  value: {
    fontSize: typography.size.sm,
    lineHeight: 20,
  },
  divider: {
    width: 1,
    height: 31,
  },
});
