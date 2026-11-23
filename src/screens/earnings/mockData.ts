export type EarningsChartPoint = {
  label: string;
  amount: number;
  barHeight: number;
};

export type EarningsActivity = {
  id: string;
  date: string;
  amount: number;
  hoursWorked: string;
  tips: number;
  deliveriesCount: number;
  deliveriesAmount: number;
};

export type EarningsSummary = {
  hours: string;
  deliveries: number;
  totalEarnings: number;
};

export type DeliveryItem = {
  id: string;
  status: 'Completed';
  payment: number;
};

export const earningsChartData: EarningsChartPoint[] = [
  { label: '23 Jan- 29 Jan', amount: 200, barHeight: 88 },
  { label: '23 Jan- 29 Jan', amount: 400, barHeight: 121 },
  { label: '23 Jan- 29 Jan', amount: 600, barHeight: 167 },
  { label: '23 Jan- 29 Jan', amount: 300, barHeight: 92 },
];

export const earningsActivities: EarningsActivity[] = [
  {
    id: 'earning-1',
    date: '20.02.2023',
    amount: 600,
    hoursWorked: '6h 1m',
    tips: 50,
    deliveriesCount: 8,
    deliveriesAmount: 550,
  },
  {
    id: 'earning-2',
    date: '20.02.2023',
    amount: 100,
    hoursWorked: '2h 20m',
    tips: 10,
    deliveriesCount: 3,
    deliveriesAmount: 90,
  },
  {
    id: 'earning-3',
    date: '20.02.2023',
    amount: 100,
    hoursWorked: '2h 10m',
    tips: 15,
    deliveriesCount: 2,
    deliveriesAmount: 85,
  },
  {
    id: 'earning-4',
    date: '20.02.2023',
    amount: 100,
    hoursWorked: '1h 50m',
    tips: 8,
    deliveriesCount: 2,
    deliveriesAmount: 92,
  },
  {
    id: 'earning-5',
    date: '20.02.2023',
    amount: 100,
    hoursWorked: '2h 35m',
    tips: 12,
    deliveriesCount: 4,
    deliveriesAmount: 88,
  },
  {
    id: 'earning-6',
    date: '20.02.2023',
    amount: 100,
    hoursWorked: '1h 40m',
    tips: 6,
    deliveriesCount: 3,
    deliveriesAmount: 94,
  },
  {
    id: 'earning-7',
    date: '20.02.2023',
    amount: 100,
    hoursWorked: '1h 55m',
    tips: 9,
    deliveriesCount: 2,
    deliveriesAmount: 91,
  },
];

export const earningsSummary: EarningsSummary = {
  hours: '175h 50m',
  deliveries: 267,
  totalEarnings: 1200,
};

export const deliveryItems: DeliveryItem[] = [
  { id: '#1234UA', status: 'Completed', payment: 150 },
  { id: '#1235UA', status: 'Completed', payment: 150 },
  { id: '#1236UA', status: 'Completed', payment: 150 },
  { id: '#1237UA', status: 'Completed', payment: 150 },
  { id: '#1238UA', status: 'Completed', payment: 150 },
  { id: '#1239UA', status: 'Completed', payment: 150 },
  { id: '#1240UA', status: 'Completed', payment: 150 },
];
