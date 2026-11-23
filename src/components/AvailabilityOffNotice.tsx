import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Text from './Text';
import { useAppTheme } from '../theme/ThemeProvider';
import { useTranslations } from '../localization/LocalizationProvider';
import { withAlpha } from '../theme/colorUtils';

type Props = {
  onTurnOn: () => void;
  isPending?: boolean;
};

/** Shown in place of the New orders list while the rider's availability is off. */
export default function AvailabilityOffNotice({ onTurnOn, isPending = false }: Props) {
  const { theme } = useAppTheme();
  const { t } = useTranslations('app');
  const { colors } = theme;
  const accent = colors.primary;
  const accentSoft = withAlpha(colors.primary, 0.16);
  const accentFaint = withAlpha(colors.primary, 0.08);

  return (
    <View style={styles.container} accessibilityRole="alert">
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.gray200, shadowColor: colors.shadow }]}>
        <View style={[styles.halo, { borderColor: accentFaint }]}>
          <View style={[styles.iconWrap, { backgroundColor: accentSoft }]}>
            <Feather name="power" size={30} color={accent} />
          </View>
        </View>

        <View style={[styles.pill, { backgroundColor: accentSoft }]}>
          <View style={[styles.dot, { backgroundColor: accent }]} />
          <Text variant="caption" weight="semiBold" color={colors.gray900}>
            {t('home_availability_status_offline')}
          </Text>
        </View>

        <Text weight="bold" color={colors.gray900} style={styles.title}>
          {t('home_availability_off_title')}
        </Text>
        <Text color={colors.gray600} style={styles.message}>
          {t('home_availability_off_message')}
        </Text>

        <Pressable
          onPress={onTurnOn}
          disabled={isPending}
          accessibilityRole="button"
          accessibilityState={{ disabled: isPending, busy: isPending }}
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: colors.primary, opacity: isPending ? 0.5 : pressed ? 0.9 : 1 },
          ]}
        >
          <Text weight="semiBold" color={colors.white} numberOfLines={1} style={styles.buttonLabel}>
            {t('home_availability_off_action')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 24 },
  card: {
    alignItems: 'center',
    alignSelf: 'center',
    width: '100%',
    maxWidth: 420,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  halo: { padding: 8, borderRadius: 52, borderWidth: 6, marginBottom: 16 },
  iconWrap: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, marginBottom: 12 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  title: { alignSelf: 'stretch', fontSize: 20, lineHeight: 28, textAlign: 'center' },
  message: { alignSelf: 'stretch', fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 6 },
  button: { alignSelf: 'stretch', minHeight: 48, borderRadius: 12, justifyContent: 'center', paddingHorizontal: 20, marginTop: 24 },
  // Full-width label: centred bold text on Android is measured too narrow and wraps otherwise.
  buttonLabel: { alignSelf: 'stretch', textAlign: 'center' },
});
