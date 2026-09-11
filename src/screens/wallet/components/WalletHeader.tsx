import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Text from '../../../components/Text';
import { useAppTheme } from '../../../theme/ThemeProvider';

type Props = {
  title: string;
  onBackPress?: () => void;
};

export default function WalletHeader({ title, onBackPress }: Props) {
  const { theme } = useAppTheme();

  return (
    <View style={styles.container}>
      <Pressable
        onPress={onBackPress}
        accessibilityRole="button"
        hitSlop={8}
        style={styles.iconButton}
      >
        <Text style={[styles.icon, { color: theme.colors.gray900 }]}>{'←'}</Text>
      </Pressable>
      <Text weight="semiBold" style={styles.title}>
        {title}
      </Text>
      <View style={styles.iconButton} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 8,
  },
  iconButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 24,
    lineHeight: 24,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 24,
  },
});
