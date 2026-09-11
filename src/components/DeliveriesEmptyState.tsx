import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Text from './Text';
import { useAppTheme } from '../theme/ThemeProvider';
import { typography } from '../theme/typography';

type Props = {
  title: string;
  subtitle: string;
};

export default function DeliveriesEmptyState({ title, subtitle }: Props) {
  const { theme } = useAppTheme();

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.gray50, borderColor: theme.colors.gray200 }]}>
      <View style={[styles.iconWrap, { backgroundColor: theme.colors.white, borderColor: theme.colors.gray300 }]}>
        <DeliveryBoxIcon color={theme.colors.gray500} />
      </View>
      <Text
        variant="subtitle"
        weight="semiBold"
        color={theme.colors.gray900}
        style={styles.title}
        numberOfLines={2}
      >
        {title}
      </Text>
      <Text
        variant="body"
        weight="regular"
        color={theme.colors.gray500}
        style={styles.subtitle}
        numberOfLines={3}
      >
        {subtitle}
      </Text>
    </View>
  );
}

function DeliveryBoxIcon({ color }: { color: string }) {
  return (
    <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3L20 7L12 11L4 7L12 3Z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M20 7V17L12 21L4 17V7"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 11V21"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    maxWidth: 360,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 22,
    alignItems: 'center',
    alignSelf: 'center',
    gap: 10,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  title: {
    textAlign: 'center',
    fontSize: typography.size.lg,
    lineHeight: typography.lineHeight.lg,
  },
  subtitle: {
    textAlign: 'center',
    fontSize: typography.size.sm,
    lineHeight: 20,
  },
});
