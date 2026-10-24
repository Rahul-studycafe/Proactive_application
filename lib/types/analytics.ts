export interface ClientEntityDistributionItem {
  entityType: string;
  count: number;
  percentage: number;
}

export interface StaffPerformanceItem {
  userId: string;
  name: string;
  username: string;
  totalAssigned: number;
  completed: number;
  completionPercentage: number;
  rank: number;
}

export interface AttendanceKPIOverview {
  date: string;
  totalStaff: number;
  presentToday: number;
  halfDayToday: number;
  onLeaveToday: number;
  absentToday: number;
  unmarkedToday: number;
  presenceRate: number;
}

export interface DashboardOverviewData {
  quickStats: {
    totalClients: number;
    pendingTasks: number;
    overdueInvoices: number;
    totalReceivables: number;
    totalUnbilled: number;
  };
  clientDistribution: ClientEntityDistributionItem[];
  staffLeaderboard: StaffPerformanceItem[];
  attendanceOverview: AttendanceKPIOverview;
  upcomingHolidays?: Array<{
    _id: string;
    name: string;
    date: string;
    type: string;
    description?: string;
  }>;
  recentActivity: {
    invoices: any[];
    receipts: any[];
    completedTasks: any[];
  };
}
