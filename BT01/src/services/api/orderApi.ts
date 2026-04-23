import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "../../store";
import type {
  CheckoutRequest,
  CheckoutResponse,
  OrderListResponse,
  OrderDetailResponse,
  CancelOrderRequest,
  CancelOrderResponse,
  InitMomoResponse,
} from "../../types/order.types";
import { API_BASE_URL } from "../../config";

const baseQueryWithAuth = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token;
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

export const orderApi = createApi({
  reducerPath: "orderApi",
  baseQuery: baseQueryWithAuth,
  tagTypes: ["Orders", "OrderDetail"],
  endpoints: (builder) => ({
    checkout: builder.mutation<CheckoutResponse, CheckoutRequest>({
      query: (body) => ({
        url: "/api/v1/orders",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Orders"],
    }),

    getOrders: builder.query<
      OrderListResponse,
      { page?: number; limit?: number }
    >({
      query: ({ page = 1, limit = 10 }) =>
        `/api/v1/orders?page=${page}&limit=${limit}`,
      providesTags: ["Orders"],
    }),

    getOrderById: builder.query<OrderDetailResponse, number>({
      query: (id) => `/api/v1/orders/${id}`,
      providesTags: (result, error, id) => [{ type: "OrderDetail", id }],
    }),

    cancelOrder: builder.mutation<
      CancelOrderResponse,
      { id: number; data: CancelOrderRequest }
    >({
      query: ({ id, data }) => ({
        url: `/api/v1/orders/${id}/cancel`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        "Orders",
        { type: "OrderDetail", id },
      ],
    }),

    requestCancelOrder: builder.mutation<
      CancelOrderResponse,
      { id: number; data: CancelOrderRequest }
    >({
      query: ({ id, data }) => ({
        url: `/api/v1/orders/${id}/request-cancel`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        "Orders",
        { type: "OrderDetail", id },
      ],
    }),

    initMomoPayment: builder.mutation<InitMomoResponse, number>({
      query: (orderId) => ({
        url: `/api/v1/payments/momo/init/${orderId}`,
        method: "POST",
      }),
    }),
  }),
});

export const {
  useCheckoutMutation,
  useGetOrdersQuery,
  useGetOrderByIdQuery,
  useCancelOrderMutation,
  useRequestCancelOrderMutation,
  useInitMomoPaymentMutation,
} = orderApi;
