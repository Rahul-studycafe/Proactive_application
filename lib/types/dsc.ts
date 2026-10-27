export type DSCStatus = 'In Office' | 'With Client' | 'Expired' | 'Renewed';
export type DSCClass = 'Class 2' | 'Class 3';
export type DSCTokenType = 'ePass2003' | 'ProxKey' | 'mToken' | 'Watchdata' | 'Other';
export type DSCIssuingAuthority = 'eMudhra' | 'Capricorn' | 'Vsign' | 'Sify' | 'IDSign' | 'Other';

export interface DSCClient {
  _id: string;
  name: string;
  email?: string;
  mobile?: string;
  entityType?: string;
}

export interface DSCItem {
  _id: string;
  tenantId: string;
  clientId: DSCClient | string;
  certificateName: string;
  certificateClass: DSCClass;
  tokenType: DSCTokenType;
  tokenSerialNumber?: string;
  issuingAuthority: DSCIssuingAuthority;
  issueDate: string;
  expiryDate: string;
  physicalLocation: string;
  status: DSCStatus;
  currentHolderName?: string;
  alertMilestonesSent?: ('30_day' | '15_day' | '7_day')[];
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

export interface CreateDscPayload {
  clientId: string;
  certificateName: string;
  certificateClass?: DSCClass;
  tokenType?: DSCTokenType;
  tokenSerialNumber?: string;
  issuingAuthority?: DSCIssuingAuthority;
  issueDate: string;
  expiryDate: string;
  physicalLocation: string;
  status?: DSCStatus;
  currentHolderName?: string;
  notes?: string;
}

export interface UpdateDscPayload {
  certificateName?: string;
  certificateClass?: DSCClass;
  tokenType?: DSCTokenType;
  tokenSerialNumber?: string;
  issuingAuthority?: DSCIssuingAuthority;
  issueDate?: string;
  expiryDate?: string;
  physicalLocation?: string;
  status?: DSCStatus;
  currentHolderName?: string;
  notes?: string;
}

export interface DscHandoverPayload {
  action: 'Handed to Client' | 'Received from Client' | 'Internal Transfer';
  transferredToName: string;
  transferredToPhone?: string;
  reason: string;
  expectedReturnDate?: string;
  receivedBackDate?: string;
  notes?: string;
}

export interface DscHandoverLogItem {
  _id: string;
  tenantId: string;
  dscId: string;
  action: 'Handed to Client' | 'Received from Client' | 'Internal Transfer';
  transferredToName: string;
  transferredToPhone?: string;
  reason: string;
  expectedReturnDate?: string;
  receivedBackDate?: string;
  handledByUserId?: {
    _id: string;
    name: string;
    email?: string;
  };
  notes?: string;
  createdAt: string;
}

export interface DscScanSummary {
  scannedCount: number;
  expiredCount: number;
  milestonesTriggered: {
    thirtyDays: number;
    fifteenDays: number;
    sevenDays: number;
  };
  tasksCreated: number;
  emailsDispatched: number;
  processedDscIds: string[];
}

export interface DSCKpiSummary {
  total: number;
  inOffice: number;
  withClient: number;
  expired: number;
  expiringIn30Days: number;
}

export interface GetDscListParams {
  clientId?: string;
  status?: string;
  search?: string;
  expiringWithinDays?: number;
  page?: number;
  limit?: number;
}

export interface GetDscListResponse {
  dscs: DSCItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
