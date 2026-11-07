export type PhysicalDocCategory = "Received" | "Given";

export type PhysicalDocType =
  | "Passbook"
  | "Cheque Book"
  | "Original Deeds"
  | "PAN Card"
  | "Registration Certificate"
  | "Company Seal"
  | "Other";

export type PhysicalDocStatus = "In Custody" | "Returned" | "Overdue";

export interface PhysicalDocClient {
  _id: string;
  name: string;
  email?: string;
  mobile?: string;
  entityType?: string;
  clientNumber?: string;
  fileNo?: string;
}

export interface PhysicalDocMovement {
  _id?: string;
  movementType: PhysicalDocCategory;
  date: string;
  location: string;
  custodianUserId?:
    | {
        _id: string;
        name: string;
        email?: string;
      }
    | string;
  receivedByPersonName?: string;
  receivedByPhone?: string;
  returnedToPersonName?: string;
  isReturnable: boolean;
  returnDate?: string;
  actualReturnedDate?: string;
  notes?: string;
  createdAt?: string;
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
  returnedToPersonName?: string;
  notes?: string;
  movements?: PhysicalDocMovement[];
  createdAt: string;
  updatedAt: string;
}

export interface CreatePhysicalDocPayload {
  documentId?: string;
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
  returnedToPersonName?: string;
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

export type StorageUnitType =
  | "Cabinet"
  | "Shelf"
  | "Safe Box"
  | "Locker"
  | "Drawer"
  | "Archive Room"
  | "Other";

export interface StorageLocationSummary {
  _id?: string;
  location: string;
  code?: string;
  unitType?: StorageUnitType;
  roomOrFloor?: string;
  description?: string;
  activeCount: number;
  returnedCount: number;
  overdueCount: number;
  totalCount?: number;
  isMaster?: boolean;
}

export interface CreateStorageLocationPayload {
  name: string;
  code?: string;
  unitType?: StorageUnitType;
  roomOrFloor?: string;
  description?: string;
}

export interface UpdateStorageLocationPayload {
  name?: string;
  code?: string;
  unitType?: StorageUnitType;
  roomOrFloor?: string;
  description?: string;
  updateReferencedDocs?: boolean;
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
