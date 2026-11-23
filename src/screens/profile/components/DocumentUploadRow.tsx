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
  emptyLabel: string;
  changeLabel: string;
};

export default function DocumentUploadRow({ label, imageUri, onPress, onPreview, uploadedLabel, missingLabel, emptyLabel, changeLabel }: Props) {
  const { theme } = useAppTheme();
  const statusColor = imageUri ? theme.colors.emerald900 : theme.colors.red800;

  return (
    <View style={styles.wrapper}>
      <Text variant="label" weight="semiBold" color={theme.colors.gray700}>{label}</Text>
      <DocumentUploadBox imageUri={imageUri} onPress={onPress} onPreview={onPreview} emptyLabel={emptyLabel} changeLabel={changeLabel} />
      <View style={styles.statusRow}>
        <View style={[styles.dot, { backgroundColor: statusColor }]} />
        <Text variant="caption" weight="medium" color={statusColor}>{imageUri ? uploadedLabel : missingLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, gap: 8 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
