export type QuotationStatus =
  | "Draft"
  | "Sent"
  | "Accepted"
  | "Declined"
  | "Converted";

export interface QuotationItem {
  serviceId?: string | { _id: string; name: string };
  description: string;
  sacCode?: string;
  rate: number;
  quantity: number;
  amount: number;
  discount: number;
  taxableAmount: number;
  gstPercentage: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
}

export interface QuotationTotals {
  subtotal: number;
  discountTotal: number;
  taxableTotal: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  taxTotal: number;
  roundOff: number;
  grandTotal: number;
}

export interface QuotationClient {
  _id: string;
  name: string;
  fileNo?: string;
  pan?: string;
  email?: string;
  mobile?: string;
  state?: string;
  gstin?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
}

export interface QuotationBillingEntity {
  _id: string;
  name: string;
  legalName?: string;
  gstin?: string;
  pan?: string;
  email?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  bankDetails?: {
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
    branchName?: string;
    upiId?: string;
  };
}

export interface Quotation {
  _id: string;
  tenantId: string;
  clientId: string | QuotationClient;
  billingEntityId?: string | QuotationBillingEntity;
  quotationNo: string;
  date: string;
  validUntil: string;
  items: QuotationItem[];
  totals: QuotationTotals;
  termsAndConditions?: string;
  notes?: string;
  status: QuotationStatus;
  sentAt?: string;
  convertedInvoiceId?:
    | string
    | {
        _id: string;
        invoiceNo: string;
        date: string;
        status: string;
        totals: { grandTotal: number };
      };
  convertedAt?: string;
  createdBy: string | { _id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

export interface QuotationSummary {
  totalCount: number;
  totalValue: number;
  draftValue: number;
  sentValue: number;
  acceptedValue: number;
  convertedValue: number;
  declinedValue: number;
}

export interface GetQuotationsParams {
  clientId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface GetQuotationsResponse {
  quotations: Quotation[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  summary: QuotationSummary;
}

export interface CreateQuotationItemInput {
  serviceId?: string;
  description: string;
  sacCode?: string;
  rate: number;
  quantity: number;
  discount?: number;
  gstPercentage?: number;
}

export interface CreateQuotationPayload {
  clientId: string;
  billingEntityId?: string;
  date?: string;
  validUntil?: string;
  isInterState?: boolean;
  items: CreateQuotationItemInput[];
  termsAndConditions?: string;
  notes?: string;
}

export interface UpdateQuotationPayload {
  billingEntityId?: string | null;
  date?: string;
  validUntil?: string;
  isInterState?: boolean;
  items?: CreateQuotationItemInput[];
  termsAndConditions?: string;
  notes?: string;
}

export interface ConvertQuotationResponse {
  quotation: Quotation;
  invoice: any;
}

export interface QuotationPrintLayout {
  quotation: Quotation;
  firm: {
    name: string;
    legalName?: string;
    gstin?: string;
    pan?: string;
    email?: string;
    phone?: string;
    address?: any;
    bankDetails?: {
      bankName?: string;
      accountNumber?: string;
      ifscCode?: string;
      branchName?: string;
      upiId?: string;
    };
  };
  amountInWords: string;
}

export interface QuotationPipelineAnalytics {
  overview: {
    totalQuotations: number;
    totalPipelineValue: number;
    convertedCount: number;
    convertedValue: number;
    acceptedCount: number;
    acceptedValue: number;
    sentCount: number;
    sentValue: number;
    declinedCount: number;
    declinedValue: number;
    winRatePercentage: number;
  };
  statusBreakdown: {
    status: QuotationStatus;
    count: number;
    totalValue: number;
  }[];
  monthlyTrends: {
    month: string;
    totalQuotations: number;
    totalValue: number;
    convertedCount: number;
    convertedValue: number;
  }[];
}
