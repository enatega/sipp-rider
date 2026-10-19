import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslations } from '../localization/LocalizationProvider';
import Text from './Text';
import type { AddressDetails } from '../api/addressDetailsTypes';
export type { AddressDetails } from '../api/addressDetailsTypes';
interface Props { isHistoricalFallback?: boolean; details?: AddressDetails | null; legacyText?: string | null; compact?: boolean }
export default function AddressDetailsView({ details, legacyText, compact = false, isHistoricalFallback = false }: Props) {
  const { t } = useTranslations('app');
  const [expanded, setExpanded] = useState(!compact);
  const keys = (['placeName', 'howToFindYou', 'deliveryInstructions'] as const).filter(key => details?.[key]?.trim());
  if (!keys.length && !legacyText?.trim() && !isHistoricalFallback) return null;
  return <View style={styles.container}>
    {isHistoricalFallback ? <Text>{t('address_details_historicalFallback')}</Text> : null}
    {compact ? <Pressable accessibilityRole="button" accessibilityState={{ expanded }} onPress={event => { event.stopPropagation(); setExpanded(!expanded); }} style={styles.toggle}><Text weight="medium">{t('address_details_showDetails')}</Text></Pressable> : null}
    {expanded || !compact ? <View style={styles.container}>{keys.map(key => <View key={key} style={styles.field}><Text weight="semiBold">{t(`address_details_${key}Heading`)}</Text><Text style={{  flexShrink: 1 }}>{details?.[key]}</Text></View>)}{!details && legacyText ? <View><Text weight="semiBold">{t('address_details_legacyDetails')}</Text><Text>{legacyText}</Text></View> : null}</View> : null}
  </View>;
}
const styles = StyleSheet.create({ container: { gap: 8, marginTop: 8 }, field: { gap: 3 }, toggle: { minHeight: 44, justifyContent: 'center' } });
