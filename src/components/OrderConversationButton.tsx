import React from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import ChatBubbleOvalIcon from '../assets/svgs/chat-bubble-oval.svg';
import { useTranslations } from '../localization/LocalizationProvider';
import { useAppTheme } from '../theme/ThemeProvider';
import Text from './Text';

type Props = {
  kind: 'store_rider' | 'customer_rider';
  unreadCount: number;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

export default function OrderConversationButton({ kind, unreadCount, onPress, style }: Props) {
  const { theme } = useAppTheme();
  const { t } = useTranslations('app');
  const label = t(kind === 'store_rider' ? 'chat_store_action' : 'chat_customer_action');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={unreadCount > 0 ? t('chat_action_unread', { label, count: unreadCount }) : label}
      onPress={(event) => {
        event.stopPropagation();
        onPress();
      }}
      style={[styles.button, { backgroundColor: theme.colors.surface, borderColor: theme.colors.gray200 }, style]}
    >
      <ChatBubbleOvalIcon width={18} height={18} stroke={theme.colors.gray900} />
      <Text variant="caption" weight="semiBold" color={theme.colors.gray900} numberOfLines={1} style={styles.label}>
        {label}
      </Text>
      {unreadCount > 0 ? (
        <View style={[styles.badge, { backgroundColor: theme.colors.red500 }]}>
          <Text variant="caption" weight="bold" color={theme.colors.white}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 44,
    minWidth: 0,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
  },
  label: {
    flexShrink: 1,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
