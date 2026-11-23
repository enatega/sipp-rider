import apiClient from './apiClient';
import {
  RiderEarningsActivityDeliveriesResponse,
  RiderEarningsActivitiesQueryParams,
  RiderEarningsActivitiesResponse,
  RiderEarningsQueryParams,
  RiderEarningsResponse,
} from './earningsTypes';

const RIDER_EARNINGS = '/apps/deliveries/rider/earnings';

export const earningsService = {
  getRiderEarnings: (params: RiderEarningsQueryParams) =>
    apiClient.get<RiderEarningsResponse>(RIDER_EARNINGS, params),

  getRiderEarningsActivities: (params: RiderEarningsActivitiesQueryParams) =>
    apiClient.get<RiderEarningsActivitiesResponse>(`${RIDER_EARNINGS}/activities`, params),

  getRiderEarningsActivityDeliveries: (activityDate: string) =>
    apiClient.get<RiderEarningsActivityDeliveriesResponse>(
      `${RIDER_EARNINGS}/activities/${activityDate}`,
    ),
};
