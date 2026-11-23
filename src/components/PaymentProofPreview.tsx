import React, { useState } from 'react';
import { ActivityIndicator, Image, Linking, Modal, Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Text from './Text';
import Button from './Button';
import { useAppTheme } from '../theme/ThemeProvider';
import { useTranslations } from '../localization/LocalizationProvider';

type Props = { uri: string; onClose: () => void };
export default function PaymentProofPreview({ uri, onClose }: Props) {
  const { theme } = useAppTheme();
  const { t } = useTranslations('app');
  const { width, height } = useWindowDimensions();
  const [scale, setScale] = useState(1);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const isDocument = /\.(pdf|docx?)(?:[?#]|$)/i.test(uri);
  const openDocument = async () => {
    try { await Linking.openURL(uri); } catch { setFailed(true); }
  };
  const control = (icon: 'minus' | 'plus', label: string, disabled: boolean, onPress: () => void) =>
    <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }} disabled={disabled} onPress={onPress}
      style={{ width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.gray100, opacity: disabled ? 0.4 : 1 }}>
      <Feather name={icon} size={22} color={theme.colors.gray900} />
    </Pressable>;
  return <Modal visible animationType="fade" onRequestClose={onClose}>
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 }}>
        <Text variant="subtitle" weight="bold" style={{ flex: 1 }}>{t('wallet_payment_proof')}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={t('image_view_close')} onPress={onClose}
          style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: theme.colors.gray100, alignItems: 'center', justifyContent: 'center' }}>
          <Feather name="x" size={22} color={theme.colors.gray900} />
        </Pressable>
      </View>
      {failed || isDocument ? <View style={{ flex: 1, padding: 24, gap: 20, justifyContent: 'center' }}>
        <Feather name="file-text" size={40} color={theme.colors.gray500} />
        {failed ? <Text color={theme.colors.gray600}>{t('wallet_proof_error')}</Text> : null}
        <Button variant="secondary" onPress={openDocument} label={t('wallet_open_document')} />
        {failed && !isDocument ? <Button variant="secondary" label={t('wallet_retry')}
          onPress={() => { setFailed(false); setLoading(true); setAttempt(value => value + 1); }} /> : null}
      </View> : <>
        {loading ? <ActivityIndicator color={theme.colors.brandInk} /> : null}
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <ScrollView horizontal contentContainerStyle={{ flexGrow: 1 }}>
            <Image key={attempt} source={{ uri }} resizeMode="contain"
              style={{ width: width * scale, height: Math.max(250, height - 220) * scale }}
              onLoadEnd={() => setLoading(false)} onError={() => { setLoading(false); setFailed(true); }} />
          </ScrollView>
        </ScrollView>
        <View style={{ padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
          {control('minus', t('image_zoom_out'), scale <= 1, () => setScale(value => Math.max(1, value - 0.5)))}
          <Text variant="label" weight="semiBold">{Math.round(scale * 100)}%</Text>
          {control('plus', t('image_zoom_in'), scale >= 4, () => setScale(value => Math.min(4, value + 0.5)))}
        </View>
      </>}
    </SafeAreaView>
  </Modal>;
}
