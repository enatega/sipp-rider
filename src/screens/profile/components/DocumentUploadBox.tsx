import React from 'react';
import { Image, Pressable, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useAppTheme } from '../../../theme/ThemeProvider';

type Props = {
  imageUri: string | null;
  onPress: () => void;
  onPreview?: () => void;
};

export default function DocumentUploadBox({ imageUri, onPress, onPreview }: Props) {
  const { theme } = useAppTheme();
  const canPreview = Boolean(imageUri && onPreview);

  return (
    <Pressable
      style={[styles.uploadBox, { borderColor: theme.colors.gray300 }]}
      onPress={canPreview ? onPreview : onPress}
    >
      {imageUri ? (
        <>
          <Image source={{ uri: imageUri }} style={styles.uploadPreview} resizeMode="cover" />
          <Pressable
            onPress={onPress}
            style={[styles.editBadge, { backgroundColor: theme.colors.surface }]}
          >
            <EditIcon color={theme.colors.gray900} />
          </Pressable>
        </>
      ) : (
        <UploadIcon color={theme.colors.gray400} />
      )}
    </Pressable>
  );
}

function UploadIcon({ color }: { color: string }) {
  return (
    <Svg width={42} height={30} viewBox="0 0 42 30" fill="none">
      <Path
        d="M28.875 24.75H32.375C36.5171 24.75 39.875 21.3921 39.875 17.25C39.875 13.1079 36.5171 9.75 32.375 9.75C31.8456 9.75 31.329 9.805 30.8302 9.9097C29.2605 4.9702 24.6413 1.375 19.125 1.375C12.6387 1.375 7.375 6.63866 7.375 13.125C7.375 13.4536 7.38849 13.779 7.41491 14.1007C4.44507 14.9029 2.25 17.6158 2.25 20.75C2.25 24.5159 5.29206 27.558 9.05795 27.558H14.375"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M21 12V28M21 12L15 18M21 12L27 18" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function EditIcon({ color }: { color: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
      <Path
        d="M8.083 2.042L11.958 5.917M1.75 12.25L5.029 11.521C5.203 11.482 5.363 11.397 5.493 11.276L12.802 3.968C13.258 3.511 13.258 2.772 12.802 2.316L11.684 1.198C11.228 0.742 10.489 0.742 10.032 1.198L2.724 8.507C2.603 8.637 2.518 8.797 2.479 8.971L1.75 12.25Z"
        stroke={color}
        strokeWidth={1.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  uploadBox: {
    height: 108,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    overflow: 'hidden',
  },
  uploadPreview: {
    width: '100%',
    height: '100%',
  },
  editBadge: {
    position: 'absolute',
    right: 8,
    top: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
