export type AutomationRunType = "Cron" | "Manual";
export type AutomationDetailStatus = "Created" | "Skipped" | "Failed";

export interface IAutomationLogDetail {
  clientId: {
    _id: string;
    name: string;
    fileNo?: string;
  };
  serviceId: {
    _id: string;
    name: string;
  };
  period: string;
  status: AutomationDetailStatus;
  reason?: string;
}

export interface IAutomationLog {
  _id: string;
  tenantId: string;
  runType: AutomationRunType;
  triggeredBy?: {
    _id: string;
    name: string;
    username: string;
    email?: string;
  };
  startedAt: string;
  completedAt: string;
  tasksCreatedCount: number;
  tasksSkippedCount: number;
  errorCount: number;
  details: IAutomationLogDetail[];
  createdAt: string;
  updatedAt: string;
}

export interface AutomationLogsResponse {
  logs: IAutomationLog[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface TriggerAutomationPayload {
  clientId?: string;
  serviceId?: string;
}

export interface TriggerAutomationResult {
  scannedClients: number;
  tasksCreated: number;
  tasksSkipped: number;
  errors: number;
  details: IAutomationLogDetail[];
  logId?: string;
}

export interface QueueHealthMetrics {
  status: string;
  timestamp: string;
  uptime: {
    server: string;
    system: string;
  };
  database: {
    state: string;
    host: string;
    name: string;
  };
  memory: {
    rss: string;
    heapTotal: string;
    heapUsed: string;
    external: string;
    systemFree: string;
    systemTotal: string;
  };
}
