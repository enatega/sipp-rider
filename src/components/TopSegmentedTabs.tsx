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
};

export default function TopSegmentedTabs<T extends string>({ tabs, activeTab, onChange, labelMap, countMap }: Props<T>) {
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
                weight={active ? 'semiBold' : 'medium'}
                color={active ? theme.colors.gray900 : theme.colors.gray600}
                style={styles.label}
              >
                {labelMap[tab]}
              </Text>
              <View
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
              </View>
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
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  label: {
    fontSize: 15,
    lineHeight: 22,
  },
  badge: {
    minWidth: 32,
    height: 32,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  badgeLabel: {
    fontSize: 12,
    lineHeight: 16,
  },
});
