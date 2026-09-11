import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  TextInput as RNTextInput,
  StyleSheet,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import Svg, { Path } from 'react-native-svg';
import Text from '../components/Text';
import { useTranslations } from '../localization/LocalizationProvider';
import { MainStackParamList } from '../navigation/types';
import { useAppTheme } from '../theme/ThemeProvider';
import { useAuth } from '../auth/AuthProvider';
import {
  useSendSupportChatMessageMutation,
  useSupportChatMessagesQuery,
} from '../hooks/useSupportChat';
import { SupportChatMessage, SupportChatMessagesResponse } from '../api/supportChatTypes';
import { riderHomeKeys, supportChatKeys } from '../api/queryKeys';
import type { RiderOrderDetail } from '../api/riderOrderDetailTypes';
import {
  supportChatSocketClient,
  type SocketReceivedMessage,
} from '../socket/supportChatSocket';

type Props = NativeStackScreenProps<MainStackParamList, 'OrderChat'>;

const formatTime = (value: string | null): string => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};

const normalizeParticipantId = (value: string | null | undefined) => value?.trim() ?? null;

export default function OrderChatScreen({ navigation, route }: Props) {
  const { theme } = useAppTheme();
  const { t } = useTranslations('app');
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const [message, setMessage] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const listRef = useRef<FlatList<SupportChatMessage> | null>(null);

  const senderId = normalizeParticipantId(session.user?.id);
  const receiverId = normalizeParticipantId(route.params?.receiverId);
  const [activeChatBoxId, setActiveChatBoxId] = useState<string | null>(route.params?.chatBoxId ?? null);
  const title = route.params?.name?.trim() || t('order_chat_default_name');
  const phone = route.params?.phone?.trim() || null;

  const messagesQuery = useSupportChatMessagesQuery(activeChatBoxId);
  const sendMessageMutation = useSendSupportChatMessageMutation(activeChatBoxId);

  const messages = useMemo(
    () => messagesQuery.data?.messages ?? [],
    [messagesQuery.data?.messages],
  );
  const scrollToLatest = useCallback((animated = true) => {
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated });
    });
  }, []);

  useEffect(() => {
    const token = session.token ?? null;
    const userId = session.user?.id ?? null;

    supportChatSocketClient.updateSession({ token, userId });

    if (!token || !userId) {
      supportChatSocketClient.disconnect();
      return undefined;
    }

    supportChatSocketClient.connect();
    return () => {
      supportChatSocketClient.disconnect();
    };
  }, [session.token, session.user?.id]);

  useEffect(() => {
    const unsubscribe = supportChatSocketClient.onReceiveMessage((socketMessage: SocketReceivedMessage) => {
      const incomingChatBoxId = socketMessage.chatBoxId ?? socketMessage.chat_box_id ?? null;
      const incomingText = socketMessage.text?.trim();
      const incomingSender = normalizeParticipantId(socketMessage.senderId ?? socketMessage.sender);
      const incomingReceiver = normalizeParticipantId(socketMessage.receiverId ?? socketMessage.receiver);

      if (!incomingText) return;

      if (activeChatBoxId && incomingChatBoxId && activeChatBoxId !== incomingChatBoxId) {
        return;
      }

      const resolvedChatBoxId = incomingChatBoxId ?? activeChatBoxId;
      if (!resolvedChatBoxId) return;

      if (!activeChatBoxId && incomingChatBoxId) {
        setActiveChatBoxId(incomingChatBoxId);
      }

      const receivedMessage: SupportChatMessage = {
        id: socketMessage.id ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        text: incomingText,
        senderId: incomingSender,
        receiverId: incomingReceiver,
        createdAt: socketMessage.createdAt ?? socketMessage.updatedAt ?? new Date().toISOString(),
      };

      queryClient.setQueryData<SupportChatMessagesResponse>(
        supportChatKeys.messages(resolvedChatBoxId),
        (current) => {
          const existing = current?.messages ?? [];
          const alreadyExists = existing.some((item) => item.id === receivedMessage.id);
          if (alreadyExists) return current ?? { messages: existing };
          return {
            messages: [...existing, receivedMessage],
          };
        },
      );
    });

    return () => {
      unsubscribe();
    };
  }, [activeChatBoxId, queryClient]);

  useEffect(() => {
    if (!messages.length) return;
    scrollToLatest(true);
  }, [messages.length, scrollToLatest]);

  const handleSend = () => {
    const text = message.trim();
    if (!text) return;

    console.log('[SUPPORT CHAT][SEND][INITIATED]', {
      senderId,
      receiverId,
      text,
      activeChatBoxId,
    });

    if (!senderId || !receiverId) {
      console.log('[SUPPORT CHAT][SEND][SKIPPED]', {
        reason: 'missing senderId or receiverId',
        senderId,
        receiverId,
      });
      setLocalError(t('chat_send_not_available'));
      return;
    }

    const payload = {
      senderId,
      receiverId,
      text,
    };
    supportChatSocketClient.sendMessage({
      sender: senderId,
      receiver: receiverId,
      text,
      chatBoxId: activeChatBoxId,
    });
    console.log('[SUPPORT CHAT][SEND][REQUEST]', payload);
    setLocalError(null);
    sendMessageMutation.mutate(
      payload,
      {
        onSuccess: (response) => {
          console.log('[SUPPORT CHAT][SEND][SUCCESS]', response);
          const nextChatBoxId = response?.chatBoxId ?? activeChatBoxId;
          if (response?.chatBoxId && response.chatBoxId !== activeChatBoxId) {
            setActiveChatBoxId(response.chatBoxId);

            queryClient.setQueryData<RiderOrderDetail>(
              riderHomeKeys.orderDetail(route.params.orderId),
              (current) => {
                if (!current) return current;
                return {
                  ...current,
                  chatBoxId: response.chatBoxId ?? current.chatBoxId,
                };
              },
            );
          }

          if (nextChatBoxId) {
            const resolvedText = response?.detail?.text?.trim() || text;
            const sentMessage: SupportChatMessage = {
              id: response.detail?.id ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
              text: resolvedText,
              senderId,
              receiverId,
              createdAt: response.detail?.createdAt ?? response.detail?.updatedAt ?? new Date().toISOString(),
            };

            queryClient.setQueryData<SupportChatMessagesResponse>(
              supportChatKeys.messages(nextChatBoxId),
              (current) => {
                const existing = current?.messages ?? [];
                const alreadyExists = existing.some((item) => item.id === sentMessage.id);
                if (alreadyExists) return current ?? { messages: existing };
                return {
                  messages: [...existing, sentMessage],
                };
              },
            );
          }

          setMessage('');
          scrollToLatest(true);
        },
        onError: (error) => {
          console.log('[SUPPORT CHAT][SEND][ERROR]', {
            message: error.message,
            status: error.status,
            code: error.code,
            data: error.data,
          });
        },
      },
    );
  };

  const openDialer = async () => {
    if (!phone) return;
    await Linking.openURL(`tel:${phone}`);
  };

  const normalizedOrderCode = route.params?.orderId
    ? `#${route.params.orderId.slice(0, 6).toUpperCase()}`
    : '—';

  const renderMessage = ({ item }: { item: SupportChatMessage }) => {
    const isMine = Boolean(
      senderId &&
      normalizeParticipantId(item.senderId) === senderId,
    );

    return (
      <View style={[styles.messageWrap, isMine ? styles.messageWrapMine : styles.messageWrapOther]}>
        {!isMine ? (
          <Text variant="caption" color={theme.colors.gray700} style={styles.senderName}>
            {title}
          </Text>
        ) : null}
        <View style={[styles.bubbleRow, isMine ? styles.myRow : styles.otherRow]}>
          <View
            style={[
              styles.bubble,
              isMine
                ? { backgroundColor: theme.colors.gray100, borderColor: theme.colors.gray200 }
                : { backgroundColor: theme.colors.emerald100, borderColor: theme.colors.green50 },
            ]}
          >
            <Text
              style={styles.messageText}
              color={theme.colors.gray800}
            >
              {item.text}
            </Text>
          </View>
        </View>
        <View style={[styles.timeRow, isMine ? styles.myRow : styles.otherRow]}>
          <Text variant="caption" color={theme.colors.gray700}>
            {formatTime(item.createdAt)}
          </Text>
          {isMine ? <Text variant="caption" color={theme.colors.gray700}>✓</Text> : null}
        </View>
      </View>
    );
  };

  const showEmptyState = !messagesQuery.isLoading && messages.length === 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.white }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.bottom : 0}
      >
        <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
              <Path d="M12 22C17.523 22 22 17.523 22 12C22 6.477 17.523 2 12 2C6.477 2 2 6.477 2 12C2 17.523 6.477 22 12 22Z" stroke={theme.colors.gray900} strokeWidth={1.5} />
              <Path d="M15 9L9 15M9 9L15 15" stroke={theme.colors.gray900} strokeWidth={1.5} strokeLinecap="round" />
            </Svg>
          </Pressable>
          <View style={styles.headerTextWrap}>
            <Text weight="medium" style={styles.headerTitle} color={theme.colors.gray900}>
              {title}
            </Text>
          </View>
          <Pressable style={styles.callButton} onPress={() => void openDialer()} disabled={!phone}>
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
              <Path
                d="M22 16.92V19.92C22.0011 20.1985 21.944 20.4742 21.8322 20.7293C21.7205 20.9844 21.5564 21.2132 21.35 21.4C21.1436 21.5868 20.8987 21.7275 20.6326 21.8137C20.3666 21.8999 20.0852 21.9297 19.806 21.901C16.7185 21.5651 13.7528 20.5101 11.151 18.821C8.73087 17.2833 6.67882 15.2312 5.141 12.811C3.44626 10.1977 2.39057 7.21885 2.061 4.11898C2.03237 3.84059 2.06202 3.55929 2.14815 3.29393C2.23428 3.02857 2.37495 2.78441 2.56162 2.57872C2.7483 2.37302 2.97681 2.20998 3.23145 2.09954C3.48608 1.9891 3.76124 1.93383 4.039 1.93698H7.039C7.5245 1.9322 7.99517 2.10488 8.36235 2.422C8.72954 2.73911 8.96716 3.17849 9.031 3.65998C9.15098 4.56995 9.37342 5.46343 9.695 6.32298C9.82977 6.68072 9.85957 7.06945 9.78088 7.4436C9.70219 7.81776 9.51819 8.16175 9.251 8.43498L7.981 9.70498C9.40456 12.2085 11.7915 14.5954 14.295 16.019L15.565 14.749C15.8382 14.4818 16.1822 14.2978 16.5564 14.2191C16.9305 14.1404 17.3193 14.1702 17.677 14.305C18.5366 14.6266 19.43 14.849 20.34 14.969C20.8267 15.0335 21.2709 15.276 21.5889 15.6518C21.907 16.0276 22.0773 16.5082 22.067 17.001L22 16.92Z"
                stroke={theme.colors.gray900}
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </Pressable>
        </View>
        <View style={styles.headerDividerWrap}>
          <View style={[styles.divider, { backgroundColor: theme.colors.gray300 }]} />
        </View>
        <View style={styles.orderMetaWrap}>
          <View style={styles.orderMetaRow}>
            <View style={styles.orderLeft}>
              <Text variant="caption" weight="medium" color={theme.colors.gray900}>
                {t('chat_order_number')}
              </Text>
              <View style={[styles.orderChip, { backgroundColor: theme.colors.gray100, borderColor: theme.colors.gray200 }]}>
                <Text variant="caption" weight="medium" color={theme.colors.gray500}>
                  {normalizedOrderCode}
                </Text>
              </View>
            </View>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.colors.gray300 }]} />
        </View>

        <View style={[styles.flex, { backgroundColor: theme.colors.white }]}>
          {messagesQuery.isLoading ? (
            <View style={styles.centerContent}>
              <ActivityIndicator color={theme.colors.primary} />
            </View>
          ) : showEmptyState ? (
            <View style={styles.centerContent}>
              <View style={[styles.emptyCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.gray200 }]}>
                <Text weight="semiBold" color={theme.colors.gray700}>{t('chat_no_messages')}</Text>
                <Text variant="caption" color={theme.colors.gray500} style={styles.emptyHint}>
                  {t('chat_empty_hint')}
                </Text>
              </View>
            </View>
          ) : (
            <FlatList
              ref={listRef}
              data={messages}
              keyExtractor={(item, index) => item.id || `${item.createdAt ?? 'message'}-${index}`}
              renderItem={renderMessage}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.messagesContent}
              onContentSizeChange={() => scrollToLatest(false)}
            />
          )}
        </View>

        <View
          style={[
            styles.composerBar,
            {
              backgroundColor: theme.colors.primary,
              paddingBottom: insets.bottom + 14,
              shadowColor: theme.colors.black,
            },
          ]}
        >
          <View style={[styles.composerInputWrap, { backgroundColor: theme.colors.white }]}>
            <Pressable style={styles.plusButton}>
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                <Path d="M12 22C17.523 22 22 17.523 22 12C22 6.477 17.523 2 12 2C6.477 2 2 6.477 2 12C2 17.523 6.477 22 12 22Z" stroke={theme.colors.gray500} strokeWidth={1.8} />
                <Path d="M12 8V16M8 12H16" stroke={theme.colors.gray500} strokeWidth={1.8} strokeLinecap="round" />
              </Svg>
            </Pressable>
            <RNTextInput
              value={message}
              onChangeText={setMessage}
              placeholder={t('chat_reply_customer')}
              style={[styles.input, { color: theme.colors.gray500 }]}
              placeholderTextColor={theme.colors.gray500}
            />
            <Pressable
              style={({ pressed }) => [
                styles.sendIconButton,
                pressed ? styles.pressed : null,
                sendMessageMutation.isPending ? styles.disabled : null,
              ]}
              onPress={handleSend}
              disabled={sendMessageMutation.isPending}
            >
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                <Path d="M22 2L11 13" stroke={theme.colors.gray900} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
                <Path d="M22 2L15 22L11 13L2 9L22 2Z" stroke={theme.colors.gray900} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </Pressable>
          </View>
        </View>

        {localError ? (
          <View style={styles.errorRow}>
            <Text variant="caption" color={theme.colors.red500}>
              {localError}
            </Text>
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  header: {
    minHeight: 56,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  backButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextWrap: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    lineHeight: 24,
  },
  callButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerDividerWrap: {
    paddingHorizontal: 16,
  },
  divider: {
    height: 1,
    width: '100%',
  },
  orderMetaWrap: {
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 12,
  },
  orderMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  orderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderChip: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  emptyCard: {
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
  },
  emptyHint: {
    marginTop: 4,
    textAlign: 'center',
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 18,
  },
  messageWrap: {
    gap: 4,
    maxWidth: '100%',
    marginBottom: 12,
  },
  messageWrapMine: {
    alignItems: 'flex-end',
  },
  messageWrapOther: {
    alignItems: 'flex-start',
  },
  senderName: {
    marginBottom: 1,
  },
  bubbleRow: {
    width: '100%',
    flexDirection: 'row',
  },
  myRow: {
    justifyContent: 'flex-end',
  },
  otherRow: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  composerBar: {
    paddingHorizontal: 12,
    paddingTop: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  composerInputWrap: {
    borderRadius: 20,
    minHeight: 58,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  plusButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    minHeight: 22,
    paddingVertical: 0,
  },
  sendIconButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.9,
  },
  disabled: {
    opacity: 0.65,
  },
  errorRow: {
    paddingHorizontal: 14,
    paddingBottom: 8,
  },
});
