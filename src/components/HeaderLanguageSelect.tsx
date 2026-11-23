import React, { useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Text from './Text';
import { useAppTheme } from '../theme/ThemeProvider';
import { useLocalization, useTranslations } from '../localization/LocalizationProvider';
import { toAppLanguage } from '../localization/i18n';
import { LANGUAGE_OPTIONS, LanguageOption } from '../localization/languages';
import { useUpdateLanguageMutation } from '../hooks/useLanguageMutations';

type Anchor = { top: number; right: number };

/**
 * Compact language switcher for screen headers. Saves the choice on the
 * rider account (like the Language screen) and applies it once saved.
 */
export default function HeaderLanguageSelect() {
  const { theme } = useAppTheme();
  const { t } = useTranslations('app');
  const { language, setLanguage } = useLocalization();
  const updateLanguage = useUpdateLanguageMutation();
  const triggerRef = useRef<View>(null);
  const [anchor, setAnchor] = useState<Anchor | null>(null);

  const current = LANGUAGE_OPTIONS.find((option) => toAppLanguage(option.value) === language)
    ?? LANGUAGE_OPTIONS[0];

  const open = () => {
    triggerRef.current?.measureInWindow((x, y, width, height) => {
      setAnchor({ top: y + height + 6, right: x + width });
    });
  };

  const select = (option: LanguageOption) => {
    setAnchor(null);
    if (option.value === current.value) return;
    updateLanguage.mutate(
      { riderLanguage: option.value },
      {
        onSuccess: () => void setLanguage(toAppLanguage(option.value)),
        onError: (error) => console.error('Failed to update language', error),
      },
    );
  };

  return (
    <>
      <Pressable
        ref={triggerRef}
        onPress={open}
        disabled={updateLanguage.isPending}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel={t('menu_language')}
        accessibilityState={{ expanded: anchor !== null, busy: updateLanguage.isPending }}
        style={[styles.trigger, { borderColor: theme.colors.gray200, backgroundColor: theme.colors.surface }]}
      >
        {updateLanguage.isPending ? (
          <ActivityIndicator size="small" color={theme.colors.brandInk} />
        ) : (
          <>
            <Text style={styles.flag}>{current.flag}</Text>
            <Text variant="caption" weight="semiBold" color={theme.colors.text}>
              {current.shortLabel}
            </Text>
            <Feather name="chevron-down" size={14} color={theme.colors.gray500} />
          </>
        )}
      </Pressable>

      <Modal visible={anchor !== null} transparent animationType="fade" onRequestClose={() => setAnchor(null)}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setAnchor(null)} accessibilityLabel={t('profile_cancel')} />
        {anchor ? (
          <View
            accessibilityRole="menu"
            style={[
              styles.menu,
              {
                top: anchor.top,
                left: Math.max(16, anchor.right - MENU_WIDTH),
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.gray200,
                shadowColor: theme.colors.shadow,
              },
            ]}
          >
            {LANGUAGE_OPTIONS.map((option) => {
              const isSelected = option.value === current.value;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => select(option)}
                  accessibilityRole="menuitem"
                  accessibilityState={{ selected: isSelected }}
                  style={({ pressed }) => [
                    styles.option,
                    pressed && { backgroundColor: theme.colors.gray50 },
                  ]}
                >
                  <Text style={styles.flag}>{option.flag}</Text>
                  <Text
                    variant="caption"
                    weight={isSelected ? 'semiBold' : undefined}
                    color={theme.colors.text}
                    style={styles.optionLabel}
                  >
                    {option.label}
                  </Text>
                  {isSelected ? <Feather name="check" size={16} color={theme.colors.brandInk} /> : null}
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </Modal>
    </>
  );
}

const MENU_WIDTH = 168;

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 32,
    minWidth: 64,
    justifyContent: 'center',
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1,
  },
  flag: { fontSize: 15 },
  menu: {
    position: 'absolute',
    width: MENU_WIDTH,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 4,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 6,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 44,
    paddingHorizontal: 14,
  },
  optionLabel: { flex: 1, fontSize: 14 },
});
