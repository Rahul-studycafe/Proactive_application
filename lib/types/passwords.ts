export interface PortalMaster {
  _id: string;
  name: string;
  category: string;
  portalUrl?: string;
  defaultUsernameFormat?: string;
  iconName?: string;
  isActive: boolean;
  isSystemDefault?: boolean;
}

export interface ClientPassword {
  _id: string;
  clientId: string | { _id: string; name: string; fileNo?: string };
  portalId?: string;
  portalName: string;
  portalUrl?: string;
  username: string;
  notes?: string;
  lastVerifiedDate?: string;
  createdAt: string;
  updatedAt: string;
  isConfigured?: boolean;
  maskedPassword?: string;
}

export interface CreatePasswordPayload {
  clientId: string;
  portalId?: string;
  portalName: string;
  portalUrl?: string;
  username: string;
  password: string;
  notes?: string;
  lastVerifiedDate?: string;
}

export interface UpdatePasswordPayload {
  portalId?: string;
  portalName?: string;
  portalUrl?: string;
  username?: string;
  password?: string;
  notes?: string;
  lastVerifiedDate?: string;
}

export interface GetPasswordsParams {
  clientId?: string;
  portalName?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface GetPasswordsResponse {
  passwords: ClientPassword[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface RevealPasswordPayload {
  id: string;
  purpose?: string;
}

export interface RevealPasswordResponse {
  password: string;
  portalName: string;
  username: string;
  portalUrl?: string;
}

export interface PasswordAuditLog {
  _id: string;
  tenantId?: string;
  passwordId: string;
  clientId?: { _id: string; name: string; fileNo?: string };
  portalName: string;
  username: string;
  accessedByUserId?: {
    _id: string;
    name: string;
    email: string;
    role?: string;
  };
  accessedAt: string;
  ipAddress?: string;
  userAgent?: string;
  purpose?: string;
}

export interface GetPasswordAuditLogsParams {
  clientId?: string;
  passwordId?: string;
  userId?: string;
  page?: number;
  limit?: number;
}

export interface GetPasswordAuditLogsResponse {
  logs: PasswordAuditLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface BulkImportPasswordsResponse {
  totalRows: number;
  importedCount: number;
  updatedCount: number;
  skippedErrors: string[];
}
