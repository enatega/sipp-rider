import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Text from '../../../components/Text';
import { useAppTheme } from '../../../theme/ThemeProvider';

type Props = {
  imageUri: string | null;
  onPress: () => void;
  onPreview?: () => void;
  emptyLabel: string;
  changeLabel: string;
};

export default function DocumentUploadBox({ imageUri, onPress, onPreview, emptyLabel, changeLabel }: Props) {
  const { theme } = useAppTheme();
  const canPreview = Boolean(imageUri && onPreview);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={imageUri ? changeLabel : emptyLabel}
      style={[styles.box, { borderColor: imageUri ? theme.colors.gray200 : theme.colors.gray300, backgroundColor: theme.colors.gray50, borderStyle: imageUri ? 'solid' : 'dashed' }]}
      onPress={canPreview ? onPreview : onPress}
    >
      {imageUri ? (
        <>
          <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="cover" />
          <Pressable accessibilityRole="button" accessibilityLabel={changeLabel} hitSlop={6} onPress={onPress} style={[styles.changePill, { backgroundColor: theme.colors.surface }]}>
            <Feather name="edit-2" size={12} color={theme.colors.gray900} />
            <Text variant="caption" weight="semiBold" color={theme.colors.gray900}>{changeLabel}</Text>
          </Pressable>
        </>
      ) : (
        <View style={styles.empty}>
          <View style={[styles.iconTile, { backgroundColor: theme.colors.sky100 }]}>
            <Feather name="upload-cloud" size={20} color={theme.colors.sky600} />
          </View>
          <Text variant="caption" weight="medium" color={theme.colors.gray600} style={styles.emptyText}>{emptyLabel}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: { height: 116, borderWidth: 1.5, borderRadius: 16, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  preview: { width: '100%', height: '100%' },
  changePill: { position: 'absolute', right: 8, bottom: 8, flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  empty: { alignItems: 'center', gap: 8, paddingHorizontal: 8 },
  iconTile: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  emptyText: { textAlign: 'center' },
});
