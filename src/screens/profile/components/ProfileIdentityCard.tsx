import React, { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Text from '../../../components/Text';
import { useAppTheme } from '../../../theme/ThemeProvider';

type Props = { name: string; idLabel: string; imageUri?: string | null };

function getInitials(name: string): string {
  const parts = name.split(' ').map((part) => part.trim()).filter(Boolean);
  if (!parts.length) return 'NA';
  return parts.slice(0, 2).map((part) => part[0].toUpperCase()).join('');
}

export default function ProfileIdentityCard({ name, idLabel, imageUri }: Props) {
  const { theme } = useAppTheme();
  const [hasImageError, setHasImageError] = useState(false);
  const showImage = Boolean(imageUri) && !hasImageError;

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.gray50 }]}>
      <View style={[styles.avatar, { backgroundColor: theme.colors.primary, borderColor: theme.colors.surface }]}>
        {showImage ? (
          <Image source={{ uri: imageUri ?? '' }} style={styles.avatarImage} resizeMode="cover" onError={() => setHasImageError(true)} />
        ) : (
          <Text weight="bold" color={theme.colors.black} style={styles.initials}>{getInitials(name)}</Text>
        )}
      </View>
      <View style={styles.meta}>
        <Text weight="bold" color={theme.colors.gray900} style={styles.name} numberOfLines={2}>{name}</Text>
        <View style={[styles.idChip, { backgroundColor: theme.colors.surface, borderColor: theme.colors.gray200 }]}>
          <Text variant="caption" weight="semiBold" color={theme.colors.gray700}>{idLabel}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 16, borderRadius: 20, padding: 16 },
  avatar: { width: 72, height: 72, borderRadius: 36, borderWidth: 3, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%' },
  initials: { fontSize: 24, lineHeight: 30 },
  meta: { flex: 1, gap: 8 },
  name: { fontSize: 20, lineHeight: 26 },
  idChip: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
});
