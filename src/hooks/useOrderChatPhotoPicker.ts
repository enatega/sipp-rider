import { useState } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import type { OrderChatPhoto } from '../api/supportChatTypes';
import { useTranslations } from '../localization/LocalizationProvider';

const MAX_PHOTO_SIZE = 10 * 1024 * 1024;

function photoMimeType(asset: ImagePicker.ImagePickerAsset): OrderChatPhoto['mimeType'] | null {
  const mimeType = asset.mimeType?.toLowerCase();
  if (mimeType === 'image/jpeg' || mimeType === 'image/png' || mimeType === 'image/heic') return mimeType;
  const extension = (asset.fileName ?? asset.uri).split('.').pop()?.toLowerCase();
  if (extension === 'jpg' || extension === 'jpeg') return 'image/jpeg';
  if (extension === 'png') return 'image/png';
  if (extension === 'heic' || extension === 'heif') return 'image/heic';
  return null;
}

export function useOrderChatPhotoPicker() {
  const { t } = useTranslations('app');
  const [photo, setPhoto] = useState<OrderChatPhoto | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pick = async (source: 'camera' | 'library') => {
    try {
      const permission = source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setError(t('chat_photo_permission_denied'));
        return;
      }

      const result = source === 'camera'
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 1 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: false, quality: 1 });
      if (result.canceled || !result.assets[0]) return;

      const asset = result.assets[0];
      const mimeType = photoMimeType(asset);
      if (!mimeType) {
        setError(t('chat_photo_unsupported'));
        return;
      }
      if (asset.fileSize != null && asset.fileSize > MAX_PHOTO_SIZE) {
        setError(t('chat_photo_too_large'));
        return;
      }
      const extension = mimeType === 'image/png' ? 'png' : mimeType === 'image/heic' ? 'heic' : 'jpg';
      setPhoto({
        uri: asset.uri,
        name: asset.fileName || `order-photo.${extension}`,
        mimeType,
        fileSize: asset.fileSize,
      });
      setError(null);
    } catch {
      setError(t('chat_photo_pick_failed'));
    }
  };

  const choosePhoto = () => Alert.alert(t('chat_photo_add'), undefined, [
    { text: t('profile_take_photo'), onPress: () => void pick('camera') },
    { text: t('profile_choose_from_gallery'), onPress: () => void pick('library') },
    { text: t('profile_cancel'), style: 'cancel' },
  ]);

  return { photo, clearPhoto: () => setPhoto(null), choosePhoto, error, clearError: () => setError(null) };
}
