export const authKeys = {
  all: ['auth'] as const,
  session: () => [...authKeys.all, 'session'] as const,
  me: () => [...authKeys.all, 'me'] as const,
};

export const riderHomeKeys = {
  all: ['riderHome'] as const,
  summary: () => [...riderHomeKeys.all, 'summary'] as const,
  ordersAll: () => [...riderHomeKeys.all, 'orders'] as const,
  orderDetail: (orderId: string) => [...riderHomeKeys.all, 'orderDetail', orderId] as const,
  orders: (tab: 'new' | 'processing' | 'delivered', search: string) =>
    [...riderHomeKeys.all, 'orders', tab, search] as const,
};

export const earningsKeys = {
  all: ['earnings'] as const,
  summary: (groupBy: 'day' | 'week' | 'month', recentLimit: number) =>
    [...earningsKeys.all, 'summary', groupBy, recentLimit] as const,
  activities: (page: number, limit: number) =>
    [...earningsKeys.all, 'activities', page, limit] as const,
  activityDeliveries: (activityDate: string) =>
    [...earningsKeys.all, 'activityDeliveries', activityDate] as const,
};


export const riderWalletKeys = {
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
  messages: (chatBoxId: string) => [...supportChatKeys.all, 'messages', chatBoxId] as const,
};
