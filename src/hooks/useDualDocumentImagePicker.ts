import { useEffect, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';

type DocumentSide = 'front' | 'back';

type UseDualDocumentImagePickerOptions = {
  initialFrontUri?: string | null;
  initialBackUri?: string | null;
};

type UseDualDocumentImagePickerResult = {
  frontUri: string | null;
  backUri: string | null;
  isPickerModalVisible: boolean;
  openPickerModalFor: (side: DocumentSide) => void;
  closePickerModal: () => void;
  pickFromGallery: () => Promise<void>;
  pickFromCamera: () => Promise<void>;
};

export function useDualDocumentImagePicker(
  options: UseDualDocumentImagePickerOptions = {}
): UseDualDocumentImagePickerResult {
  const [frontUri, setFrontUri] = useState<string | null>(options.initialFrontUri ?? null);
  const [backUri, setBackUri] = useState<string | null>(options.initialBackUri ?? null);
  const [isPickerModalVisible, setPickerModalVisible] = useState(false);
  const [activeSide, setActiveSide] = useState<DocumentSide>('front');

  const closePickerModal = () => setPickerModalVisible(false);

  useEffect(() => {
    if (options.initialFrontUri && !frontUri) {
      setFrontUri(options.initialFrontUri);
    }
  }, [options.initialFrontUri, frontUri]);

  useEffect(() => {
    if (options.initialBackUri && !backUri) {
      setBackUri(options.initialBackUri);
    }
  }, [options.initialBackUri, backUri]);

  const setPickedImage = (uri: string) => {
    if (activeSide === 'front') {
      setFrontUri(uri);
      return;
    }
    setBackUri(uri);
  };

  const openPickerModalFor = (side: DocumentSide) => {
    setActiveSide(side);
    setPickerModalVisible(true);
  };

  const pickFromGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: false,
      quality: 0.8,
    });

    closePickerModal();
    if (!result.canceled && result.assets.length > 0) {
      setPickedImage(result.assets[0].uri);
    }
  };

  const pickFromCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    closePickerModal();
    if (!result.canceled && result.assets.length > 0) {
      setPickedImage(result.assets[0].uri);
    }
  };

  return {
    frontUri,
    backUri,
    isPickerModalVisible,
    openPickerModalFor,
    closePickerModal,
    pickFromGallery,
    pickFromCamera,
  };
}
