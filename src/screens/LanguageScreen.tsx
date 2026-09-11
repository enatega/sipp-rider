import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Button from '../components/Button';
import Text from '../components/Text';
import { useUpdateLanguageMutation } from '../hooks/useLanguageMutations';
import { useLanguageQuery } from '../hooks/useLanguageQuery';
import { useLocalization, useTranslations } from '../localization/LocalizationProvider';
import { SupportedLanguage } from '../localization/i18n';
import { MainStackParamList } from '../navigation/types';
import { useAppTheme } from '../theme/ThemeProvider';
import { LanguageOption } from '../api/languageTypes';

const SUPPORTED_LOCALIZATION_LANGUAGES: SupportedLanguage[] = ['en', 'fr'];

export default function LanguageScreen() {
  const { theme } = useAppTheme();
  const { t } = useTranslations('app');
  const { language, setLanguage } = useLocalization();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const languageQuery = useLanguageQuery();
  const updateLanguageMutation = useUpdateLanguageMutation();
  const [selectedLanguageCode, setSelectedLanguageCode] = useState<string>('');

  const languageOptions = useMemo(() => languageQuery.data?.languages ?? [], [languageQuery.data?.languages]);

  useEffect(() => {
    if (selectedLanguageCode || !languageOptions.length) return;

    const selectedByApi = languageQuery.data?.selectedLanguage?.code;
    if (selectedByApi) {
      setSelectedLanguageCode(selectedByApi);
      return;
    }

    const selectedByFlag = languageOptions.find((item) => item.isSelected)?.code;
    if (selectedByFlag) {
      setSelectedLanguageCode(selectedByFlag);
      return;
    }

    const selectedByAppLanguage = languageOptions.find((item) => item.code === language)?.code;
    if (selectedByAppLanguage) {
      setSelectedLanguageCode(selectedByAppLanguage);
      return;
    }

    setSelectedLanguageCode(languageOptions[0].code);
  }, [selectedLanguageCode, languageOptions, languageQuery.data?.selectedLanguage?.code, language]);

  const onUpdateLanguage = async () => {
    if (!selectedLanguageCode || updateLanguageMutation.isPending) return;
    const selectedOption = languageOptions.find((item) => item.code === selectedLanguageCode);
    if (!selectedOption) return;

    const riderLanguageTag = selectedOption.countryCode
      ? selectedOption.code + '-' + selectedOption.countryCode.toUpperCase()
      : selectedOption.code;

    try {
      const response = await updateLanguageMutation.mutateAsync({
        riderLanguage: riderLanguageTag,
      });

      const appLanguageCode = response.rider_language || selectedOption.code;
      if (SUPPORTED_LOCALIZATION_LANGUAGES.includes(appLanguageCode as SupportedLanguage)) {
        await setLanguage(appLanguageCode as SupportedLanguage);
      }
      navigation.goBack();
    } catch {
      // Mutation error is rendered in footer.
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top', 'bottom']}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.iconButton}>
          <BackIcon color={theme.colors.gray800} />
        </Pressable>
        <Text
          weight="semiBold"
          style={{ color: theme.colors.gray900, fontSize: theme.typography.size.md, lineHeight: theme.typography.lineHeight.md }}
        >
          {t('menu_language')}
        </Text>
        <View style={styles.iconButton} />
      </View>

      <View style={styles.content}>
        <View style={styles.list}>
          {languageQuery.isLoading ? (
            <View style={styles.centerState}>
              <ActivityIndicator color={theme.colors.primary} />
            </View>
          ) : languageQuery.isError ? (
            <View style={styles.centerState}>
              <Text style={{ color: theme.colors.gray600 }}>{languageQuery.error?.message || t('status_unknown')}</Text>
            </View>
          ) : (
            languageOptions.map((option) => (
              <LanguageRow
                key={option.code}
                option={option}
                selected={selectedLanguageCode === option.code}
                onPress={() => setSelectedLanguageCode(option.code)}
              />
            ))
          )}
        </View>

        <Button
          label={t('language_update_button')}
          onPress={onUpdateLanguage}
          disabled={
            languageQuery.isLoading ||
            updateLanguageMutation.isPending ||
            !selectedLanguageCode
          }
          textColor={theme.colors.gray900}
          containerStyle={styles.updateButton}
        />
        {updateLanguageMutation.error?.message ? (
          <Text variant="caption" color={theme.colors.red500} style={styles.feedbackText}>
            {updateLanguageMutation.error.message}
          </Text>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

function LanguageRow({
  option,
  selected,
  onPress,
}: {
  option: LanguageOption;
  selected: boolean;
  onPress: () => void;
}) {
  const { theme } = useAppTheme();

  return (
    <Pressable onPress={onPress} style={[styles.row, { borderBottomColor: theme.colors.gray300 }]}>
      <LanguageFlag imageUrl={option.imageUrl} countryCode={option.countryCode} />
      <Text
        weight="semiBold"
        style={{ flex: 1, color: theme.colors.black, fontSize: theme.typography.size.sm, lineHeight: 20 }}
      >
        {option.name}
      </Text>
      <View style={[styles.selectionCircle, { borderColor: selected ? theme.colors.primary : theme.colors.gray300 }]}>
        {selected ? <View style={[styles.selectionDot, { backgroundColor: theme.colors.primary }]} /> : null}
      </View>
    </Pressable>
  );
}

function LanguageFlag({ imageUrl, countryCode }: { imageUrl: string; countryCode: string }) {
  const { theme } = useAppTheme();
  const [hasImageError, setHasImageError] = useState(false);
  const shouldShowImage = Boolean(imageUrl) && !hasImageError;

  return (
    <View style={[styles.flagWrap, { backgroundColor: theme.colors.gray100 }]}>
      {shouldShowImage ? (
        <Image
          source={{ uri: imageUrl }}
          style={styles.flagImage}
          resizeMode="cover"
          onError={() => setHasImageError(true)}
        />
      ) : (
        <Text weight="semiBold" style={{ color: theme.colors.gray700, fontSize: 10, lineHeight: 12 }}>
          {countryCode || '--'}
        </Text>
      )}
    </View>
  );
}

function BackIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M15 18L9 12L15 6" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    minHeight: 56,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconButton: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  content: {
    marginTop: 24,
    paddingHorizontal: 16,
    gap: 24,
  },
  list: {
    minHeight: 240,
    gap: 16,
  },
  row: {
    height: 36,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderBottomWidth: 1,
  },
  flagWrap: {
    width: 30,
    height: 18,
    borderRadius: 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flagImage: {
    width: 30,
    height: 18,
  },
  selectionCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  updateButton: {
    height: 54,
    borderRadius: 40,
  },
  centerState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  feedbackText: {
    marginTop: -14,
    textAlign: 'center',
  },
});
