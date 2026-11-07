export type ExpensePaymentMode =
  | "Bank Transfer"
  | "Cash"
  | "UPI"
  | "Credit Card"
  | "Cheque";

export interface ClientExpense {
  _id: string;
  tenantId: string;
  clientId:
    | {
        _id: string;
        name: string;
        clientNumber?: string;
        fileNo?: string;
        pan?: string;
        email?: string;
        mobile?: string;
      }
    | string;
  taskId?:
    | {
        _id: string;
        title: string;
        status: string;
      }
    | string;
  expenseNo: string;
  date: string;
  categoryId:
    | {
        _id: string;
        name: string;
      }
    | string;
  categoryName: string;
  amount: number;
  paymentMode: ExpensePaymentMode;
  paidFromAccount?: string;
  notes?: string;
  receiptFileUrl?: string;
  receiptFileName?: string;
  isBilled: boolean;
  invoiceId?:
    | {
        _id: string;
        invoiceNo: string;
        date: string;
        status: string;
      }
    | string;
  createdBy?: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseCategoryItem {
  _id: string;
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface GetExpensesParams {
  clientId?: string;
  isBilled?: boolean | string;
  categoryId?: string;
  paymentMode?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface GetExpensesResponse {
  expenses: ClientExpense[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
  summary: {
    totalAmount: number;
    billedAmount: number;
    unbilledAmount: number;
  };
}

export interface UnbilledExpenseItem {
  _id: string;
  expenseNo: string;
  date: string;
  categoryId: any;
  categoryName: string;
  amount: number;
  paymentMode: string;
  notes?: string;
  particulars: string;
  referenceType: "Expense";
  referenceId: string;
  receiptFileUrl?: string;
}

export interface UnbilledExpensesResponse {
  unbilledExpenses: UnbilledExpenseItem[];
  totalUnbilledExpensesAmount: number;
  count: number;
}

export interface ExpenseAnalyticsOverview {
  totalExpenseAmount: number;
  billedExpenseAmount: number;
  unbilledExpenseAmount: number;
  recoveryRatePercentage: number;
  count: number;
}

export interface ExpenseAnalyticsCategoryBreakdown {
  _id: string;
  totalAmount: number;
  billedAmount: number;
  unbilledAmount: number;
  count: number;
}

export interface ExpenseAnalyticsMonthlyTrend {
  _id: string;
  totalAmount: number;
  billedAmount: number;
  unbilledAmount: number;
  count: number;
}

export interface ExpenseAnalyticsResponse {
  overview: ExpenseAnalyticsOverview;
  byCategory: ExpenseAnalyticsCategoryBreakdown[];
  monthlyTrends: ExpenseAnalyticsMonthlyTrend[];
}
