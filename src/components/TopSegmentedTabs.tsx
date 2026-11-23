import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Text from './Text';
import { useAppTheme } from '../theme/ThemeProvider';

type Props<T extends string> = {
  tabs: readonly T[];
  activeTab: T;
  onChange: (tab: T) => void;
  labelMap: Record<T, string>;
  countMap?: Partial<Record<T, number>>;
  /** Tabs whose count must not be shown, e.g. while the count's content is unavailable. */
  hiddenCountTabs?: readonly T[];
};

export default function TopSegmentedTabs<T extends string>({ tabs, activeTab, onChange, labelMap, countMap, hiddenCountTabs }: Props<T>) {
  const { theme } = useAppTheme();

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const active = tab === activeTab;
        return (
          <Pressable
            key={tab}
            style={[styles.tab, active && { borderBottomColor: theme.colors.primary, borderBottomWidth: 2 }]}
            onPress={() => onChange(tab)}
          >
            <View style={styles.labelRow}>
              <Text
                variant="body"
                numberOfLines={1}
                weight={active ? 'semiBold' : 'medium'}
                color={active ? theme.colors.gray900 : theme.colors.gray600}
                style={styles.label}
              >
                {labelMap[tab]}
              </Text>
              {hiddenCountTabs?.includes(tab) ? null : <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: active ? theme.colors.primary : theme.colors.gray200,
                  },
                ]}
              >
                <Text
                  variant="caption"
                  weight="semiBold"
                  color={active ? theme.colors.gray900 : theme.colors.gray600}
                  style={styles.badgeLabel}
                >
                  {countMap?.[tab] ?? 0}
                </Text>
              </View>}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    // Keep label + counter inside the tab; the label truncates before it overlaps a neighbour.
    maxWidth: '100%',
    gap: 6,
  },
  label: {
    flexShrink: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  badge: {
    flexShrink: 0,
    minWidth: 24,
    height: 24,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeLabel: {
    fontSize: 12,
    lineHeight: 16,
  },
});
