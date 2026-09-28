import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, AppState, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import apiClient from '../api/apiClient';
import Text from '../components/Text';
import { useAppTheme } from '../theme/ThemeProvider';
import type { MainStackParamList } from '../navigation/types';
import { useTranslations } from '../localization/LocalizationProvider';

type Props = NativeStackScreenProps<MainStackParamList, 'Notifications'>;
type NotificationItem = {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  isRead: boolean;
  data?: { orderId?: string; type?: string } | null;
  deep_link?: string | null;
};
type NotificationPage = { data: NotificationItem[]; total: number };
const path = '/apps/deliveries/users-notifications';

export default function NotificationsScreen({ navigation }: Props) {
  const { theme } = useAppTheme();
  const { t } = useTranslations('app');
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [total, setTotal] = useState(0);
  const list = useQuery({
    queryKey: ['rider-notifications', page],
    queryFn: () => apiClient.get<NotificationPage>(`${path}/user/me`, { page, limit: 20 }),
  });
  const markRead = useMutation({
    mutationFn: (id: string) => apiClient.patch(`${path}/mark-read/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['rider-notifications'] });
      void queryClient.invalidateQueries({ queryKey: ['rider-notification-count'] });
    },
  });

  useEffect(() => {
    if (!list.data) return;
    const nextItems = list.data.data;
    setTotal(list.data.total);
    setItems((current) => page === 1
      ? nextItems
      : [...current.filter((item) => !nextItems.some((next) => next.id === item.id)), ...nextItems]);
  }, [list.data, page]);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void queryClient.invalidateQueries({ queryKey: ['rider-notifications'] });
    });
    return () => subscription.remove();
  }, [queryClient]);

  const openItem = useCallback((item: NotificationItem) => {
    if (!item.isRead) {
      setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, isRead: true } : entry));
      markRead.mutate(item.id);
    }
    const orderId = item.data?.orderId ?? item.deep_link?.match(/^\/orders\/([0-9a-f-]{36})$/i)?.[1];
    if (orderId) navigation.navigate('ProcessingOrderDetail', { orderId });
  }, [markRead, navigation]);

  const unreadCount = items.filter((item) => !item.isRead).length;

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.colors.background }]} edges={['top', 'bottom']}>
      <View style={[styles.header, { borderBottomColor: theme.colors.gray200 }]}>
        <Pressable
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
          style={[styles.back, { backgroundColor: theme.colors.gray100 }]}
        >
          <Feather name="arrow-left" size={21} color={theme.colors.gray900} />
        </Pressable>
        <Text weight="semiBold" style={[styles.title, { color: theme.colors.gray900 }]}>{t('notifications_title')}</Text>
        <View style={styles.back} />
      </View>
      {list.isLoading && items.length === 0 ? <ActivityIndicator style={styles.loading} color={theme.colors.primary} /> : null}
      {list.isError && items.length === 0 ? (
        <Pressable onPress={() => void list.refetch()} style={[styles.empty, { backgroundColor: theme.colors.gray50 }]}>
          <Feather name="alert-circle" size={28} color={theme.colors.gray500} />
          <Text style={{ color: theme.colors.gray900 }}>{t('notifications_retry')}</Text>
        </Pressable>
      ) : null}
      {!list.isLoading && !list.isError && items.length === 0 ? (
        <View style={[styles.empty, { backgroundColor: theme.colors.gray50 }]}>
          <Feather name="bell" size={28} color={theme.colors.gray500} />
          <Text style={{ color: theme.colors.gray600, textAlign: 'center' }}>{t('notifications_empty')}</Text>
        </View>
      ) : null}
      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {items.length > 0 ? (
          <View style={styles.sectionHeader}>
            <Text weight="semiBold" style={[styles.sectionTitle, { color: theme.colors.gray900 }]}>{t('notifications_recent')}</Text>
            {unreadCount > 0 ? (
              <View style={[styles.unreadPill, { backgroundColor: theme.colors.green50 }]}>
                <Text weight="semiBold" style={[styles.unreadPillText, { color: theme.colors.green600 }]}>
                  {t('notifications_unread', { count: unreadCount })}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}
        {items.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => openItem(item)}
            accessibilityRole="button"
            accessibilityLabel={`${item.title}. ${item.description}`}
            style={[styles.row, {
              backgroundColor: item.isRead ? theme.colors.surface : theme.colors.gray50,
              borderColor: theme.colors.gray200,
            }]}
          >
            <View style={[styles.iconWrap, { backgroundColor: item.isRead ? theme.colors.gray100 : theme.colors.green50 }]}>
              <Feather
                name={item.data?.type === 'chat_message' ? 'message-circle' : item.data?.type === 'rider_assignment' ? 'navigation' : 'package'}
                size={21}
                color={item.isRead ? theme.colors.gray500 : theme.colors.green600}
              />
            </View>
            <View style={styles.rowText}>
              <View style={styles.titleLine}>
                <Text weight="semiBold" style={[styles.itemTitle, { color: theme.colors.gray900 }]}>{item.title}</Text>
                {!item.isRead ? <View style={[styles.dot, { backgroundColor: theme.colors.green600 }]} /> : null}
              </View>
              <Text style={[styles.description, { color: theme.colors.gray600 }]}>{item.description}</Text>
              <Text style={[styles.date, { color: theme.colors.gray500 }]}>
                {new Date(item.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                {'  ·  '}
                {new Date(item.createdAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
              </Text>
            </View>
            {item.data?.orderId ? <Feather name="chevron-right" size={18} color={theme.colors.gray400} /> : null}
          </Pressable>
        ))}
        {items.length < total || (list.isError && items.length > 0) ? (
          <Pressable onPress={() => { if (list.isError) void list.refetch(); else setPage((current) => current + 1); }} style={styles.more} disabled={list.isFetching}>
            <Text weight="semiBold" color={theme.colors.primary}>{t(list.isError ? 'notifications_retry' : list.isFetching ? 'notifications_loading' : 'notifications_more')}</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { minHeight: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, borderBottomWidth: StyleSheet.hairlineWidth },
  back: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 19, lineHeight: 25, textAlign: 'center' },
  loading: { marginTop: 40 },
  empty: { margin: 20, marginTop: 32, padding: 36, borderRadius: 20, alignItems: 'center', gap: 12 },
  list: { paddingHorizontal: 20, paddingTop: 26, gap: 12, paddingBottom: 40 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  sectionTitle: { fontSize: 17, lineHeight: 23 },
  unreadPill: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  unreadPillText: { fontSize: 11, lineHeight: 15 },
  row: { flexDirection: 'row', alignItems: 'flex-start', borderWidth: 1, borderRadius: 18, padding: 16, gap: 13 },
  iconWrap: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 7, height: 7, borderRadius: 4, marginTop: 7, marginLeft: 6 },
  rowText: { flex: 1, gap: 5 },
  titleLine: { flexDirection: 'row', alignItems: 'flex-start' },
  itemTitle: { flex: 1, fontSize: 15, lineHeight: 21 },
  description: { fontSize: 13, lineHeight: 19 },
  date: { marginTop: 7, fontSize: 11, lineHeight: 16 },
  more: { alignItems: 'center', padding: 16 },
});
