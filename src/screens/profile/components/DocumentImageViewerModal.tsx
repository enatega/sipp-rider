import React, { useEffect, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Text from '../../../components/Text';
import { useTranslations } from '../../../localization/LocalizationProvider';
import { useAppTheme } from '../../../theme/ThemeProvider';

type Props = {
  visible: boolean;
  imageUri: string | null;
  onClose: () => void;
};

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const SCALE_STEP = 0.5;

export default function DocumentImageViewerModal({ visible, imageUri, onClose }: Props) {
  const { theme } = useAppTheme();
  const { t } = useTranslations('app');
  const insets = useSafeAreaInsets();
  const [scale, setScale] = useState<number>(MIN_SCALE);

  useEffect(() => {
    if (!visible) {
      setScale(MIN_SCALE);
    }
  }, [visible]);

  const zoomIn = () => setScale((prev) => Math.min(MAX_SCALE, prev + SCALE_STEP));
  const zoomOut = () => setScale((prev) => Math.max(MIN_SCALE, prev - SCALE_STEP));
  const resetZoom = () => setScale(MIN_SCALE);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.overlay, { backgroundColor: theme.colors.black }]} />

        <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
          <Text weight="semiBold" color={theme.colors.white} style={styles.previewTitle}>
            {t('image_view_title')}
          </Text>
          <Pressable style={[styles.headerButton, { borderColor: theme.colors.gray300 }]} onPress={onClose}>
            <Text weight="medium" color={theme.colors.white}>{t('image_view_close')}</Text>
          </Pressable>
        </View>

        <View style={[styles.imageWrap, { borderColor: theme.colors.gray700, backgroundColor: theme.colors.gray900 }]}>
          <ScrollView
            bounces={false}
            minimumZoomScale={MIN_SCALE}
            maximumZoomScale={MAX_SCALE}
            contentContainerStyle={styles.scrollContent}
            centerContent
          >
            {imageUri ? (
              <Image
                source={{ uri: imageUri }}
                style={[styles.image, { transform: [{ scale }] }]}
                resizeMode="contain"
              />
            ) : null}
          </ScrollView>
        </View>

        <View style={[styles.controlsRow, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <ControlButton label={t('image_zoom_out')} onPress={zoomOut} />
          <ControlButton label={t('image_zoom_reset')} onPress={resetZoom} />
          <ControlButton label={t('image_zoom_in')} onPress={zoomIn} />
        </View>
      </View>
    </Modal>
  );
}

function ControlButton({ label, onPress }: { label: string; onPress: () => void }) {
  const { theme } = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.controlButton,
        {
          backgroundColor: theme.colors.gray900,
          borderColor: theme.colors.gray700,
        },
      ]}
    >
      <Text weight="semiBold" color={theme.colors.white}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.92,
  },
  header: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  previewTitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  headerButton: {
    borderWidth: 1,
    borderRadius: 18,
    height: 36,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageWrap: {
    flex: 1,
    justifyContent: 'center',
    marginTop: 14,
    marginBottom: 12,
    marginHorizontal: 12,
    borderWidth: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  image: {
    width: '100%',
    height: '100%',
    maxWidth: 1200,
    maxHeight: 1200,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  controlButton: {
    minWidth: 70,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderWidth: 1,
  },
});
