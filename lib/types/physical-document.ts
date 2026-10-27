export type PhysicalDocCategory = 'Received' | 'Given';

export type PhysicalDocType =
  | 'Passbook'
  | 'Cheque Book'
  | 'Original Deeds'
  | 'PAN Card'
  | 'Registration Certificate'
  | 'Company Seal'
  | 'Other';

export type PhysicalDocStatus = 'In Custody' | 'Returned' | 'Overdue';

export interface PhysicalDocClient {
  _id: string;
  name: string;
  email?: string;
  mobile?: string;
  entityType?: string;
  fileNo?: string;
}

export interface PhysicalDocument {
  _id: string;
  tenantId: string;
  clientId: PhysicalDocClient | string;
  date: string;
  category: PhysicalDocCategory;
  documentType: PhysicalDocType;
  documentName: string;
  isReturnable: boolean;
  returnDate?: string;
  actualReturnedDate?: string;
  status: PhysicalDocStatus;
  location: string;
  custodianUserId?: {
    _id: string;
    name: string;
    email?: string;
  };
  receivedByPersonName?: string;
  receivedByPhone?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePhysicalDocPayload {
  clientId: string;
  date?: string;
  category: PhysicalDocCategory;
  documentType: PhysicalDocType;
  documentName: string;
  isReturnable?: boolean;
  returnDate?: string | null;
  location: string;
  custodianUserId?: string;
  receivedByPersonName?: string;
  receivedByPhone?: string;
  notes?: string;
}

export interface UpdatePhysicalDocPayload {
  clientId?: string;
  date?: string;
  category?: PhysicalDocCategory;
  documentType?: PhysicalDocType;
  documentName?: string;
  isReturnable?: boolean;
  returnDate?: string | null;
  location?: string;
  custodianUserId?: string;
  receivedByPersonName?: string;
  receivedByPhone?: string;
  notes?: string;
}

export interface ReturnPhysicalDocPayload {
  actualReturnedDate?: string;
  returnedToPersonName?: string;
  returnedNotes?: string;
}

export interface StorageLocationSummary {
  location: string;
  activeCount: number;
  returnedCount: number;
  overdueCount: number;
}

export interface OverdueScanSummary {
  scannedCount: number;
  overdueMarkedCount: number;
  overdueDocIds: string[];
}

export interface GetPhysicalDocListParams {
  clientId?: string;
  category?: string;
  status?: string;
  documentType?: string;
  isReturnable?: boolean;
  location?: string;
  search?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export interface GetPhysicalDocListResponse {
  documents: PhysicalDocument[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  overdueCount: number;
}
