import React, { useState } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslations } from '../localization/LocalizationProvider';
import Text from './Text';
import ExpandableText from './ExpandableText';
import type { AddressDetails } from '../api/addressDetailsTypes';
import { useAppTheme } from '../theme/ThemeProvider';

export type { AddressDetails } from '../api/addressDetailsTypes';

interface Props {
  isHistoricalFallback?: boolean;
  details?: AddressDetails | null;
  legacyText?: string | null;
  compact?: boolean;
  courierMessage?: string | null;
  style?: StyleProp<ViewStyle>;
}

type FeatherName = React.ComponentProps<typeof Feather>['name'];
type DetailRow = { id: string; icon: FeatherName; label?: string; value: string };

const DETAIL_ICONS: Record<keyof AddressDetails, FeatherName> = {
  placeName: 'home',
  howToFindYou: 'navigation',
  deliveryInstructions: 'clipboard',
};

export default function AddressDetailsView({ details, legacyText, compact = false, courierMessage, style, isHistoricalFallback = false }: Props) {
  const { t } = useTranslations('app');
  const { theme } = useAppTheme();
  const [expanded, setExpanded] = useState(false);
  const rows: DetailRow[] = (['placeName', 'howToFindYou', 'deliveryInstructions'] as const)
    .filter(key => details?.[key]?.trim())
    .map(key => ({ id: key, icon: DETAIL_ICONS[key], label: t(`address_details_${key}Heading`), value: details?.[key]?.trim() ?? '' }));
  // An intentional clear in structured details must not revive old address fields.
  const legacy = details == null ? legacyText?.trim() : undefined;
  if (legacy) rows.push({ id: 'legacy', icon: 'info', value: legacy });
  const note = courierMessage?.trim();
  if (note) rows.push({ id: 'courierMessage', icon: 'message-circle', label: t('address_details_courierMessage'), value: note });
  const hasContent = rows.length > 0;
  const isExpanded = !compact || expanded;

  if (!hasContent && !isHistoricalFallback) return null;

  return (
    <View style={[styles.container, style]}>
      {isHistoricalFallback ? <Text variant="caption" color={theme.colors.gray600}>{t('address_details_linkedAddress')}</Text> : null}
      {compact && hasContent ? (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: isExpanded }}
          onPress={event => {
            event.stopPropagation();
            setExpanded(value => !value);
          }}
          style={styles.toggle}
        >
          <Text variant="body" weight="semiBold" style={[styles.toggleText, theme.typography.role.addressDetail]}>{t(isExpanded ? 'address_details_hideDetails' : 'address_details_showDetails')}</Text>
          <Feather accessible={false} name={isExpanded ? 'chevron-up' : 'chevron-down'} size={16} color={theme.colors.gray600} />
        </Pressable>
      ) : null}
      {hasContent && isExpanded ? (
        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.gray200 }]}>
          {rows.map((row, index) => (
            <View key={row.id} style={[styles.row, index > 0 && { borderTopColor: theme.colors.gray200, borderTopWidth: StyleSheet.hairlineWidth }]}>
              <View style={[styles.iconTile, { backgroundColor: theme.colors.primarySoft }]}>
                <Feather accessible={false} name={row.icon} size={14} color={theme.colors.brandInk} />
              </View>
              <View style={styles.rowText}>
                {row.label ? <Text variant="caption" weight="semiBold" color={theme.colors.gray600} style={styles.label}>{row.label}</Text> : null}
                <ExpandableText text={row.value} moreLabel={t('address_details_showMore')} lessLabel={t('address_details_showLess')} textColor={theme.colors.gray900} linkColor={theme.colors.brandInk} textStyle={[styles.value, theme.typography.role.addressDetail]} />
              </View>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 8, minWidth: 0, gap: 4 },
  card: { borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingHorizontal: 10, paddingVertical: 9 },
  iconTile: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  rowText: { flex: 1, minWidth: 0, gap: 1 },
  label: { textTransform: 'uppercase', letterSpacing: 0.4, fontSize: 10, lineHeight: 14 },
  value: { flexShrink: 1 },
  toggle: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 8 },
  toggleText: { flexShrink: 1 },
});
