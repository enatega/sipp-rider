export const authKeys = {
  all: ['auth'] as const,
  session: () => [...authKeys.all, 'session'] as const,
  me: () => [...authKeys.all, 'me'] as const,
};

export const riderHomeKeys = {
  all: ['riderHome'] as const,
  deliveryIssueMessages: (userId: string, chatId: string) => ['riderHome', 'deliveryIssueMessages', userId, chatId] as const,
  deliveryProblem: (userId: string, orderId: string) => ['riderHome', 'deliveryProblem', userId, orderId] as const,
  summary: () => [...riderHomeKeys.all, 'summary'] as const,
  /** Mutation key for the rider's own "Assign me" claim. */
  assignMe: () => [...riderHomeKeys.all, 'assignMe'] as const,
  ordersAll: () => [...riderHomeKeys.all, 'orders'] as const,
  orderDetail: (orderId: string) => [...riderHomeKeys.all, 'orderDetail', orderId] as const,
  orderRoutes: () => [...riderHomeKeys.all, 'orderRoute'] as const,
  orderRoute: (orderId: string) => [...riderHomeKeys.orderRoutes(), orderId] as const,
  orders: (tab: 'new' | 'processing' | 'delivered', search: string) =>
    [...riderHomeKeys.all, 'orders', tab, search] as const,
};

export const earningsKeys = {
  all: ['earnings'] as const,
  summary: (groupBy: 'day' | 'week' | 'month', recentLimit: number) =>
    [...earningsKeys.all, 'summary', groupBy, recentLimit] as const,
  activities: (page: number, limit: number, startDate?: string, endDate?: string) =>
    [...earningsKeys.all, 'activities', page, limit, startDate, endDate] as const,
  activityDeliveries: (activityDate: string) =>
    [...earningsKeys.all, 'activityDeliveries', activityDate] as const,
};


export const riderWalletKeys = {
  withdrawals: () => ['riderWallet', 'withdrawals'] as const,
  withdrawal: (id: string) => ['riderWallet', 'withdrawal', id] as const,
  all: ['riderWallet'] as const,
  balance: () => [...riderWalletKeys.all, 'balance'] as const,
  historyAll: () => [...riderWalletKeys.all, 'history'] as const,
  history: (transactionType: 'deposit' | 'withdrawal' | 'all') =>
    [...riderWalletKeys.historyAll(), transactionType] as const,
};

export const vehicleTypesKeys = {
  all: ['vehicleTypes'] as const,
  list: () => [...vehicleTypesKeys.all, 'list'] as const,
};

export const bankDetailsKeys = {
  all: ['bankDetails'] as const,
  detail: () => [...bankDetailsKeys.all, 'detail'] as const,
};

export const workScheduleKeys = {
  all: ['workSchedule'] as const,
  detail: () => [...workScheduleKeys.all, 'detail'] as const,
};

export const languageKeys = {
  all: ['languageSettings'] as const,
  detail: () => [...languageKeys.all, 'detail'] as const,
};

export const riderProfileKeys = {
  all: ['riderProfile'] as const,
  detail: () => [...riderProfileKeys.all, 'detail'] as const,
};

export const appCurrencyKeys = {
  all: ['appCurrency'] as const,
  detail: () => [...appCurrencyKeys.all, 'detail'] as const,
};

export const supportChatKeys = {
  all: ['supportChat'] as const,
  unread: () => [...supportChatKeys.all, 'unread'] as const,
  messages: (chatBoxId: string) => [...supportChatKeys.all, 'messages', chatBoxId] as const,
  order: (orderId: string, kind: string) => [...supportChatKeys.all, 'order', orderId, kind] as const,
};

export const supportTicketKeys = {
  all: ['support-tickets'] as const,
  list: () => [...supportTicketKeys.all, 'list'] as const,
  messages: (chatBoxId: string) => [...supportTicketKeys.all, 'messages', chatBoxId] as const,
};
