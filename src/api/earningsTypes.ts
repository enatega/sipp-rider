export type RiderEarningsQueryParams = {
  groupBy: 'day' | 'week' | 'month';
  recentLimit: number;
};

export type RiderEarningsActivitiesQueryParams = {
  page: number;
  limit: number;
};

export type RiderEarningsDateRange = {
  start_date: string;
  end_date: string;
};

export type RiderEarningsSummary = {
  hours_worked: string;
  deliveries: number;
  total_earnings: number;
  deliveries_earnings: number;
  tips: number;
};

export type RiderEarningsChartPoint = {
  bucket_start: string;
  label: string;
  deliveries: number;
  total_earnings: number;
  deliveries_earnings: number;
  tips: number;
};

export type RiderEarningsActivity = {
  activity_date: string;
  title: string;
  deliveries: number;
  total_earnings: number;
  deliveries_earnings: number;
  tips: number;
  hours_worked?: string;
};

export type RiderEarningsActivityDelivery = {
  order_id: string;
  order_code: string;
  status: string;
  payment_amount: number;
  rider_earning: number;
  delivered_at: string;
};

export type RiderEarningsActivityDeliveriesResponse = {
  activity_date: string;
  summary: {
    total_earnings: number;
    hours_worked: string;
    tips: number;
    deliveries: {
      count: number;
      earnings: number;
    };
  };
  deliveries: RiderEarningsActivityDelivery[];
};

export type RiderEarningsResponse = {
  date_range: RiderEarningsDateRange;
  summary: RiderEarningsSummary;
  chart: RiderEarningsChartPoint[];
  recent_activity: RiderEarningsActivity[];
};

export type RiderEarningsActivitiesResponse = {
  date_range: RiderEarningsDateRange;
  summary: RiderEarningsSummary;
  data: RiderEarningsActivity[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};
