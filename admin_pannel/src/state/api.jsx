import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getApiBase } from "@utils/apiBase";

const baseUrl = getApiBase();

const rawBaseQuery = fetchBaseQuery({
  baseUrl,
  credentials: "include",
  prepareHeaders: (headers) => {
    try {
      const token = localStorage.getItem("token");
      if (token) headers.set("Authorization", `Bearer ${token}`);
    } catch (e) {
      // ignore
    }
    return headers;
  },
});

let refreshPromise = null;

const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    const hasAttempted =
      (args && args.headers && args.headers["x-refresh-attempt"]) ||
      (extraOptions &&
        extraOptions.headers &&
        extraOptions.headers["x-refresh-attempt"]);
    if (hasAttempted) return result;

    const apiBase = getApiBase();
    const refreshUrl = `${apiBase}/clients/refresh`;

    if (!refreshPromise) {
      refreshPromise = (async () => {
        try {
          const refreshRes = await fetch(refreshUrl, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
          });

          if (!refreshRes.ok) throw new Error("refresh-failed");

          const data = await refreshRes.json();
          if (data && data.token) {
            try {
              localStorage.setItem("token", data.token);
            } catch (e) {}
            return data.token;
          }
          throw new Error("no-token-in-refresh");
        } catch (e) {
          throw e;
        }
      })();
    }

    try {
      await refreshPromise;
      refreshPromise = null;

      if (!args.headers) args.headers = {};
      args.headers["x-refresh-attempt"] = "1";
      if (!extraOptions) extraOptions = {};
      if (!extraOptions.headers) extraOptions.headers = {};
      extraOptions.headers["x-refresh-attempt"] = "1";

      result = await rawBaseQuery(args, api, extraOptions);
      return result;
    } catch (e) {
      refreshPromise = null;
      try {
        await fetch(`${apiBase}/clients/logout`, {
          method: "POST",
          credentials: "include",
        });
      } catch {}
      try {
        localStorage.removeItem("token");
      } catch {}
      if (typeof window !== "undefined") {
        try {
          const bc = new BroadcastChannel("auth");
          bc.postMessage({ type: "logout" });
          bc.close();
          window.dispatchEvent(new CustomEvent("auth:logout"));
        } catch {
          try {
            localStorage.setItem("auth_logout", Date.now().toString());
          } catch {}
        }
        const isProd = !!(
          import.meta && import.meta.env && import.meta.env.PROD
        );
        let frontend = import.meta.env.VITE_FRONTEND_URL;
        if (!frontend) {
          frontend = isProd
            ? "https://zixx.in"
            : `http://${window.location.hostname}:8282`;
        }
        try {
          const u = new URL(frontend);
          frontend = u.origin;
        } catch {}
        window.location.replace(`${frontend}/auth`);
      }
      return result;
    }
  }

  return result;
};

export const api = createApi({
  baseQuery: baseQueryWithReauth,
  reducerPath: "adminApi",
  tagTypes: [
    "User",
    "Products",
    "Customers",
    "Transactions",
    "Orders",
    "Geography",
    "Sales",
    "Admins",
    "Performance",
    "Dashboard",
    "Testimonials",
  ],
  endpoints: (build) => ({
    getUser: build.query({
      query: (id) => `admin/users/${id}`,
      providesTags: ["User"],
    }),

    getProducts: build.query({
      query: () => "clients/products",
      providesTags: ["Products"],
    }),

    getUsers: build.query({
      query: () => "admin/users",
      providesTags: ["User"],
    }),

    getCustomers: build.query({
      query: () => "admin/users",
      providesTags: ["Customers"],
    }),

    getTransactions: build.query({
      query: ({ page, pageSize, sort, search }) => ({
        url: "admin/transactions",
        method: "GET",
        params: { page, pageSize, sort, search },
      }),
      providesTags: ["Transactions"],
    }),

    getAdminOrders: build.query({
      query: () => ({ url: "admin/orders", method: "GET" }),
      providesTags: ["Orders"],
    }),

    verifyAdminOrder: build.mutation({
      query: ({ id, adminNotes } = {}) => ({
        url: `admin/orders/${id}/verify`,
        method: "PATCH",
        body: adminNotes ? { adminNotes } : undefined,
      }),
      invalidatesTags: ["Orders"],
    }),

    confirmAdminOrder: build.mutation({
      query: ({ id, trackingNumber, deliveryDate, adminNotes, carrier, carrierUrl, courierPhone, courierLogoUrl } = {}) => ({
        url: `admin/orders/${id}/confirm`,
        method: "PATCH",
        // include both carrier and courierName to be compatible with backend; also include extra courier details
        body: { trackingNumber, deliveryDate, adminNotes, carrier, courierName: carrier, carrierUrl, courierPhone, courierLogoUrl },
      }),
      invalidatesTags: ["Orders"],
    }),

    packAdminOrder: build.mutation({
      query: ({ id, adminNotes } = {}) => ({
        url: `admin/orders/${id}/pack`,
        method: "PATCH",
        body: adminNotes ? { adminNotes } : undefined,
      }),
      invalidatesTags: ["Orders"],
    }),

    deliverAdminOrder: build.mutation({
      query: ({ id, adminNotes } = {}) => ({
        url: `admin/orders/${id}/deliver`,
        method: "PATCH",
        body: adminNotes ? { adminNotes } : undefined,
      }),
      invalidatesTags: ["Orders"],
    }),

    outForDeliveryAdminOrder: build.mutation({
      query: ({ id, adminNotes } = {}) => ({
        url: `admin/orders/${id}/out-for-delivery`,
        method: "PATCH",
        body: adminNotes ? { adminNotes } : undefined,
      }),
      invalidatesTags: ["Orders"],
    }),

    collectAdminCODPayment: build.mutation({
      query: ({ id, amount, collectedByName, collectedById, notes, collectedAt } = {}) => ({
        url: `admin/orders/${id}/cod/collect`,
        method: "PATCH",
        body: { amount, collectedByName, collectedById, notes, collectedAt },
      }),
      invalidatesTags: ["Orders"],
    }),

    updateAdminOrderCourier: build.mutation({
      query: ({
        id,
        carrier,
        carrierUrl,
        courierPhone,
        courierLogoUrl,
        adminNotes,
      } = {}) => ({
        url: `admin/orders/${id}/courier`,
        method: "PATCH",
        body: { carrier, carrierUrl, courierPhone, courierLogoUrl, adminNotes },
      }),
      invalidatesTags: ["Orders"],
    }),

    uploadAdminOrderCourierLogo: build.mutation({
      query: ({ id, file } = {}) => {
        const form = new FormData();
        if (file) form.append("file", file);
        return {
          url: `admin/orders/${id}/courier/logo`,
          method: "POST",
          body: form,
        };
      },
      invalidatesTags: ["Orders"],
    }),

    refundAdminOrder: build.mutation({
      query: ({ id, amount } = {}) => ({
        url: `admin/orders/${id}/refund`,
        method: "POST",
        body: typeof amount === "number" ? { amount } : {},
      }),
      invalidatesTags: ["Orders"],
    }),

    deleteAdminOrder: build.mutation({
      query: ({ id } = {}) => ({
        url: `admin/orders/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Orders"],
    }),

    getAdminTransactions: build.query({
      query: ({ page, pageSize, sort, search } = {}) => ({
        url: "admin/transactions",
        method: "GET",
        params: { page, pageSize, sort, search },
      }),
      providesTags: ["Transactions"],
    }),

    backfillAdminTransactions: build.mutation({
      query: () => ({ url: "admin/transactions/backfill", method: "POST" }),
      invalidatesTags: ["Transactions"],
    }),

    updateAdminProduct: build.mutation({
      query: ({ id, body } = {}) => ({
        url: `admin/products/update/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Products"],
    }),

    // Create product (admin)
    addAdminProduct: build.mutation({
      query: ({ body } = {}) => ({
        url: `admin/products/add`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Products"],
    }),

    // Upload product image (admin)
    uploadAdminProductImage: build.mutation({
      query: ({ file } = {}) => {
        const form = new FormData();
        if (file) form.append("image", file);
        return {
          url: `admin/products/upload`,
          method: "POST",
          body: form,
        };
      },
    }),

    deleteAdminProduct: build.mutation({
      query: ({ id } = {}) => ({
        url: `admin/products/delete/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Products"],
    }),

    updateAdminUser: build.mutation({
      query: ({ id, body } = {}) => ({
        url: `admin/users/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Customers", "Admins", "User"],
    }),

    deleteAdminUser: build.mutation({
      query: ({ id } = {}) => ({
        url: `admin/users/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Customers", "Admins", "User"],
    }),

    getAdminUsers: build.query({
      query: () => ({ url: "admin/users", method: "GET" }),
      providesTags: ["Admins"],
    }),

    getClientsUsers: build.query({
      query: () => ({ url: "clients/users", method: "GET" }),
      providesTags: ["Customers"],
    }),

    getGeography: build.query({
      query: () => ({ url: "admin/geography", method: "GET" }),
      providesTags: ["Geography"],
    }),

    // 🔹 Fixed sales endpoint
    getSales: build.query({
      query: () => ({ url: "admin/sales", method: "GET" }),
      providesTags: ["Sales"],
    }),

    getAdmins: build.query({
      query: () => ({ url: "admin/allAdmins", method: "GET" }),
      providesTags: ["Admins"],
    }),

    getUserPerformance: build.query({
      query: (id) => ({ url: `admin/performance/${id}`, method: "GET" }),
      providesTags: ["Performance"],
    }),

    getDashboard: build.query({
      query: () => ({ url: "admin/dashboard", method: "GET" }),
      providesTags: ["Dashboard"],
    }),

    // Testimonials moderation (admin)
    getAdminTestimonials: build.query({
      query: ({ status = 'pending', page = 1, pageSize = 50, q = '', sortBy = 'createdAt', sortDir = 'desc' } = {}) => ({
        url: `admin/testimonials`,
        method: 'GET',
        params: { status, page, pageSize, q, sortBy, sortDir },
      }),
      providesTags: ["Testimonials"],
    }),
    approveAdminTestimonial: build.mutation({
      query: ({ id } = {}) => ({
        url: `admin/testimonials/${id}/approve`,
        method: 'PATCH',
      }),
      invalidatesTags: ["Testimonials"],
    }),
    updateAdminTestimonial: build.mutation({
      query: ({ id, name, text, rating } = {}) => ({
        url: `admin/testimonials/${id}`,
        method: 'PUT',
        body: { name, text, rating },
      }),
      invalidatesTags: ["Testimonials"],
    }),
    deleteAdminTestimonial: build.mutation({
      query: ({ id } = {}) => ({
        url: `admin/testimonials/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ["Testimonials"],
    }),

    // Get current admin user info
    getCurrentAdmin: build.query({
      query: () => ({
        url: "clients/user/me",
        method: "GET",
      }),
      providesTags: ["User"],
    }),
  }),
});

export const {
  useGetUserQuery,
  useGetProductsQuery,
  useGetUsersQuery,
  useGetCustomersQuery,
  useGetTransactionsQuery,
  useGetAdminOrdersQuery,
  useVerifyAdminOrderMutation,
  useConfirmAdminOrderMutation,
  usePackAdminOrderMutation,
  useDeliverAdminOrderMutation,
  useOutForDeliveryAdminOrderMutation,
  useCollectAdminCODPaymentMutation,
  useRefundAdminOrderMutation,
  useDeleteAdminOrderMutation,
  useUpdateAdminOrderCourierMutation,
  useUploadAdminOrderCourierLogoMutation,
  useUpdateAdminProductMutation,
  useAddAdminProductMutation,
  useUploadAdminProductImageMutation,
  useDeleteAdminProductMutation,
  useUpdateAdminUserMutation,
  useDeleteAdminUserMutation,
  useGetGeographyQuery,
  useGetSalesQuery,
  useGetAdminsQuery,
  useGetUserPerformanceQuery,
  useGetDashboardQuery,
  useGetAdminTestimonialsQuery,
  useApproveAdminTestimonialMutation,
  useUpdateAdminTestimonialMutation,
  useDeleteAdminTestimonialMutation,
  useGetAdminTransactionsQuery,
  useBackfillAdminTransactionsMutation,
  useGetAdminUsersQuery,
  useGetClientsUsersQuery,
  useGetCurrentAdminQuery,
} = api;
