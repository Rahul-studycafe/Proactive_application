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
        // try to get a new token
        // Use 'include' credentials to send the HttpOnly refreshToken cookie
        const refreshResult: any = await baseQuery(
          { url: "/auth/refresh", method: "POST", credentials: "include" },
          api,
          extraOptions,
        );
        if (
          refreshResult.data?.accessToken ||
          refreshResult.data?.data?.accessToken
        ) {
          const newToken =
            refreshResult.data.accessToken ||
            refreshResult.data.data.accessToken;
          // store the new token
          localStorage.setItem("accessToken", newToken);
          // retry the initial query
          result = await baseQuery(args, api, extraOptions);
        } else {
          // refresh failed - log out
          localStorage.removeItem("accessToken");
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

export const applicationApi = createApi({
  reducerPath: "applicationApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Task", "Client", "Tag", "Service", "User", "Package"],
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
    updateTaskStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/tasks/${id}/status`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: ["Task"],
      transformResponse: (response: { data: any }) => response.data,
    }),
    getTaskHistory: builder.query({
      query: (taskId) => `/tasks/${taskId}/history`,
      providesTags: (result, error, taskId) => [{ type: "Task", id: `${taskId}-history` }],
      transformResponse: (response: { data: any }) => response.data,
    }),
    addTaskHistoryNote: builder.mutation({
      query: ({ taskId, content }) => ({
        url: `/tasks/${taskId}/notes`,
        method: "POST",
        body: { content },
      }),
      invalidatesTags: (result, error, { taskId }) => [{ type: "Task", id: `${taskId}-history` }],
      transformResponse: (response: { data: any }) => response.data,
    }),
    getTaskDocuments: builder.query({
      query: ({ taskId, category }) => ({ url: `/documents/task/${taskId}`, params: { category } }),
      providesTags: (result, error, { taskId }) => [{ type: "Task", id: `${taskId}-documents` }],
      transformResponse: (response: { data: any }) => response.data,
    }),
    uploadTaskDocument: builder.mutation({
      query: ({ taskId, ...body }) => ({
        url: `/documents/task/${taskId}`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { taskId }) => [{ type: "Task", id: `${taskId}-documents` }],
      transformResponse: (response: { data: any }) => response.data,
    }),
    deleteTaskDocument: builder.mutation({
      query: ({ id, taskId }) => ({
        url: `/documents/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { taskId }) => [{ type: "Task", id: `${taskId}-documents` }],
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

    // Users
    getUsers: builder.query({
      query: (params) => ({ url: "/users", params }),
      providesTags: ["User"],
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
  useUpdateTaskStatusMutation,
  useGetTaskHistoryQuery,
  useAddTaskHistoryNoteMutation,
  useGetTaskDocumentsQuery,
  useUploadTaskDocumentMutation,
  useDeleteTaskDocumentMutation,
  useGetClientsQuery,
  useGetClientByIdQuery,
  useCreateClientMutation,
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
  useGetUsersQuery,
} = applicationApi;
