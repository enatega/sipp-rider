import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Button from '../components/Button';
import Text from '../components/Text';
import { useUpdateLanguageMutation } from '../hooks/useLanguageMutations';
import { useLanguageQuery } from '../hooks/useLanguageQuery';
import { useLocalization, useTranslations } from '../localization/LocalizationProvider';
import { toAppLanguage } from '../localization/i18n';
import { LANGUAGE_OPTIONS, LanguageOption } from '../localization/languages';
import { MainStackParamList } from '../navigation/types';
import { useAppTheme } from '../theme/ThemeProvider';

const findOption = (riderLanguage: string) =>
  LANGUAGE_OPTIONS.find((option) => toAppLanguage(option.value) === toAppLanguage(riderLanguage)) ?? LANGUAGE_OPTIONS[0];

export default function LanguageScreen() {
  const { theme } = useAppTheme();
  const { t } = useTranslations('app');
  const { language, setLanguage } = useLocalization();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const languageQuery = useLanguageQuery();
  const updateLanguageMutation = useUpdateLanguageMutation();
  const [selectedValue, setSelectedValue] = useState<string>(() => findOption(language).value);

  useEffect(() => {
    const riderLanguage = languageQuery.data?.rider_language;
    if (riderLanguage) setSelectedValue(findOption(riderLanguage).value);
  }, [languageQuery.data?.rider_language]);

  const onUpdateLanguage = async () => {
    if (updateLanguageMutation.isPending) return;

    try {
      await updateLanguageMutation.mutateAsync({ riderLanguage: selectedValue });
      await setLanguage(toAppLanguage(selectedValue));
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
              <ActivityIndicator color={theme.colors.brandInk} />
            </View>
          ) : (
            LANGUAGE_OPTIONS.map((option) => (
              <LanguageRow
                key={option.value}
                option={option}
                selected={selectedValue === option.value}
                onPress={() => setSelectedValue(option.value)}
              />
            ))
          )}
        </View>

        <Button
          label={t('language_update_button')}
          onPress={onUpdateLanguage}
          disabled={
            languageQuery.isLoading ||
            updateLanguageMutation.isPending
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
      <Text style={styles.flag}>{option.flag}</Text>
      <Text
        weight="semiBold"
        style={{ flex: 1, color: theme.colors.black, fontSize: theme.typography.size.sm, lineHeight: 20 }}
      >
        {option.label}
      </Text>
      <View style={[styles.selectionCircle, { borderColor: selected ? theme.colors.brandInk : theme.colors.gray300 }]}>
        {selected ? <View style={[styles.selectionDot, { backgroundColor: theme.colors.brandInk }]} /> : null}
      </View>
    </Pressable>
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
  flag: { fontSize: 18, lineHeight: 22 },
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
