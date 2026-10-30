import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import { Mutex } from "async-mutex";

const mutex = new Mutex();

const baseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1",
  credentials: "include", // Send HttpOnly cookies globally (like refreshToken)
  prepareHeaders: (headers) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("accessToken");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
    }
    return headers;
  },
});

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  // wait until the mutex is available without locking it
  await mutex.waitForUnlock();
  let result = await baseQuery(args, api, extraOptions);

  const url = typeof args === "string" ? args : args.url;
  const isAuthEndpoint =
    url?.includes("/auth/login") || url?.includes("/auth/refresh");

  if (result.error && result.error.status === 401 && !isAuthEndpoint) {
    // checking whether the mutex is locked
    if (!mutex.isLocked()) {
      const release = await mutex.acquire();
      try {
        const storedRefreshToken =
          typeof window !== "undefined"
            ? localStorage.getItem("refreshToken")
            : null;

        if (!storedRefreshToken) {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          if (typeof window !== "undefined") {
            window.location.href = "/login";
          }
          return result;
        }

        // Send refreshToken in request body to POST /auth/refresh
        const refreshResult: any = await baseQuery(
          {
            url: "/auth/refresh",
            method: "POST",
            body: { refreshToken: storedRefreshToken },
          },
          api,
          extraOptions,
        );

        const resData = refreshResult.data?.data || refreshResult.data;
        if (resData?.accessToken) {
          const newToken = resData.accessToken;
          localStorage.setItem("accessToken", newToken);
          if (resData.refreshToken) {
            localStorage.setItem("refreshToken", resData.refreshToken);
          }
          // retry the initial query with the fresh access token
          result = await baseQuery(args, api, extraOptions);
        } else {
          // refresh failed (token revoked or expired) - log out
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          if (typeof window !== "undefined") {
            window.location.href = "/login";
          }
        }
      } finally {
        // release must be called once the mutex should be released again.
        release();
      }
    } else {
      // wait until the mutex is available without locking it
      await mutex.waitForUnlock();
      result = await baseQuery(args, api, extraOptions);
    }
  }

  // Normalize backend error structure so error.data.message is always populated
  if (result.error && result.error.data && typeof result.error.data === "object") {
    const errData = result.error.data as any;
    if (errData.error?.message && !errData.message) {
      errData.message = errData.error.message;
    }
  }

  return result;
};

import type {
  IAttendance,
  DailyRosterResult,
  CheckInPayload,
  CheckOutPayload,
  MarkAttendancePayload,
  BulkMarkAttendancePayload,
  MonthlyMatrixResult,
  StaffAttendanceSummary,
  OfficePerimeterConfig,
  WorkingDaysConfig,
} from "@/lib/types/attendance";
import type {
  AutomationLogsResponse,
  TriggerAutomationPayload,
  TriggerAutomationResult,
  QueueHealthMetrics,
} from "@/lib/types/automation";
import type {
  ClientEntityDistributionItem,
  StaffPerformanceItem,
  AttendanceKPIOverview,
  DashboardOverviewData,
} from "@/lib/types/analytics";
import type {
  DSCItem,
  DSCKpiSummary,
  GetDscListParams,
  GetDscListResponse,
  CreateDscPayload,
  UpdateDscPayload,
  DscHandoverPayload,
  DscHandoverLogItem,
  DscScanSummary,
} from "@/lib/types/dsc";
import type {
  CreditNote,
  CreateCreditNotePayload,
  ApplyCreditPayload,
  RefundCreditPayload,
  GetCreditNoteListParams,
  GetCreditNoteListResponse,
} from "@/lib/types/credit-note";
import type {
  PhysicalDocument,
  CreatePhysicalDocPayload,
  UpdatePhysicalDocPayload,
  ReturnPhysicalDocPayload,
  StorageLocationSummary,
  OverdueScanSummary,
  GetPhysicalDocListParams,
  GetPhysicalDocListResponse,
} from "@/lib/types/physical-document";
import type {
  DocumentRequest,
  CreateDocumentRequestPayload,
  PublicDocumentRequest,
  GetDocumentRequestListParams,
  GetDocumentRequestListResponse,
  UploadPublicFileResponse,
} from "@/lib/types/document-request";
import type {
  PortalMaster,
  ClientPassword,
  CreatePasswordPayload,
  UpdatePasswordPayload,
  GetPasswordsParams,
  GetPasswordsResponse,
  RevealPasswordResponse,
  GetPasswordAuditLogsParams,
  GetPasswordAuditLogsResponse,
  BulkImportPasswordsResponse,
} from "@/lib/types/passwords";
import type {
  ClientExpense,
  ExpenseCategoryItem,
  GetExpensesParams,
  GetExpensesResponse,
  UnbilledExpensesResponse,
  ExpenseAnalyticsResponse,
} from "@/lib/types/expenses";
import type {
  Quotation,
  GetQuotationsParams,
  GetQuotationsResponse,
  CreateQuotationPayload,
  UpdateQuotationPayload,
  ConvertQuotationResponse,
  QuotationPrintLayout,
  QuotationPipelineAnalytics,
} from "@/lib/types/quotation";
import type {
  TaskReportResponse,
  TaskReportQuery,
  ServiceReportResponse,
  DscReportResponse,
  DscReportQuery,
  InvoiceReportResponse,
  InvoiceReportQuery,
  DebtorsAgingReportResponse,
  DebtorsAgingQuery,
} from "@/lib/types/report";

export const applicationApi = createApi({
  reducerPath: "applicationApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    "Task",
    "Client",
    "Tag",
    "Service",
    "User",
    "Package",
    "Invoice",
    "Receipt",
    "Ledger",
    "Dashboard",
    "Holiday",
    "WorkingDays",
    "Attendance",
    "Automation",
    "DSC",
    "CreditNote",
    "DocsInOut",
    "DocumentRequest",
    "PasswordVault",
    "PasswordAudit",
    "Expense",
    "Quotation",
    "Report",
    "ClientPortalUser",
    "PortalProfile",
    "WebsiteSettings",
    "PortalCompliance",
    "PortalDocuments",
    "PortalInvoices",
    "PortalReceipts",
    "PortalLedger",
    "PortalDocRequests",
    "PortalQueries",
    "GatewayConfig",
    "PaymentTransaction",
    "BillingEntity",
    "TenantSubscription",
    "TenantUsage",
  ],
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
      }),
      transformResponse: (response: { data: any }) => response.data,
    }),
    forgotPassword: builder.mutation({
      query: (payload: { email: string }) => ({
        url: "/auth/forgot-password",
        method: "POST",
        body: payload,
      }),
      transformResponse: (response: { data: any }) => response.data,
    }),
    resetPassword: builder.mutation({
      query: (payload: { token: string; newPassword: string }) => ({
        url: "/auth/reset-password",
        method: "POST",
        body: payload,
      }),
      transformResponse: (response: { data: any }) => response.data,
    }),
    getMe: builder.query({
      query: () => "/auth/me",
      providesTags: ["User"],
      transformResponse: (response: { data: any }) => response.data,
    }),
    uploadAvatar: builder.mutation({
      query: (formData: FormData) => ({
        url: "/auth/me/avatar",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["User"],
      transformResponse: (response: { data: any }) => response.data,
    }),

    // Tasks
    getTasks: builder.query({
      query: (params) => ({ url: "/tasks", params }),
      providesTags: ["Task"],
      transformResponse: (response: { data: any }) => response.data,
    }),
    getTaskById: builder.query({
      query: (id) => `/tasks/${id}`,
      providesTags: (result, error, id) => [{ type: "Task", id }],
      transformResponse: (response: { data: any }) => response.data,
    }),

    getTags: builder.query({
      query: () => "/tasks/tags/all",
      providesTags: ["Task"],
      transformResponse: (response: { data: string[] }) => response.data,
    }),

    createTask: builder.mutation({
      query: (taskData) => ({
        url: "/tasks",
        method: "POST",
        body: taskData,
      }),
      invalidatesTags: ["Task", "DocumentRequest", "Client"],
      transformResponse: (response: { data: any }) => response.data,
    }),
    updateTask: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `/tasks/${id}`,
        method: "PUT",
        body: patch,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Task", id },
        "Task",
      ],
      transformResponse: (response: { data: any }) => response.data,
    }),
    updateTaskStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/tasks/${id}/status`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: ["Task"],
      transformResponse: (response: { data: any }) => response.data,
    }),
    toggleTaskChecklistStep: builder.mutation({
      query: ({ taskId, stepIndex, isCompleted }) => ({
        url: `/tasks/${taskId}/checklist/${stepIndex}`,
        method: "PATCH",
        body: { isCompleted },
      }),
      invalidatesTags: (result, error, { taskId }) => [
        { type: "Task", id: taskId },
      ],
    }),
    addTaskChecklistStep: builder.mutation({
      query: ({ taskId, stepName }) => ({
        url: `/tasks/${taskId}/checklist`,
        method: "POST",
        body: { stepName },
      }),
      invalidatesTags: (result, error, { taskId }) => [
        { type: "Task", id: taskId },
      ],
    }),
    deleteTaskChecklistStep: builder.mutation({
      query: ({ taskId, stepIndex }) => ({
        url: `/tasks/${taskId}/checklist/${stepIndex}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { taskId }) => [
        { type: "Task", id: taskId },
      ],
    }),
    addSubtask: builder.mutation({
      query: ({ taskId, ...subtask }) => ({
        url: `/tasks/${taskId}/subtasks`,
        method: "POST",
        body: subtask,
      }),
      invalidatesTags: (result, error, { taskId }) => [
        { type: "Task", id: taskId },
      ],
    }),
    updateSubtask: builder.mutation({
      query: ({ taskId, subtaskId, ...patch }) => ({
        url: `/tasks/${taskId}/subtasks/${subtaskId}`,
        method: "PUT",
        body: patch,
      }),
      invalidatesTags: (result, error, { taskId }) => [
        { type: "Task", id: taskId },
      ],
    }),
    deleteSubtask: builder.mutation({
      query: ({ taskId, subtaskId }) => ({
        url: `/tasks/${taskId}/subtasks/${subtaskId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { taskId }) => [
        { type: "Task", id: taskId },
      ],
    }),
    getTaskHistory: builder.query({
      query: (taskId) => `/tasks/${taskId}/history`,
      providesTags: (result, error, taskId) => [
        { type: "Task", id: `${taskId}-history` },
      ],
      transformResponse: (response: { data: any }) => response.data,
    }),
    addTaskHistoryNote: builder.mutation({
      query: ({ taskId, content }) => ({
        url: `/tasks/${taskId}/notes`,
        method: "POST",
        body: { content },
      }),
      invalidatesTags: (result, error, { taskId }) => [
        { type: "Task", id: `${taskId}-history` },
      ],
      transformResponse: (response: { data: any }) => response.data,
    }),
    getTaskDocuments: builder.query({
      query: ({ taskId, category }) => ({
        url: `/documents/task/${taskId}`,
        params: { category },
      }),
      providesTags: (result, error, { taskId }) => [
        { type: "Task", id: `${taskId}-documents` },
      ],
      transformResponse: (response: { data: any }) => response.data,
    }),
    uploadTaskDocument: builder.mutation({
      query: ({ taskId, data }) => ({
        url: `/documents/task/${taskId}`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (result, error, { taskId }) => [
        { type: "Task", id: `${taskId}-documents` },
      ],
      transformResponse: (response: { data: any }) => response.data,
    }),
    deleteTaskDocument: builder.mutation({
      query: ({ id, taskId }) => ({
        url: `/documents/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { taskId }) => [
        { type: "Task", id: `${taskId}-documents` },
      ],
    }),

    getClientDocuments: builder.query({
      query: ({ clientId, category }) => ({
        url: `/documents/client/${clientId}`,
        params: category ? { category } : undefined,
      }),
      providesTags: (result, error, { clientId }) => [
        { type: "Client", id: `${clientId}-documents` },
      ],
      transformResponse: (response: { data: any }) => response.data,
    }),
    uploadClientDocument: builder.mutation({
      query: ({ clientId, data }) => ({
        url: `/documents/client/${clientId}`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (result, error, { clientId }) => [
        { type: "Client", id: `${clientId}-documents` },
      ],
      transformResponse: (response: { data: any }) => response.data,
    }),
    deleteClientDocument: builder.mutation({
      query: ({ id, clientId }) => ({
        url: `/documents/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { clientId }) => [
        { type: "Client", id: `${clientId}-documents` },
      ],
    }),

    // Clients
    getClients: builder.query({
      query: (params) => ({ url: "/clients", params }),
      providesTags: ["Client"],
      transformResponse: (response: { data: any }) => response.data,
    }),
    getClientById: builder.query({
      query: (id) => `/clients/${id}`,
      providesTags: (result, error, id) => [{ type: "Client", id }],
      transformResponse: (response: { data: any }) => response.data,
    }),
    createClient: builder.mutation({
      query: (clientData) => ({
        url: "/clients",
        method: "POST",
        body: clientData,
      }),
      invalidatesTags: ["Client"],
      transformResponse: (response: { data: any }) => response.data,
    }),
    updateClient: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `/clients/${id}`,
        method: "PUT",
        body: patch,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Client", id },
        "Client",
      ],
      transformResponse: (response: { data: any }) => response.data,
    }),
    uploadClientPhoto: builder.mutation({
      query: (formData) => ({
        url: "/clients/upload-photo",
        method: "POST",
        body: formData,
      }),
      transformResponse: (response: { data: { photoUrl: string } }) =>
        response.data,
    }),

    // Services
    getServices: builder.query({
      query: (params) => ({ url: "/services", params }),
      providesTags: ["Service"],
      transformResponse: (response: { data: any }) => response.data,
    }),
    getServiceById: builder.query({
      query: (id: string) => `/services/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Service", id }],
      transformResponse: (response: { data: any }) => response.data,
    }),
    createService: builder.mutation({
      query: (body) => ({
        url: "/services",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Service"],
    }),
    updateService: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/services/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Service"],
    }),
    deleteService: builder.mutation({
      query: (id) => ({
        url: `/services/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Service"],
    }),

    // Packages
    getPackages: builder.query({
      query: (params) => ({ url: "/packages", params }),
      providesTags: ["Package"],
      transformResponse: (response: { data: any }) => response.data,
    }),
    getPackageById: builder.query({
      query: (id) => `/packages/${id}`,
      providesTags: (result, error, id) => [{ type: "Package", id }],
      transformResponse: (response: { data: any }) => response.data,
    }),
    createPackage: builder.mutation({
      query: (body) => ({
        url: "/packages",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Package"],
    }),
    updatePackage: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/packages/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Package", id },
        "Package",
      ],
    }),
    deletePackage: builder.mutation({
      query: (id) => ({
        url: `/packages/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Package"],
    }),
    subscribeClientToPackage: builder.mutation({
      query: ({ clientId, packageId, customPrice }) => ({
        url: `/clients/${clientId}/packages`,
        method: "POST",
        body: { packageId, customPrice },
      }),
      invalidatesTags: (result, error, { clientId }) => [
        { type: "Client", id: clientId },
        "Client",
        "DocumentRequest",
      ],
    }),
    subscribeClientToService: builder.mutation({
      query: ({ clientId, serviceId, customPrice }) => ({
        url: `/clients/${clientId}/services`,
        method: "POST",
        body: { serviceId, customPrice },
      }),
      invalidatesTags: (result, error, { clientId }) => [
        { type: "Client", id: clientId },
        "Client",
        "DocumentRequest",
      ],
    }),
    unsubscribeClientFromPackage: builder.mutation({
      query: ({ clientId, packageId }) => ({
        url: `/clients/${clientId}/packages/${packageId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { clientId }) => [
        { type: "Client", id: clientId },
        "Client",
      ],
    }),
    unsubscribeClientFromService: builder.mutation({
      query: ({ clientId, serviceId }) => ({
        url: `/clients/${clientId}/services/${serviceId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { clientId }) => [
        { type: "Client", id: clientId },
        "Client",
      ],
    }),

    // Invoices
    getInvoices: builder.query({
      query: (params) => ({ url: "/invoices", params }),
      providesTags: ["Invoice"],
      transformResponse: (response: { data: any }) => response.data,
    }),
    getInvoiceById: builder.query({
      query: (id: string) => `/invoices/${id}`,
      providesTags: (_result: any, _error: any, id: string) => [
        { type: "Invoice" as const, id },
      ],
      transformResponse: (response: { data: any }) => response.data,
    }),
    getUnbilledTasks: builder.query({
      query: (clientId: string) => `/invoices/unbilled/${clientId}`,
      providesTags: (_result: any, _error: any, clientId: string) => [
        { type: "Invoice" as const, id: `unbilled-${clientId}` },
      ],
      transformResponse: (response: { data: any }) => response.data,
    }),
    createInvoice: builder.mutation({
      query: (body) => ({
        url: "/invoices",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Invoice", "Task"],
      transformResponse: (response: { data: any }) => response.data,
    }),
    updateInvoice: builder.mutation({
      query: ({ id, ...body }: { id: string;[key: string]: any }) => ({
        url: `/invoices/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_result: any, _error: any, { id }: { id: string }) => [
        { type: "Invoice" as const, id },
        "Invoice",
        "Task",
      ],
      transformResponse: (response: { data: any }) => response.data,
    }),
    cancelInvoice: builder.mutation({
      query: (id: string) => ({
        url: `/invoices/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Invoice", "Task"],
      transformResponse: (response: { data: any }) => response.data,
    }),

    // Receipts
    getReceipts: builder.query({
      query: (params) => ({ url: "/receipts", params }),
      providesTags: ["Receipt"],
      transformResponse: (response: { data: any }) => response.data,
    }),
    getReceiptById: builder.query({
      query: (id: string) => ({ url: `/receipts/${id}` }),
      providesTags: (_result, _error, id) => [{ type: "Receipt" as const, id }],
      transformResponse: (response: { data: any }) => response.data,
    }),
    getUnpaidInvoices: builder.query({
      query: (clientId: string) => ({
        url: "/receipts/unpaid-invoices",
        params: { clientId },
      }),
      providesTags: ["Invoice"],
      transformResponse: (response: { data: any }) => response.data,
    }),
    autoSettlePreview: builder.mutation({
      query: (body: {
        clientId: string;
        totalAmount: number;
        tdsAmount?: number;
        discountAmount?: number;
      }) => ({
        url: "/receipts/auto-settle-preview",
        method: "POST",
        body,
      }),
      transformResponse: (response: { data: any }) => response.data,
    }),
    createReceipt: builder.mutation({
      query: (body: {
        clientId: string;
        date: string;
        paymentMode: string;
        referenceNumber?: string;
        totalAmount: number;
        tdsAmount?: number;
        discountAmount?: number;
        notes?: string;
        settlements?: Array<{
          invoiceId: string;
          settledAmount: number;
          tdsDeducted?: number;
        }>;
        autoSettle?: boolean;
      }) => ({
        url: "/receipts",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Receipt", "Invoice", "Client", "Ledger", "Dashboard"],
      transformResponse: (response: { data: any }) => response.data,
    }),

    // Ledger
    getLedger: builder.query({
      query: ({
        clientId,
        from,
        to,
      }: {
        clientId: string;
        from?: string;
        to?: string;
      }) => ({
        url: `/ledger/${clientId}`,
        params: { from, to },
      }),
      providesTags: ["Ledger", "Receipt", "Invoice"],
      transformResponse: (response: { data: any }) => response.data,
    }),

    // Dashboard
    getDashboardOverview: builder.query<DashboardOverviewData, void>({
      query: () => ({ url: "/dashboard/overview" }),
      providesTags: ["Dashboard", "Task", "Client", "Invoice", "Receipt", "Attendance"],
      transformResponse: (response: { data: DashboardOverviewData }) => response.data,
    }),
    getClientSummary: builder.query({
      query: (clientId: string) => ({
        url: `/dashboard/clients/${clientId}/summary`,
      }),
      providesTags: ["Dashboard", "Client", "Task", "Invoice", "Receipt"],
      transformResponse: (response: { data: any }) => response.data,
    }),

    // Users
    getUsers: builder.query({
      query: (params) => ({ url: "/users", params }),
      providesTags: ["User"],
      transformResponse: (response: { data: any }) => response.data,
    }),

    // Part 10: Holidays
    getHolidays: builder.query({
      query: (params?: { year?: string | number }) => ({
        url: "/holidays",
        params: params?.year ? { year: String(params.year) } : undefined,
      }),
      providesTags: ["Holiday"],
      transformResponse: (response: { data: any }) => response.data,
    }),

    createHoliday: builder.mutation({
      query: (body: { name: string; date: string; type: string; description?: string }) => ({
        url: "/holidays",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Holiday"],
      transformResponse: (response: { data: any }) => response.data,
    }),

    updateHoliday: builder.mutation({
      query: ({ id, ...body }: { id: string; name?: string; date?: string; type?: string; description?: string }) => ({
        url: `/holidays/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Holiday"],
      transformResponse: (response: { data: any }) => response.data,
    }),

    deleteHoliday: builder.mutation({
      query: (id: string) => ({
        url: `/holidays/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Holiday"],
      transformResponse: (response: { data: any }) => response.data,
    }),

    seedDefaultHolidays: builder.mutation({
      query: (params?: { year?: string | number; region?: string }) => ({
        url: "/holidays/seed-default",
        method: "POST",
        params: {
          year: params?.year ? String(params.year) : "2026",
          region: params?.region || "national",
        },
      }),
      invalidatesTags: ["Holiday"],
      transformResponse: (response: { data: any }) => response.data,
    }),

    // Part 10: Working Days & Weekends
    getWorkingDays: builder.query<WorkingDaysConfig, void>({
      query: () => "/tenant-settings/work-days",
      providesTags: ["WorkingDays"],
      transformResponse: (response: { data: WorkingDaysConfig }) => response.data,
    }),

    updateWorkingDays: builder.mutation<
      WorkingDaysConfig,
      {
        weekends?: string[];
        standardWorkHoursPerDay?: number;
        alternateWeekendRules?: { day: string; weeks: number[] };
        officePerimeter?: Partial<OfficePerimeterConfig>;
      }
    >({
      query: (body) => ({
        url: "/tenant-settings/work-days",
        method: "PUT",
        body,
      }),
      invalidatesTags: ["WorkingDays"],
      transformResponse: (response: { data: WorkingDaysConfig }) => response.data,
    }),

    getMyIp: builder.query<{ ip: string; normalizedIp: string }, void>({
      query: () => "/tenant-settings/my-ip",
      transformResponse: (response: { data: { ip: string; normalizedIp: string } }) =>
        response.data,
    }),

    // Part 11: Attendance Endpoints
    getTodayAttendance: builder.query<IAttendance | null, { date?: string } | void>({
      query: (params) => ({
        url: "/attendance/today",
        params: params?.date ? { date: params.date } : undefined,
      }),
      providesTags: ["Attendance"],
      transformResponse: (response: { data: IAttendance | null }) => response.data,
    }),

    checkIn: builder.mutation<IAttendance, CheckInPayload | void>({
      query: (body) => ({
        url: "/attendance/check-in",
        method: "POST",
        body: body || {},
      }),
      invalidatesTags: ["Attendance"],
      transformResponse: (response: { data: IAttendance }) => response.data,
    }),

    checkOut: builder.mutation<IAttendance, CheckOutPayload | void>({
      query: (body) => ({
        url: "/attendance/check-out",
        method: "POST",
        body: body || {},
      }),
      invalidatesTags: ["Attendance"],
      transformResponse: (response: { data: IAttendance }) => response.data,
    }),

    getDailyAttendance: builder.query<DailyRosterResult, { date?: string } | void>({
      query: (params) => ({
        url: "/attendance/daily",
        params: params?.date ? { date: params.date } : undefined,
      }),
      providesTags: ["Attendance"],
      transformResponse: (response: { data: DailyRosterResult }) => response.data,
    }),

    markAttendance: builder.mutation<IAttendance, MarkAttendancePayload>({
      query: (body) => ({
        url: "/attendance/mark",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Attendance"],
      transformResponse: (response: { data: IAttendance }) => response.data,
    }),

    bulkMarkAttendance: builder.mutation<{ count: number }, BulkMarkAttendancePayload>({
      query: (body) => ({
        url: "/attendance/bulk",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Attendance"],
      transformResponse: (response: { data: any }) => response.data,
    }),

    getMonthlyMatrix: builder.query<
      MonthlyMatrixResult,
      {
        month?: string | number;
        year?: string | number;
        departmentId?: string;
        page?: number;
        limit?: number;
      } | void
    >({
      query: (params) => ({
        url: "/attendance/monthly",
        params: {
          month: params?.month ? String(params.month) : undefined,
          year: params?.year ? String(params.year) : undefined,
          departmentId: params?.departmentId,
          page: params?.page,
          limit: params?.limit,
        },
      }),
      providesTags: ["Attendance"],
      transformResponse: (response: { data: MonthlyMatrixResult }) => response.data,
    }),

    getStaffAttendanceSummary: builder.query<
      StaffAttendanceSummary,
      {
        userId: string;
        month?: string | number;
        year?: string | number;
      }
    >({
      query: ({ userId, month, year }) => ({
        url: `/attendance/summary/${userId}`,
        params: {
          month: month ? String(month) : undefined,
          year: year ? String(year) : undefined,
        },
      }),
      providesTags: ["Attendance"],
      transformResponse: (response: { data: StaffAttendanceSummary }) => response.data,
    }),

    // Part 13: Automation & Recurring Tasks Endpoints
    triggerTaskAutomation: builder.mutation<
      TriggerAutomationResult,
      TriggerAutomationPayload | void
    >({
      query: (body) => ({
        url: "/automation/trigger-tasks",
        method: "POST",
        body: body || {},
      }),
      invalidatesTags: ["Automation", "Task"],
      transformResponse: (response: { data: TriggerAutomationResult }) =>
        response.data,
    }),

    getAutomationLogs: builder.query<
      AutomationLogsResponse,
      { page?: number; limit?: number } | void
    >({
      query: (params) => ({
        url: "/automation/logs",
        params: {
          page: params?.page ? String(params.page) : undefined,
          limit: params?.limit ? String(params.limit) : undefined,
        },
      }),
      providesTags: ["Automation"],
      transformResponse: (response: { data: AutomationLogsResponse }) =>
        response.data,
    }),

    getQueueHealth: builder.query<QueueHealthMetrics, void>({
      query: () => "/health",
      transformResponse: (response: { data: QueueHealthMetrics }) => response.data,
    }),

    // Part 14: Dynamic Visual Analytics & BI Dashboards
    getClientDistribution: builder.query<ClientEntityDistributionItem[], void>({
      query: () => "/analytics/client-distribution",
      providesTags: ["Client", "Dashboard"],
      transformResponse: (response: { data: ClientEntityDistributionItem[] }) =>
        response.data,
    }),

    getStaffPerformance: builder.query<
      StaffPerformanceItem[],
      { from?: string; to?: string } | void
    >({
      query: (params) => ({
        url: "/analytics/staff-performance",
        params: {
          from: params?.from,
          to: params?.to,
        },
      }),
      providesTags: ["Task", "Dashboard", "User"],
      transformResponse: (response: { data: StaffPerformanceItem[] }) =>
        response.data,
    }),

    getAttendanceOverview: builder.query<
      AttendanceKPIOverview,
      { date?: string; departmentId?: string } | void
    >({
      query: (params) => ({
        url: "/analytics/attendance-overview",
        params: {
          date: params?.date,
          departmentId: params?.departmentId,
        },
      }),
      providesTags: ["Attendance", "Dashboard"],
      transformResponse: (response: { data: AttendanceKPIOverview }) =>
        response.data,
    }),
    getDscList: builder.query<GetDscListResponse, GetDscListParams | void>({
      query: (params) => ({
        url: "/dsc",
        params: params || {},
      }),
      providesTags: ["DSC"],
      transformResponse: (response: { data: GetDscListResponse }) => response.data,
    }),
    getDscKpi: builder.query<DSCKpiSummary, void>({
      query: () => ({
        url: "/dsc/kpi",
      }),
      providesTags: ["DSC"],
      transformResponse: (response: { data: DSCKpiSummary }) => response.data,
    }),
    deleteDsc: builder.mutation<{ id: string }, string>({
      query: (id) => ({
        url: `/dsc/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["DSC"],
    }),
    createDsc: builder.mutation<DSCItem, CreateDscPayload>({
      query: (body) => ({
        url: "/dsc",
        method: "POST",
        body,
      }),
      invalidatesTags: ["DSC"],
      transformResponse: (response: { data: DSCItem }) => response.data,
    }),
    updateDsc: builder.mutation<DSCItem, { id: string; data: UpdateDscPayload }>({
      query: ({ id, data }) => ({
        url: `/dsc/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["DSC"],
      transformResponse: (response: { data: DSCItem }) => response.data,
    }),
    logDscHandover: builder.mutation<
      { log: DscHandoverLogItem; dsc: DSCItem },
      { id: string; data: DscHandoverPayload }
    >({
      query: ({ id, data }) => ({
        url: `/dsc/${id}/handover`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["DSC"],
      transformResponse: (response: { data: { log: DscHandoverLogItem; dsc: DSCItem } }) =>
        response.data,
    }),
    getDscHistory: builder.query<DscHandoverLogItem[], string>({
      query: (id) => ({
        url: `/dsc/${id}/history`,
      }),
      providesTags: ["DSC"],
      transformResponse: (response: { data: DscHandoverLogItem[] }) => response.data,
    }),
    triggerDscScan: builder.mutation<DscScanSummary, { referenceDate?: string } | void>({
      query: (body) => ({
        url: "/dsc/trigger-scan",
        method: "POST",
        body: body || {},
      }),
      invalidatesTags: ["DSC", "Task"],
      transformResponse: (response: { data: DscScanSummary }) => response.data,
    }),
    getCreditNotes: builder.query<GetCreditNoteListResponse, GetCreditNoteListParams | void>({
      query: (params) => ({
        url: "/credit-notes",
        params: params || {},
      }),
      providesTags: ["CreditNote"],
      transformResponse: (response: { data: GetCreditNoteListResponse }) => response.data,
    }),
    getCreditNoteById: builder.query<CreditNote, string>({
      query: (id) => ({
        url: `/credit-notes/${id}`,
      }),
      providesTags: ["CreditNote"],
      transformResponse: (response: { data: CreditNote }) => response.data,
    }),
    createCreditNote: builder.mutation<CreditNote, CreateCreditNotePayload>({
      query: (body) => ({
        url: "/credit-notes",
        method: "POST",
        body,
      }),
      invalidatesTags: ["CreditNote", "Invoice", "Ledger", "Dashboard"],
      transformResponse: (response: { data: CreditNote }) => response.data,
    }),
    applyUnallocatedCredit: builder.mutation<
      { creditNote: CreditNote; targetInvoice: any },
      { id: string; data: ApplyCreditPayload }
    >({
      query: ({ id, data }) => ({
        url: `/credit-notes/${id}/apply`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["CreditNote", "Invoice", "Ledger"],
      transformResponse: (response: { data: { creditNote: CreditNote; targetInvoice: any } }) =>
        response.data,
    }),
    refundCreditNote: builder.mutation<
      { creditNote: CreditNote; refundRecord: any },
      { id: string; data: RefundCreditPayload }
    >({
      query: ({ id, data }) => ({
        url: `/credit-notes/${id}/refund`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["CreditNote", "Ledger"],
      transformResponse: (response: { data: { creditNote: CreditNote; refundRecord: any } }) =>
        response.data,
    }),
    getPhysicalDocs: builder.query<GetPhysicalDocListResponse, GetPhysicalDocListParams | void>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.clientId) queryParams.append("clientId", params.clientId);
        if (params?.category) queryParams.append("category", params.category);
        if (params?.status) queryParams.append("status", params.status);
        if (params?.documentType) queryParams.append("documentType", params.documentType);
        if (params?.isReturnable !== undefined) queryParams.append("isReturnable", String(params.isReturnable));
        if (params?.location) queryParams.append("location", params.location);
        if (params?.search) queryParams.append("search", params.search);
        if (params?.from) queryParams.append("from", params.from);
        if (params?.to) queryParams.append("to", params.to);
        if (params?.page) queryParams.append("page", String(params.page));
        if (params?.limit) queryParams.append("limit", String(params.limit));
        const qs = queryParams.toString();
        return {
          url: `/docs-in-out${qs ? `?${qs}` : ""}`,
        };
      },
      providesTags: ["DocsInOut"],
      transformResponse: (response: {
        data: {
          data?: PhysicalDocument[];
          documents?: PhysicalDocument[];
          meta?: { total: number; page: number; limit: number; totalPages: number };
          summary?: { inCustody: number; overdue: number; returned: number; totalRegistered: number };
          total?: number;
          page?: number;
          limit?: number;
          totalPages?: number;
          overdueCount?: number;
        };
      }) => {
        const raw = response.data;
        const docs = raw.data || raw.documents || [];
        const total = raw.meta?.total ?? raw.total ?? docs.length;
        const page = raw.meta?.page ?? raw.page ?? 1;
        const limit = raw.meta?.limit ?? raw.limit ?? 20;
        const totalPages = raw.meta?.totalPages ?? raw.totalPages ?? 1;
        const overdueCount = raw.summary?.overdue ?? raw.overdueCount ?? 0;
        return {
          documents: docs,
          total,
          page,
          limit,
          totalPages,
          overdueCount,
        };
      },
    }),
    getPhysicalDocById: builder.query<PhysicalDocument, string>({
      query: (id) => `/docs-in-out/${id}`,
      providesTags: ["DocsInOut"],
      transformResponse: (response: { data: PhysicalDocument }) => response.data,
    }),
    createPhysicalDoc: builder.mutation<PhysicalDocument, CreatePhysicalDocPayload>({
      query: (data) => ({
        url: "/docs-in-out",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["DocsInOut"],
      transformResponse: (response: { data: PhysicalDocument }) => response.data,
    }),
    updatePhysicalDoc: builder.mutation<PhysicalDocument, { id: string; data: UpdatePhysicalDocPayload }>({
      query: ({ id, data }) => ({
        url: `/docs-in-out/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["DocsInOut"],
      transformResponse: (response: { data: PhysicalDocument }) => response.data,
    }),
    deletePhysicalDoc: builder.mutation<void, string>({
      query: (id) => ({
        url: `/docs-in-out/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["DocsInOut"],
    }),
    returnPhysicalDoc: builder.mutation<PhysicalDocument, { id: string; data: ReturnPhysicalDocPayload }>({
      query: ({ id, data }) => ({
        url: `/docs-in-out/${id}/return`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["DocsInOut"],
      transformResponse: (response: { data: PhysicalDocument }) => response.data,
    }),
    getStorageLocations: builder.query<StorageLocationSummary[], void>({
      query: () => "/docs-in-out/locations",
      providesTags: ["DocsInOut"],
      transformResponse: (response: { data: StorageLocationSummary[] }) => response.data,
    }),
    triggerOverdueDocsScan: builder.mutation<OverdueScanSummary, { referenceDate?: string } | void>({
      query: (body) => ({
        url: "/docs-in-out/trigger-scan",
        method: "POST",
        body: body || {},
      }),
      invalidatesTags: ["DocsInOut"],
      transformResponse: (response: { data: OverdueScanSummary }) => response.data,
    }),
    getHandoverSlip: builder.query<{ html: string; document: PhysicalDocument; tenant: any }, string>({
      query: (id) => `/docs-in-out/${id}/handover-slip`,
      transformResponse: (response: { data: { html: string; document: PhysicalDocument; tenant: any } }) => response.data,
    }),
    getDocumentRequests: builder.query<GetDocumentRequestListResponse, GetDocumentRequestListParams | void>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.clientId) queryParams.append("clientId", params.clientId);
        if (params?.taskId) queryParams.append("taskId", params.taskId);
        if (params?.status) queryParams.append("status", params.status);
        if (params?.search) queryParams.append("search", params.search);
        if (params?.page) queryParams.append("page", String(params.page));
        if (params?.limit) queryParams.append("limit", String(params.limit));
        const qs = queryParams.toString();
        return {
          url: `/document-requests${qs ? `?${qs}` : ""}`,
        };
      },
      providesTags: ["DocumentRequest"],
      transformResponse: (response: {
        data: {
          data?: DocumentRequest[];
          requests?: DocumentRequest[];
          meta?: { total: number; page: number; limit: number; totalPages: number };
          summary?: { pending: number; partiallyUploaded: number; completed: number; expired: number; totalRequests: number };
          total?: number;
          page?: number;
          limit?: number;
          totalPages?: number;
        };
      }) => {
        const raw = response.data;
        const requests = raw.data || raw.requests || [];
        const total = raw.meta?.total ?? raw.total ?? requests.length;
        const page = raw.meta?.page ?? raw.page ?? 1;
        const limit = raw.meta?.limit ?? raw.limit ?? 20;
        const totalPages = raw.meta?.totalPages ?? raw.totalPages ?? 1;
        const summary = raw.summary || {
          pending: 0,
          partiallyUploaded: 0,
          completed: 0,
          expired: 0,
          totalRequests: total,
        };
        return {
          requests,
          total,
          page,
          limit,
          totalPages,
          summary,
        };
      },
    }),
    getDocumentRequestById: builder.query<DocumentRequest, string>({
      query: (id) => `/document-requests/${id}`,
      providesTags: ["DocumentRequest"],
      transformResponse: (response: { data: DocumentRequest }) => response.data,
    }),
    createDocumentRequest: builder.mutation<
      DocumentRequest & { uploadUrl: string; emailDispatched: boolean },
      CreateDocumentRequestPayload
    >({
      query: (data) => ({
        url: "/document-requests",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["DocumentRequest"],
      transformResponse: (response: {
        data: DocumentRequest & { uploadUrl: string; emailDispatched: boolean };
      }) => response.data,
    }),
    resendDocumentRequest: builder.mutation<
      { emailDispatched: boolean; uploadUrl: string },
      string
    >({
      query: (id) => ({
        url: `/document-requests/${id}/resend`,
        method: "POST",
      }),
      invalidatesTags: ["DocumentRequest"],
      transformResponse: (response: {
        data: { emailDispatched: boolean; uploadUrl: string };
      }) => response.data,
    }),
    cancelDocumentRequest: builder.mutation<DocumentRequest, string>({
      query: (id) => ({
        url: `/document-requests/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["DocumentRequest"],
      transformResponse: (response: { data: DocumentRequest }) => response.data,
    }),
    triggerExpiredRequestsScan: builder.mutation<
      { scannedCount: number; expiredCount: number },
      { referenceDate?: string } | void
    >({
      query: (body) => ({
        url: "/document-requests/trigger-scan",
        method: "POST",
        body: body || {},
      }),
      invalidatesTags: ["DocumentRequest"],
      transformResponse: (response: {
        data: { scannedCount: number; expiredCount: number };
      }) => response.data,
    }),
    getPublicDocumentRequest: builder.query<PublicDocumentRequest, string>({
      query: (token) => `/public/document-requests/${token}`,
      transformResponse: (response: { data: PublicDocumentRequest }) => response.data,
    }),
    uploadPublicDocumentFile: builder.mutation<
      UploadPublicFileResponse,
      { token: string; itemId: string; file: File }
    >({
      query: ({ token, itemId, file }) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("itemId", itemId);
        return {
          url: `/public/document-requests/${token}/upload`,
          method: "POST",
          body: formData,
        };
      },
      transformResponse: (response: { data: UploadPublicFileResponse }) => response.data,
    }),
    // Password Vault Endpoints (Part 20)
    getPortals: builder.query<PortalMaster[], void>({
      query: () => "/passwords/portals",
      transformResponse: (response: { data: PortalMaster[] }) => response.data,
    }),
    getPasswords: builder.query<GetPasswordsResponse, GetPasswordsParams>({
      query: (params) => ({
        url: "/passwords",
        params,
      }),
      providesTags: ["PasswordVault"],
      transformResponse: (response: { data: GetPasswordsResponse }) => response.data,
    }),
    getPasswordById: builder.query<ClientPassword, string>({
      query: (id) => `/passwords/${id}`,
      providesTags: ["PasswordVault"],
      transformResponse: (response: { data: ClientPassword }) => response.data,
    }),
    createPassword: builder.mutation<ClientPassword, CreatePasswordPayload>({
      query: (payload) => ({
        url: "/passwords",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["PasswordVault"],
      transformResponse: (response: { data: ClientPassword }) => response.data,
    }),
    updatePassword: builder.mutation<
      ClientPassword,
      { id: string; payload: UpdatePasswordPayload }
    >({
      query: ({ id, payload }) => ({
        url: `/passwords/${id}`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: ["PasswordVault"],
      transformResponse: (response: { data: ClientPassword }) => response.data,
    }),
    deletePassword: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/passwords/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["PasswordVault"],
    }),
    revealPassword: builder.mutation<
      RevealPasswordResponse,
      { id: string; purpose?: string }
    >({
      query: ({ id, purpose }) => ({
        url: `/passwords/${id}/reveal`,
        method: "POST",
        body: { purpose },
      }),
      invalidatesTags: ["PasswordAudit"],
      transformResponse: (response: { data: RevealPasswordResponse }) => response.data,
    }),
    getPasswordAuditLogs: builder.query<
      GetPasswordAuditLogsResponse,
      GetPasswordAuditLogsParams
    >({
      query: (params) => ({
        url: "/passwords/audit-log",
        params,
      }),
      providesTags: ["PasswordAudit"],
      transformResponse: (response: { data: GetPasswordAuditLogsResponse }) => response.data,
    }),
    bulkImportPasswords: builder.mutation<
      BulkImportPasswordsResponse,
      FormData
    >({
      query: (formData) => ({
        url: "/passwords/bulk-import",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["PasswordVault"],
      transformResponse: (response: { data: BulkImportPasswordsResponse }) => response.data,
    }),
    // Reimbursable Client Expenses (Part 21)
    getExpenses: builder.query<GetExpensesResponse, GetExpensesParams>({
      query: (params) => ({
        url: "/expenses",
        params,
      }),
      providesTags: ["Expense"],
      transformResponse: (response: { data: GetExpensesResponse }) => response.data,
    }),
    getExpenseById: builder.query<ClientExpense, string>({
      query: (id) => `/expenses/${id}`,
      providesTags: ["Expense"],
      transformResponse: (response: { data: ClientExpense }) => response.data,
    }),
    getUnbilledExpenses: builder.query<UnbilledExpensesResponse, string>({
      query: (clientId) => `/expenses/unbilled/${clientId}`,
      providesTags: ["Expense"],
      transformResponse: (response: { data: UnbilledExpensesResponse }) => response.data,
    }),
    getExpenseAnalytics: builder.query<
      ExpenseAnalyticsResponse,
      { startDate?: string; endDate?: string } | void
    >({
      query: (params) => ({
        url: "/expenses/analytics",
        params: params || undefined,
      }),
      providesTags: ["Expense"],
      transformResponse: (response: { data: ExpenseAnalyticsResponse }) => response.data,
    }),
    getExpenseCategories: builder.query<ExpenseCategoryItem[], void>({
      query: () => "/masters/expense-categories",
      transformResponse: (response: { data: ExpenseCategoryItem[] }) => response.data,
    }),
    createExpense: builder.mutation<ClientExpense, FormData>({
      query: (formData) => ({
        url: "/expenses",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["Expense", "Invoice"],
      transformResponse: (response: { data: ClientExpense }) => response.data,
    }),
    updateExpense: builder.mutation<
      ClientExpense,
      { id: string; formData: FormData }
    >({
      query: ({ id, formData }) => ({
        url: `/expenses/${id}`,
        method: "PUT",
        body: formData,
      }),
      invalidatesTags: ["Expense", "Invoice"],
      transformResponse: (response: { data: ClientExpense }) => response.data,
    }),
    deleteExpense: builder.mutation<{ deleted: boolean }, string>({
      query: (id) => ({
        url: `/expenses/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Expense", "Invoice"],
    }),
    // Pre-Sales Quotations & CRM Engine (Part 22)
    getQuotations: builder.query<GetQuotationsResponse, GetQuotationsParams | void>({
      query: (params) => ({
        url: "/quotations",
        params: params || undefined,
      }),
      providesTags: ["Quotation"],
      transformResponse: (response: { data: GetQuotationsResponse }) => response.data,
    }),
    getQuotationById: builder.query<Quotation, string>({
      query: (id) => `/quotations/${id}`,
      providesTags: ["Quotation"],
      transformResponse: (response: { data: Quotation }) => response.data,
    }),
    createQuotation: builder.mutation<Quotation, CreateQuotationPayload>({
      query: (payload) => ({
        url: "/quotations",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Quotation"],
      transformResponse: (response: { data: Quotation }) => response.data,
    }),
    updateQuotation: builder.mutation<
      Quotation,
      { id: string; payload: UpdateQuotationPayload }
    >({
      query: ({ id, payload }) => ({
        url: `/quotations/${id}`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: ["Quotation"],
      transformResponse: (response: { data: Quotation }) => response.data,
    }),
    deleteQuotation: builder.mutation<{ deleted: boolean }, string>({
      query: (id) => ({
        url: `/quotations/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Quotation"],
    }),
    updateQuotationStatus: builder.mutation<
      Quotation,
      { id: string; status: "Draft" | "Sent" | "Accepted" | "Declined" }
    >({
      query: ({ id, status }) => ({
        url: `/quotations/${id}/status`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: ["Quotation"],
      transformResponse: (response: { data: Quotation }) => response.data,
    }),
    sendQuotationEmail: builder.mutation<
      { sent: boolean; sentAt: string; email: string },
      { id: string; email?: string }
    >({
      query: ({ id, email }) => ({
        url: `/quotations/${id}/send`,
        method: "POST",
        body: { email },
      }),
      invalidatesTags: ["Quotation"],
      transformResponse: (response: { data: { sent: boolean; sentAt: string; email: string } }) => response.data,
    }),
    convertToInvoice: builder.mutation<
      ConvertQuotationResponse,
      { id: string; status?: "Draft" | "Unpaid" }
    >({
      query: ({ id, status }) => ({
        url: `/quotations/${id}/convert-to-invoice`,
        method: "POST",
        body: { status },
      }),
      invalidatesTags: ["Quotation", "Invoice"],
      transformResponse: (response: { data: ConvertQuotationResponse }) => response.data,
    }),
    getQuotationPrint: builder.query<QuotationPrintLayout, string>({
      query: (id) => `/quotations/${id}/print`,
      providesTags: ["Quotation"],
      transformResponse: (response: { data: QuotationPrintLayout }) => response.data,
    }),
    getQuotationPipelineAnalytics: builder.query<
      QuotationPipelineAnalytics,
      { startDate?: string; endDate?: string } | void
    >({
      query: (params) => ({
        url: "/quotations/analytics/pipeline",
        params: params || undefined,
      }),
      providesTags: ["Quotation"],
      transformResponse: (response: { data: QuotationPipelineAnalytics }) => response.data,
    }),
    getTasksReport: builder.query<TaskReportResponse, TaskReportQuery | void>({
      query: (params) => ({
        url: "/reports/tasks",
        params: params || undefined,
      }),
      providesTags: ["Report", "Task"],
      transformResponse: (response: { data: TaskReportResponse }) => response.data,
    }),
    getServicesReport: builder.query<ServiceReportResponse, Record<string, any> | void>({
      query: (params) => ({
        url: "/reports/services",
        params: params || undefined,
      }),
      providesTags: ["Report", "Service"],
      transformResponse: (response: { data: ServiceReportResponse }) => response.data,
    }),
    getDscRenewalsReport: builder.query<DscReportResponse, DscReportQuery | void>({
      query: (params) => ({
        url: "/reports/dsc-renewals",
        params: params || undefined,
      }),
      providesTags: ["Report", "DSC"],
      transformResponse: (response: { data: DscReportResponse }) => response.data,
    }),
    getInvoicesReport: builder.query<InvoiceReportResponse, InvoiceReportQuery | void>({
      query: (params) => ({
        url: "/reports/invoices",
        params: params || undefined,
      }),
      providesTags: ["Report", "Invoice"],
      transformResponse: (response: { data: InvoiceReportResponse }) => response.data,
    }),
    getDebtorsAgingReport: builder.query<DebtorsAgingReportResponse, DebtorsAgingQuery | void>({
      query: (params) => ({
        url: "/reports/debtors-aging",
        params: params || undefined,
      }),
      providesTags: ["Report", "Invoice"],
      transformResponse: (response: { data: DebtorsAgingReportResponse }) => response.data,
    }),

    // ─── Client Portal Authentication & Profile Endpoints ───────────
    portalLogin: builder.mutation({
      query: (credentials: { emailOrPhone: string; password: string }) => ({
        url: "/portal/auth/login",
        method: "POST",
        body: credentials,
      }),
      transformResponse: (response: { data: any }) => response.data,
    }),
    portalRequestOtp: builder.mutation({
      query: (payload: { identifier: string }) => ({
        url: "/portal/auth/request-otp",
        method: "POST",
        body: payload,
      }),
      transformResponse: (response: { data: any }) => response.data,
    }),
    portalVerifyOtp: builder.mutation({
      query: (payload: { identifier: string; code: string }) => ({
        url: "/portal/auth/verify-otp",
        method: "POST",
        body: payload,
      }),
      transformResponse: (response: { data: any }) => response.data,
    }),
    portalSendMagicLink: builder.mutation({
      query: (payload: { email: string }) => ({
        url: "/portal/auth/send-magic-link",
        method: "POST",
        body: payload,
      }),
      transformResponse: (response: { data: any }) => response.data,
    }),
    portalVerifyMagicLink: builder.mutation({
      query: (payload: { token: string }) => ({
        url: "/portal/auth/verify-magic-link",
        method: "POST",
        body: payload,
      }),
      transformResponse: (response: { data: any }) => response.data,
    }),
    portalLogout: builder.mutation<any, void>({
      query: () => ({
        url: "/portal/auth/logout",
        method: "POST",
      }),
    }),
    getPortalProfile: builder.query<any, void>({
      query: () => "/portal/profile",
      providesTags: ["PortalProfile"],
      transformResponse: (response: { data: any }) => response.data,
    }),
    updatePortalProfile: builder.mutation({
      query: (body) => ({
        url: "/portal/profile",
        method: "PUT",
        body,
      }),
      invalidatesTags: ["PortalProfile"],
      transformResponse: (response: { data: any }) => response.data,
    }),
    changePortalPassword: builder.mutation({
      query: (body: { currentPassword: string; newPassword: string }) => ({
        url: "/portal/auth/change-password",
        method: "POST",
        body,
      }),
      transformResponse: (response: { data: any }) => response.data,
    }),

    // ─── Staff: Client Portal Users & Access Management ─────────────
    getClientPortalUsers: builder.query<{ allowLogin: boolean; users: any[] }, string>({
      query: (clientId: string) => `/clients/${clientId}/portal-users`,
      providesTags: ["ClientPortalUser"],
      transformResponse: (response: { data: { allowLogin: boolean; users: any[] } }) => response.data,
    }),
    createClientPortalUser: builder.mutation({
      query: ({ clientId, ...body }) => ({
        url: `/clients/${clientId}/portal-users`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["ClientPortalUser", "Client"],
      transformResponse: (response: { data: any }) => response.data,
    }),
    updateClientPortalUser: builder.mutation({
      query: ({ clientId, userId, ...body }) => ({
        url: `/clients/${clientId}/portal-users/${userId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["ClientPortalUser"],
      transformResponse: (response: { data: any }) => response.data,
    }),
    deleteClientPortalUser: builder.mutation({
      query: ({ clientId, userId }) => ({
        url: `/clients/${clientId}/portal-users/${userId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["ClientPortalUser"],
      transformResponse: (response: { data: any }) => response.data,
    }),
    resetClientPortalUserPassword: builder.mutation({
      query: ({ clientId, userId, newPassword }) => ({
        url: `/clients/${clientId}/portal-users/${userId}/reset-password`,
        method: "POST",
        body: { newPassword },
      }),
      invalidatesTags: ["ClientPortalUser"],
      transformResponse: (response: { data: any }) => response.data,
    }),
    toggleClientPortalAccess: builder.mutation({
      query: ({ clientId, allowLogin }) => ({
        url: `/clients/${clientId}/portal-access`,
        method: "PATCH",
        body: { allowLogin },
      }),
      invalidatesTags: ["ClientPortalUser", "Client"],
      transformResponse: (response: { data: any }) => response.data,
    }),

    // ─── Website CMS & Portal Configuration ─────────────────────────
    getPortalWebsiteConfig: builder.query<any, string | void>({
      query: (subdomain) => ({
        url: "/portal/website-config",
        params: subdomain ? { subdomain } : undefined,
      }),
      transformResponse: (response: { data: any }) => response.data,
    }),
    getWebsiteSettings: builder.query<any, void>({
      query: () => "/tenant-settings/website",
      providesTags: ["WebsiteSettings"],
      transformResponse: (response: { data: any }) => response.data,
    }),
    updateWebsiteSettings: builder.mutation<any, any>({
      query: (body) => ({
        url: "/tenant-settings/website",
        method: "PUT",
        body,
      }),
      invalidatesTags: ["WebsiteSettings"],
      transformResponse: (response: { data: any }) => response.data,
    }),

    // ─── Part 26: Client Self-Service Hub Endpoints ────────────────
    getComplianceCalendar: builder.query<any[], { year?: number; month?: number; status?: string } | void>({
      query: (params) => ({
        url: "/portal/compliance-calendar",
        params: params || undefined,
      }),
      providesTags: ["PortalCompliance"],
      transformResponse: (response: { data: any[] }) => response.data,
    }),
    getPortalDocuments: builder.query<any[], { folder?: string; search?: string; from?: string; to?: string } | void>({
      query: (params) => ({
        url: "/portal/documents",
        params: params || undefined,
      }),
      providesTags: ["PortalDocuments"],
      transformResponse: (response: { data: any[] }) => response.data,
    }),
    getPortalInvoices: builder.query<any[], void>({
      query: () => "/portal/invoices",
      providesTags: ["PortalInvoices"],
      transformResponse: (response: { data: any[] }) => response.data,
    }),
    getPortalReceipts: builder.query<any[], void>({
      query: () => "/portal/receipts",
      providesTags: ["PortalReceipts"],
      transformResponse: (response: { data: any[] }) => response.data,
    }),
    getPortalLedger: builder.query<any, { from?: string; to?: string } | void>({
      query: (params) => ({
        url: "/portal/ledger",
        params: params || undefined,
      }),
      providesTags: ["PortalLedger"],
      transformResponse: (response: { data: any }) => response.data,
    }),
    getPortalDocumentRequests: builder.query<any[], void>({
      query: () => "/portal/document-requests",
      providesTags: ["PortalDocRequests"],
      transformResponse: (response: { data: any[] }) => response.data,
    }),
    fulfillPortalDocumentRequest: builder.mutation<any, { requestId: string; formData: FormData }>({
      query: ({ requestId, formData }) => ({
        url: `/portal/requests/${requestId}/fulfill`,
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["PortalDocRequests", "PortalDocuments"],
      transformResponse: (response: { data: any }) => response.data,
    }),
    getPortalQueryTickets: builder.query<any[], void>({
      query: () => "/portal/queries",
      providesTags: ["PortalQueries"],
      transformResponse: (response: { data: any[] }) => response.data,
    }),
    createPortalQueryTicket: builder.mutation<any, { type: string; subject: string; message: string; attachments?: string[] }>({
      query: (body) => ({
        url: "/portal/queries",
        method: "POST",
        body,
      }),
      invalidatesTags: ["PortalQueries"],
      transformResponse: (response: { data: any }) => response.data,
    }),

    // ─── Part 27: Payment Gateway & UPI Endpoints ──────────────────
    getGatewayConfigs: builder.query<any[], void>({
      query: () => "/tenant-settings/payment-gateways",
      providesTags: ["GatewayConfig"],
      transformResponse: (response: { data: any[] }) => response.data,
    }),
    upsertGatewayConfig: builder.mutation<any, any>({
      query: (body) => ({
        url: "/tenant-settings/payment-gateways",
        method: "POST",
        body,
      }),
      invalidatesTags: ["GatewayConfig"],
      transformResponse: (response: { data: any }) => response.data,
    }),
    getInvoiceUpiQr: builder.query<{ npciUri: string; qrDataUrl: string; upiId: string; amount: number; invoiceNo: string }, string>({
      query: (invoiceId) => `/invoices/${invoiceId}/upi-qr`,
      transformResponse: (response: { data: any }) => response.data,
    }),
    createInvoicePaymentLink: builder.mutation<{ paymentLinkId: string; shortUrl: string }, string>({
      query: (invoiceId) => ({
        url: `/invoices/${invoiceId}/payment-link`,
        method: "POST",
      }),
      transformResponse: (response: { data: any }) => response.data,
    }),
    getPaymentTransactions: builder.query<{ transactions: any[]; total: number }, { status?: string; from?: string; to?: string; clientId?: string; invoiceId?: string } | void>({
      query: (params) => ({
        url: "/client-payments/transactions",
        params: params || undefined,
      }),
      providesTags: ["PaymentTransaction"],
      transformResponse: (response: { data: any }) => response.data,
    }),

    // ─── Part 29: Multi-Branch & SaaS Licensing Endpoints ───────────
    getBillingEntities: builder.query<any[], void>({
      query: () => "/tenant-settings/billing-entities",
      providesTags: ["BillingEntity"],
      transformResponse: (response: { data: any[] }) => response.data,
    }),
    createBillingEntity: builder.mutation<any, any>({
      query: (body) => ({
        url: "/tenant-settings/billing-entities",
        method: "POST",
        body,
      }),
      invalidatesTags: ["BillingEntity"],
      transformResponse: (response: { data: any }) => response.data,
    }),
    updateBillingEntity: builder.mutation<any, { id: string; [key: string]: any }>({
      query: ({ id, ...body }) => ({
        url: `/tenant-settings/billing-entities/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["BillingEntity"],
      transformResponse: (response: { data: any }) => response.data,
    }),
    deleteBillingEntity: builder.mutation<any, string>({
      query: (id) => ({
        url: `/tenant-settings/billing-entities/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["BillingEntity"],
      transformResponse: (response: { data: any }) => response.data,
    }),
    getTenantUsage: builder.query<any, void>({
      query: () => "/tenant-settings/usage",
      providesTags: ["TenantUsage"],
      transformResponse: (response: { data: any }) => response.data,
    }),
    getTenantSubscription: builder.query<any, void>({
      query: () => "/tenant-settings/subscription",
      providesTags: ["TenantSubscription"],
      transformResponse: (response: { data: any }) => response.data,
    }),
    updateTenantSubscription: builder.mutation<any, any>({
      query: (body) => ({
        url: "/tenant-settings/subscription",
        method: "POST",
        body,
      }),
      invalidatesTags: ["TenantSubscription", "TenantUsage"],
      transformResponse: (response: { data: any }) => response.data,
    }),
  }),
});

export const {
  useLoginMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useGetMeQuery,
  useUploadAvatarMutation,
  useGetTasksQuery,
  useGetTaskByIdQuery,
  useGetTagsQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useUpdateTaskStatusMutation,
  useToggleTaskChecklistStepMutation,
  useAddTaskChecklistStepMutation,
  useDeleteTaskChecklistStepMutation,
  useAddSubtaskMutation,
  useUpdateSubtaskMutation,
  useDeleteSubtaskMutation,
  useGetTaskHistoryQuery,
  useAddTaskHistoryNoteMutation,
  useGetTaskDocumentsQuery,
  useUploadTaskDocumentMutation,
  useDeleteTaskDocumentMutation,
  useGetClientDocumentsQuery,
  useUploadClientDocumentMutation,
  useDeleteClientDocumentMutation,
  useGetClientsQuery,
  useGetClientByIdQuery,
  useCreateClientMutation,
  useUpdateClientMutation,
  useUploadClientPhotoMutation,
  useGetServicesQuery,
  useGetServiceByIdQuery,
  useCreateServiceMutation,
  useUpdateServiceMutation,
  useDeleteServiceMutation,
  useGetPackagesQuery,
  useGetPackageByIdQuery,
  useCreatePackageMutation,
  useUpdatePackageMutation,
  useDeletePackageMutation,
  useSubscribeClientToPackageMutation,
  useSubscribeClientToServiceMutation,
  useUnsubscribeClientFromPackageMutation,
  useUnsubscribeClientFromServiceMutation,
  useGetInvoicesQuery,
  useGetInvoiceByIdQuery,
  useGetUnbilledTasksQuery,
  useCreateInvoiceMutation,
  useUpdateInvoiceMutation,
  useCancelInvoiceMutation,
  useGetReceiptsQuery,
  useGetReceiptByIdQuery,
  useGetUnpaidInvoicesQuery,
  useAutoSettlePreviewMutation,
  useCreateReceiptMutation,
  useGetLedgerQuery,
  useGetDashboardOverviewQuery,
  useGetClientSummaryQuery,
  useGetUsersQuery,
  useGetHolidaysQuery,
  useCreateHolidayMutation,
  useUpdateHolidayMutation,
  useDeleteHolidayMutation,
  useSeedDefaultHolidaysMutation,
  useGetWorkingDaysQuery,
  useUpdateWorkingDaysMutation,
  useGetMyIpQuery,
  useGetTodayAttendanceQuery,
  useCheckInMutation,
  useCheckOutMutation,
  useGetDailyAttendanceQuery,
  useMarkAttendanceMutation,
  useBulkMarkAttendanceMutation,
  useGetMonthlyMatrixQuery,
  useGetStaffAttendanceSummaryQuery,
  useTriggerTaskAutomationMutation,
  useGetAutomationLogsQuery,
  useGetQueueHealthQuery,
  useGetClientDistributionQuery,
  useGetStaffPerformanceQuery,
  useGetAttendanceOverviewQuery,
  useGetDscListQuery,
  useGetDscKpiQuery,
  useDeleteDscMutation,
  useCreateDscMutation,
  useUpdateDscMutation,
  useLogDscHandoverMutation,
  useGetDscHistoryQuery,
  useTriggerDscScanMutation,
  useGetCreditNotesQuery,
  useGetCreditNoteByIdQuery,
  useCreateCreditNoteMutation,
  useApplyUnallocatedCreditMutation,
  useRefundCreditNoteMutation,
  useGetPhysicalDocsQuery,
  useGetPhysicalDocByIdQuery,
  useCreatePhysicalDocMutation,
  useUpdatePhysicalDocMutation,
  useDeletePhysicalDocMutation,
  useReturnPhysicalDocMutation,
  useGetStorageLocationsQuery,
  useTriggerOverdueDocsScanMutation,
  useGetHandoverSlipQuery,
  useGetDocumentRequestsQuery,
  useGetDocumentRequestByIdQuery,
  useCreateDocumentRequestMutation,
  useResendDocumentRequestMutation,
  useCancelDocumentRequestMutation,
  useTriggerExpiredRequestsScanMutation,
  useGetPublicDocumentRequestQuery,
  useUploadPublicDocumentFileMutation,
  useGetPortalsQuery,
  useGetPasswordsQuery,
  useGetPasswordByIdQuery,
  useCreatePasswordMutation,
  useUpdatePasswordMutation,
  useDeletePasswordMutation,
  useRevealPasswordMutation,
  useGetPasswordAuditLogsQuery,
  useBulkImportPasswordsMutation,
  useGetExpensesQuery,
  useGetExpenseByIdQuery,
  useGetUnbilledExpensesQuery,
  useGetExpenseAnalyticsQuery,
  useGetExpenseCategoriesQuery,
  useCreateExpenseMutation,
  useUpdateExpenseMutation,
  useDeleteExpenseMutation,
  useGetQuotationsQuery,
  useGetQuotationByIdQuery,
  useCreateQuotationMutation,
  useUpdateQuotationMutation,
  useDeleteQuotationMutation,
  useUpdateQuotationStatusMutation,
  useSendQuotationEmailMutation,
  useConvertToInvoiceMutation,
  useGetQuotationPrintQuery,
  useGetQuotationPipelineAnalyticsQuery,
  useGetTasksReportQuery,
  useGetServicesReportQuery,
  useGetDscRenewalsReportQuery,
  useGetInvoicesReportQuery,
  useGetDebtorsAgingReportQuery,
  usePortalLoginMutation,
  usePortalRequestOtpMutation,
  usePortalVerifyOtpMutation,
  usePortalSendMagicLinkMutation,
  usePortalVerifyMagicLinkMutation,
  usePortalLogoutMutation,
  useGetPortalProfileQuery,
  useUpdatePortalProfileMutation,
  useChangePortalPasswordMutation,
  useGetClientPortalUsersQuery,
  useCreateClientPortalUserMutation,
  useUpdateClientPortalUserMutation,
  useDeleteClientPortalUserMutation,
  useResetClientPortalUserPasswordMutation,
  useToggleClientPortalAccessMutation,
  useGetPortalWebsiteConfigQuery,
  useGetWebsiteSettingsQuery,
  useUpdateWebsiteSettingsMutation,
  useGetComplianceCalendarQuery,
  useGetPortalDocumentsQuery,
  useGetPortalInvoicesQuery,
  useGetPortalReceiptsQuery,
  useGetPortalLedgerQuery,
  useGetPortalDocumentRequestsQuery,
  useFulfillPortalDocumentRequestMutation,
  useGetPortalQueryTicketsQuery,
  useCreatePortalQueryTicketMutation,
  useGetGatewayConfigsQuery,
  useUpsertGatewayConfigMutation,
  useGetInvoiceUpiQrQuery,
  useCreateInvoicePaymentLinkMutation,
  useGetPaymentTransactionsQuery,
  useGetBillingEntitiesQuery,
  useCreateBillingEntityMutation,
  useUpdateBillingEntityMutation,
  useDeleteBillingEntityMutation,
  useGetTenantUsageQuery,
  useGetTenantSubscriptionQuery,
  useUpdateTenantSubscriptionMutation,
} = applicationApi;


