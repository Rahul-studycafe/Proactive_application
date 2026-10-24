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
      invalidatesTags: ["Task"],
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
} = applicationApi;

