export type DocumentRequestStatus =
  | 'Pending'
  | 'Partially Uploaded'
  | 'Completed'
  | 'Expired'
  | 'Cancelled';

export type RequestedFileStatus = 'Pending' | 'Uploaded' | 'Rejected';

export interface RequestedFileItem {
  _id?: string;
  name: string;
  description?: string;
  isRequired: boolean;
  acceptedFormats?: string[];
  uploadedDocumentId?: string;
  uploadedAt?: string;
  status: RequestedFileStatus;
}

export interface DocumentRequestClient {
  _id: string;
  name: string;
  email?: string;
  mobile?: string;
  fileNo?: string;
}

export interface DocumentRequestTask {
  _id: string;
  description: string;
  status?: string;
  priority?: string;
}

export interface DocumentRequestProgress {
  totalFiles: number;
  uploadedFiles: number;
  progressPercentage: number;
}

export interface DocumentRequest {
  _id: string;
  tenantId: string;
  clientId: DocumentRequestClient | string;
  taskId?: DocumentRequestTask | string;
  requestNo: string;
  title: string;
  instructions?: string;
  token: string;
  uploadUrl?: string;
  items: RequestedFileItem[];
  expiresAt: string;
  status: DocumentRequestStatus;
  progress?: DocumentRequestProgress;
  createdBy?: {
    _id: string;
    name: string;
    email?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateDocumentRequestPayload {
  clientId: string;
  taskId?: string;
  title: string;
  instructions?: string;
  expiresInDays?: number;
  items: Array<{
    name: string;
    description?: string;
    isRequired?: boolean;
    acceptedFormats?: string[];
  }>;
}

export interface PublicDocumentRequest {
  requestNo: string;
  title: string;
  instructions?: string;
  status: DocumentRequestStatus;
  expiresAt: string;
  items: RequestedFileItem[];
  client: {
    name: string;
  };
  firm: {
    name: string;
    address?: string;
  };
}

export interface DocumentRequestSummary {
  pending: number;
  partiallyUploaded: number;
  completed: number;
  expired: number;
  totalRequests: number;
}

export interface GetDocumentRequestListParams {
  clientId?: string;
  taskId?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface GetDocumentRequestListResponse {
  requests: DocumentRequest[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  summary: DocumentRequestSummary;
}

export interface UploadPublicFileResponse {
  success: boolean;
  requestNo: string;
  status: DocumentRequestStatus;
  item: {
    _id: string;
    name: string;
    status: RequestedFileStatus;
    uploadedAt: string;
    documentId: string;
  };
  progress: {
    uploaded: number;
    total: number;
    isFullyCompleted: boolean;
  };
}
