import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { SupportTicket } from '../../api/supportTicketService';
import Text from '../Text';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useTranslations } from '../../localization/LocalizationProvider';
import { supportTicketTitle } from './supportTicketTitle';

type Filter = 'all' | 'active' | 'closed';
type Props = {
  tickets: SupportTicket[];
  isLoading: boolean;
  isError: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  onNewTicket: () => void;
  onOpenTicket: (chatBoxId: string) => void;
};

export default function SupportTicketsHome({ tickets, isLoading, isError, isRefreshing, onRefresh, onNewTicket, onOpenTicket }: Props) {
  const { theme } = useAppTheme();
  const { t } = useTranslations('app');
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const visible = useMemo(() => tickets.filter((ticket) => {
    const closed = ticket.status.key === 'closed' || ticket.status.key === 'resolved';
    if (filter === 'active' && closed) return false;
    if (filter === 'closed' && !closed) return false;
    return `${ticket.title} ${ticket.subtitle}`.toLowerCase().includes(search.trim().toLowerCase());
  }), [tickets, filter, search]);

  return (
    <ScrollView style={{ backgroundColor: theme.colors.background }} contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={theme.colors.brandInk} />}
      keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <View style={styles.intro}>
        <View style={styles.introCopy}>
          <Text weight="bold" style={[styles.heading, { color: theme.colors.gray900 }]}>{t('support_tickets_heading')}</Text>
          <Text style={{ color: theme.colors.gray600 }}>{t('support_tickets_subtitle')}</Text>
        </View>
        <Pressable accessibilityRole="button" onPress={onNewTicket}
          style={[styles.newButton, { backgroundColor: theme.colors.primary }]}>
          <Ionicons name="add" size={18} color={theme.colors.gray900} />
          <Text weight="semiBold" style={{ color: theme.colors.gray900 }}>{t('support_new_ticket_short')}</Text>
        </Pressable>
      </View>

      <View style={[styles.search, { backgroundColor: theme.colors.gray50, borderColor: theme.colors.gray200 }]}>
        <Ionicons name="search-outline" size={20} color={theme.colors.gray500} />
        <TextInput value={search} onChangeText={setSearch} placeholder={t('support_search')}
          placeholderTextColor={theme.colors.gray500} style={[styles.searchInput, { color: theme.colors.gray900 }]} />
      </View>

      <View style={styles.filters}>
        {(['all', 'active', 'closed'] as const).map((value) => (
          <Pressable key={value} accessibilityRole="tab" accessibilityState={{ selected: filter === value }}
            onPress={() => setFilter(value)} style={[styles.filter, { backgroundColor: filter === value ? theme.colors.primary : theme.colors.gray50 }]}>
            <Text weight="semiBold" style={{ color: theme.colors.gray900 }}>
              {t(`support_filter_${value}`)}
            </Text>
          </Pressable>
        ))}
      </View>

      {isLoading && !tickets.length ? (
        <View style={styles.state}><ActivityIndicator color={theme.colors.brandInk} /><Text style={{ color: theme.colors.gray600 }}>{t('support_loading')}</Text></View>
      ) : isError && !tickets.length ? (
        <View style={[styles.stateCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.gray200 }]}>
          <Ionicons name="cloud-offline-outline" size={30} color={theme.colors.brandInk} />
          <Text weight="bold" style={[styles.stateTitle, { color: theme.colors.gray900 }]}>{t('support_load_failed_title')}</Text>
          <Text style={[styles.stateCopy, { color: theme.colors.gray600 }]}>{t('support_load_failed_body')}</Text>
        </View>
      ) : visible.length === 0 ? (
        <View style={[styles.stateCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.gray200 }]}>
          <View style={[styles.emptyIcon, { backgroundColor: theme.colors.primarySoft }]}><Ionicons name="document-text-outline" size={28} color={theme.colors.brandInk} /></View>
          <Text weight="bold" style={[styles.stateTitle, { color: theme.colors.gray900 }]}>{tickets.length ? t('support_no_results') : t('support_empty_title')}</Text>
          <Text style={[styles.stateCopy, { color: theme.colors.gray600 }]}>{tickets.length ? t('support_no_results_body') : t('support_empty')}</Text>
          {!tickets.length && <Pressable onPress={onNewTicket} style={[styles.emptyAction, { borderColor: theme.colors.brandInk }]}><Text weight="semiBold" style={{ color: theme.colors.brandInk }}>{t('support_new_ticket')}</Text></Pressable>}
        </View>
      ) : (
        <View style={styles.ticketList}>
          <Text weight="semiBold" style={[styles.sectionTitle, { color: theme.colors.gray900 }]}>{t('support_recent_tickets')}</Text>
          {visible.map((ticket) => {
            const closed = ticket.status.key === 'closed' || ticket.status.key === 'resolved';
            return (
              <Pressable key={ticket.id} accessibilityRole="button" disabled={!ticket.chatBoxId}
                onPress={() => ticket.chatBoxId && onOpenTicket(ticket.chatBoxId)}
                style={[styles.ticket, { backgroundColor: theme.colors.surface, borderColor: theme.colors.gray200, shadowColor: theme.colors.shadow }]}>
                <View style={styles.ticketTop}>
                  <View style={[styles.date, { backgroundColor: theme.colors.gray50 }]}>
                    <Text weight="bold" style={{ color: theme.colors.gray900 }}>{ticket.date?.day ?? '—'}</Text>
                    <Text variant="caption" style={{ color: theme.colors.gray600 }}>{ticket.date?.month ?? ''}</Text>
                  </View>
                  <View style={styles.ticketCopy}>
                    <Text weight="semiBold" numberOfLines={1} style={{ color: theme.colors.gray900 }}>{supportTicketTitle(ticket.title)}</Text>
                    <Text numberOfLines={2} style={{ color: theme.colors.gray600 }}>{ticket.subtitle}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={theme.colors.gray400} />
                </View>
                <View style={[styles.ticketFooter, { borderTopColor: theme.colors.gray200 }]}>
                  <View style={[styles.status, { backgroundColor: closed ? theme.colors.green50 : theme.colors.primarySoft }]}>
                    <Text variant="caption" weight="semiBold" style={{ color: closed ? theme.colors.green600 : theme.colors.brandInk }}>{ticket.status.label}</Text>
                  </View>
                  {ticket.unreadCount > 0 && <Text variant="caption" weight="semiBold" style={{ color: theme.colors.brandInk }}>{ticket.unreadCount} {t('support_unread')}</Text>}
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40, gap: 20 }, intro: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  introCopy: { flex: 1, gap: 4 }, heading: { fontSize: 22, lineHeight: 28 }, newButton: { paddingHorizontal: 13, minHeight: 42, borderRadius: 10, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 3 },
  search: { height: 50, borderRadius: 12, borderWidth: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 8 },
  searchInput: { flex: 1, fontSize: 15 }, filters: { flexDirection: 'row', gap: 8 },
  filter: { minHeight: 36, borderRadius: 18, paddingHorizontal: 18, justifyContent: 'center' }, state: { minHeight: 180, alignItems: 'center', justifyContent: 'center', gap: 12 },
  stateCard: { minHeight: 250, borderWidth: 1, borderRadius: 18, padding: 24, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyIcon: { width: 58, height: 58, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  stateTitle: { fontSize: 18, textAlign: 'center' }, stateCopy: { textAlign: 'center', lineHeight: 22 },
  emptyAction: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 18, paddingVertical: 10, marginTop: 4 },
  ticketList: { gap: 12 }, sectionTitle: { fontSize: 16 }, ticket: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 },
  ticketTop: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 }, date: { width: 46, height: 50, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  ticketCopy: { flex: 1, gap: 4 }, ticketFooter: { borderTopWidth: StyleSheet.hairlineWidth, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  status: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
});
