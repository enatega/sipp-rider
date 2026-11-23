import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { io } from 'socket.io-client';
import { useAuth } from '../auth/AuthProvider';
import { apiConfig } from '../api/apiConfig';
import { supportTicketKeys } from '../api/queryKeys';
import { supportTicketService, type TicketConversation, type TicketMessage } from '../api/supportTicketService';

type SupportSocketUpdate = {
  type: 'ticket_created' | 'message' | 'status_updated' | 'ticket_assigned' | 'priority_updated';
  chatBoxId: string;
  requesterId: string;
  status?: string;
  message?: TicketMessage;
};

export function useSupportTickets(chatBoxId: string | null) {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const list = useQuery({ queryKey: supportTicketKeys.list(), queryFn: supportTicketService.list });
  const messages = useQuery({
    queryKey: supportTicketKeys.messages(chatBoxId ?? ''),
    queryFn: () => supportTicketService.messages(chatBoxId!),
    enabled: Boolean(chatBoxId),
  });
  const create = useMutation({
    mutationFn: ({ email, reason, description }: { email: string; reason: string; description: string }) =>
      supportTicketService.create(email, reason, description),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: supportTicketKeys.list() }),
  });
  const send = useMutation({
    mutationFn: (text: string) => supportTicketService.send(chatBoxId!, text),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: supportTicketKeys.messages(chatBoxId!) });
      void queryClient.invalidateQueries({ queryKey: supportTicketKeys.list() });
    },
  });

  useEffect(() => {
    if (!session.token || !session.user?.id) return;
    const socketBase = process.env.EXPO_PUBLIC_SOCKET_URL ?? new URL(apiConfig.baseUrl).origin;
    const socket = io(`${socketBase.replace(/\/$/, '')}/deliveries`, {
      autoConnect: false,
      auth: { token: session.token },
      path: process.env.EXPO_PUBLIC_SOCKET_PATH ?? '/socket.io',
      transports: ['websocket'],
    });
    const refresh = () => {
      socket.emit('add-user', session.user!.id);
      void queryClient.invalidateQueries({ queryKey: supportTicketKeys.all });
    };
    const onSupportUpdated = (update: SupportSocketUpdate) => {
      if (update.requesterId !== session.user?.id || !update.chatBoxId) return;
      const key = supportTicketKeys.messages(update.chatBoxId);
      if (update.type === 'message' && update.message?.id) {
        const incoming = update.message;
        queryClient.setQueryData<TicketConversation>(key, (current) => current ? {
          ...current,
          messages: current.messages.some((item) => item.id === incoming.id)
            ? current.messages
            : [...current.messages, incoming],
        } : current);
      } else if (update.type === 'status_updated' && update.status) {
        queryClient.setQueryData<TicketConversation>(key, (current) => current ? { ...current, status: update.status! } : current);
      }
      void queryClient.invalidateQueries({ queryKey: key });
      void queryClient.invalidateQueries({ queryKey: supportTicketKeys.list() });
    };
    socket.on('connect', refresh);
    socket.on('support-updated', onSupportUpdated);
    socket.on('connect_error', (error: Error) => console.warn('[Support tickets] Socket connection failed:', error.message));
    socket.connect();
    return () => { socket.removeAllListeners(); socket.disconnect(); };
  }, [session.token, session.user?.id, queryClient]);

  return { list, messages, create, send };
}
