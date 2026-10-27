export interface ReportPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── 1. Task Operational Report ─────────────────────────────────
export interface TaskReportSummary {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  totalTimeLogged: number;
  completionVelocity: number;
}

export interface TaskReportItem {
  _id: string;
  status: string;
  priority: string;
  dueDate: string;
  timeLogged: number;
  billableAmount: number;
  isBilled?: boolean;
  createdAt: string;
  client?: {
    _id: string;
    name: string;
    fileNo?: string;
  };
  service?: {
    _id: string;
    name: string;
  };
  assignees?: {
    _id: string;
    name: string;
  }[];
}

export interface TaskReportResponse {
  summary: TaskReportSummary;
  pagination: ReportPagination;
  data: TaskReportItem[];
}

export interface TaskReportQuery {
  serviceId?: string;
  assignedUserId?: string;
  clientId?: string;
  status?: string;
  priority?: string;
  startDate?: string;
  endDate?: string;
  dueDateStart?: string;
  dueDateEnd?: string;
  page?: number;
  limit?: number;
}

// ─── 2. Services & Yield Report ─────────────────────────────────
export interface ServiceSubscriptionItem {
  serviceId: string;
  serviceName: string;
  clientCount: number;
  totalRevenueYield: number;
}

export interface ServiceReportResponse {
  summary: {
    totalServicesOffered: number;
    totalActiveSubscriptions: number;
    totalMonthlyRecurringRevenue: number;
  };
  data: ServiceSubscriptionItem[];
}

// ─── 3. DSC Renewals Report ─────────────────────────────────────
export interface DscReportSummary {
  totalTokens: number;
  expiringIn30Days: number;
  expiringIn60Days: number;
  expiringIn90Days: number;
  expiringIn180Days: number;
  expired: number;
}

export interface DscReportItem {
  _id: string;
  status: string;
  currentHolderName?: string;
  expiryDate: string;
  issueDate?: string;
  daysRemaining: number;
  client?: {
    _id: string;
    name: string;
  };
}

export interface DscReportResponse {
  summary: DscReportSummary;
  pagination: ReportPagination;
  data: DscReportItem[];
}

export interface DscReportQuery {
  days?: string;
  status?: string;
  clientId?: string;
  page?: number;
  limit?: number;
}

// ─── 4. Invoices & Revenue Breakdown Report ─────────────────────
export interface InvoiceReportSummary {
  totalInvoiced: number;
  totalTaxable: number;
  totalDiscount: number;
  totalTax: number;
  totalPaid: number;
  totalDue: number;
  invoiceCount: number;
}

export interface InvoiceReportItem {
  _id: string;
  invoiceNo: string;
  date: string;
  dueDate: string;
  status: string;
  totals: {
    grandTotal: number;
    totalTaxable: number;
    totalGst: number;
    amountPaid: number;
    amountDue: number;
  };
  client?: {
    _id: string;
    name: string;
    gstin?: string;
  };
  billingEntity?: {
    _id: string;
    name: string;
  };
}

export interface InvoiceReportResponse {
  summary: InvoiceReportSummary;
  pagination: ReportPagination;
  data: InvoiceReportItem[];
}

export interface InvoiceReportQuery {
  billingEntityId?: string;
  status?: string;
  paymentStatus?: string;
  clientId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

// ─── 5. Debtors Aging Matrix Report ─────────────────────────────
export interface DebtorsAgingSummary {
  totalOutstanding: number;
  totalCurrent0_30: number;
  totalOverdue31_60: number;
  totalCritical61_90: number;
  totalDelinquent90Plus: number;
  totalDebtorsCount: number;
}

export interface DebtorsAgingInvoice {
  invoiceNo: string;
  dueDate: string;
  daysOverdue: number;
  amountDue: number;
  status: string;
}

export interface DebtorsAgingItem {
  clientId: string;
  clientName: string;
  pan?: string;
  mobile?: string;
  totalDue: number;
  bucket0_30: number;
  bucket31_60: number;
  bucket61_90: number;
  bucket90Plus: number;
  invoicesCount: number;
  oldestDueDate?: string;
  invoices?: DebtorsAgingInvoice[];
}

export interface DebtorsAgingReportResponse {
  summary: DebtorsAgingSummary;
  pagination: ReportPagination;
  data: DebtorsAgingItem[];
}

export interface DebtorsAgingQuery {
  clientId?: string;
  page?: number;
  limit?: number;
}
