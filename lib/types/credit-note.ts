export type CreditNoteReason =
  | 'Overcharge Correction'
  | 'Service Cancellation'
  | 'Goodwill Discount'
  | 'Deficiency of Service'
  | 'Other';

export type CreditNoteStatus = 'Issued' | 'Applied' | 'Refunded' | 'Cancelled';

export interface CreditNoteItem {
  description: string;
  sacCode?: string;
  quantity: number;
  rate: number;
  amount: number;
  gstPercentage: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
}

export interface CreditNoteTotals {
  subtotal: number;
  taxTotal: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  roundOff: number;
  grandTotal: number;
}

export interface AllocatedInvoiceItem {
  invoiceId: {
    _id: string;
    invoiceNo: string;
    date: string;
    totals?: { grandTotal: number; amountDue: number };
  } | string;
  amountApplied: number;
  appliedAt: string;
}

export interface CreditNoteRefundRecord {
  refundMode: 'Cash' | 'Bank Transfer' | 'Cheque' | 'UPI' | 'Other';
  refundDate: string;
  referenceNo?: string;
  refundedAmount: number;
  processedBy?: string;
  notes?: string;
}

export interface CreditNoteClient {
  _id: string;
  name: string;
  email?: string;
  mobile?: string;
  pan?: string;
  gstin?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  entityType?: string;
}

export interface CreditNoteInvoice {
  _id: string;
  invoiceNo: string;
  date: string;
  dueDate?: string;
  totals?: {
    subtotal: number;
    grandTotal: number;
    amountPaid: number;
    amountDue: number;
  };
  status: string;
  items?: any[];
}

export interface CreditNote {
  _id: string;
  tenantId: string;
  clientId: CreditNoteClient | string;
  invoiceId: CreditNoteInvoice | string;
  creditNoteNo: string;
  date: string;
  reason: CreditNoteReason;
  items: CreditNoteItem[];
  totals: CreditNoteTotals;
  unallocatedCredit: number;
  status: CreditNoteStatus;
  allocatedInvoices?: AllocatedInvoiceItem[];
  refundRecord?: CreditNoteRefundRecord;
  notes?: string;
  createdBy?: {
    _id: string;
    name: string;
    username?: string;
    email?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateCreditNotePayload {
  clientId: string;
  invoiceId: string;
  date: string;
  reason?: CreditNoteReason;
  items: {
    description: string;
    sacCode?: string;
    quantity: number;
    rate: number;
    amount?: number;
    gstPercentage?: number;
    cgst?: number;
    sgst?: number;
    igst?: number;
    total?: number;
  }[];
  totals?: Partial<CreditNoteTotals>;
  notes?: string;
}

export interface ApplyCreditPayload {
  targetInvoiceId: string;
  amountToApply?: number;
}

export interface RefundCreditPayload {
  refundMode: 'Cash' | 'Bank Transfer' | 'Cheque' | 'UPI' | 'Other';
  refundDate?: string;
  referenceNo?: string;
  refundedAmount?: number;
  notes?: string;
}

export interface GetCreditNoteListParams {
  clientId?: string;
  invoiceId?: string;
  status?: string;
  search?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export interface GetCreditNoteListResponse {
  creditNotes: CreditNote[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
