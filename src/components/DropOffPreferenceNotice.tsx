import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslations } from '../localization/LocalizationProvider';
import Text from './Text';
import { useAppTheme } from '../theme/ThemeProvider';

interface Props {
  /** Only an explicit `true` shows the notice; off or unknown means a normal hand-off. */
  leaveAtDoor?: boolean | null;
  style?: StyleProp<ViewStyle>;
}

export default function DropOffPreferenceNotice({ leaveAtDoor, style }: Props) {
  const { t } = useTranslations('app');
  const { theme } = useAppTheme();

  if (leaveAtDoor !== true) return null;

  const foreground = theme.colors.amber800;
  const title = t('drop_off_leave_at_door');
  const description = t('drop_off_leave_at_door_hint');

  return (
    <View
      accessible
      accessibilityLabel={`${t('drop_off_preference')}: ${title}. ${description}`}
      style={[styles.container, { backgroundColor: theme.colors.amber100, borderColor: foreground }, style]}
    >
      <Feather accessible={false} name="package" size={18} color={foreground} />
      <View style={styles.text}>
        <Text variant="caption" weight="semiBold" color={foreground} style={styles.label}>{t('drop_off_preference')}</Text>
        <Text variant="label" weight="bold" color={foreground}>{title}</Text>
        <Text variant="caption" color={foreground}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth },
  text: { flex: 1, minWidth: 0, gap: 1 },
  label: { textTransform: 'uppercase', letterSpacing: 0.4, fontSize: 10, lineHeight: 14 },
});
