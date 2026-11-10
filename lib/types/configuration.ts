export interface ConfigurationCategory {
  key: string;
  name: string;
  title: string;
  description: string;
  icon?: string;
  placeholder?: string;
  supportsColor?: boolean;
  supportsMetadata?: boolean;
  activeCount: number;
  totalCount: number;
}

export interface ConfigurationOption {
  _id: string;
  tenantId: string;
  categoryKey: string;
  value: string;
  label: string;
  description?: string;
  color?: string | null;
  metadata?: Record<string, any>;
  sortOrder: number;
  isActive: boolean;
  isSystemDefault: boolean;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateConfigurationOptionPayload {
  categoryKey: string;
  label: string;
  value?: string;
  color?: string | null;
  description?: string;
  metadata?: Record<string, any>;
}

export interface UpdateConfigurationOptionPayload {
  label?: string;
  description?: string;
  color?: string | null;
  metadata?: Record<string, any>;
  sortOrder?: number;
  isActive?: boolean;
}

export interface ReorderConfigurationOptionsPayload {
  categoryKey: string;
  orderedIds: string[];
}

export interface DeleteConfigurationOptionResult {
  message: string;
  softDeactivated: boolean;
  referencesFound?: number;
}

