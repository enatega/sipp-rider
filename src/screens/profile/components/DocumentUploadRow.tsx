import React from 'react';
import { StyleSheet, View } from 'react-native';
import Text from '../../../components/Text';
import { useAppTheme } from '../../../theme/ThemeProvider';
import DocumentUploadBox from './DocumentUploadBox';

type Props = {
  label: string;
  imageUri: string | null;
  onPress: () => void;
  onPreview?: () => void;
  uploadedLabel: string;
  missingLabel: string;
};

export default function DocumentUploadRow({
  label,
  imageUri,
  onPress,
  onPreview,
  uploadedLabel,
  missingLabel,
}: Props) {
  const { theme } = useAppTheme();

  return (
    <View style={styles.wrapper}>
      <View style={styles.headerRow}>
        <Text weight="medium" style={{ color: theme.colors.gray700 }}>{label}</Text>
        <Text
          variant="caption"
          weight="medium"
          style={{ color: imageUri ? theme.colors.emerald900 : theme.colors.red800 }}
        >
          {imageUri ? uploadedLabel : missingLabel}
        </Text>
      </View>
      <DocumentUploadBox imageUri={imageUri} onPress={onPress} onPreview={onPreview} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
