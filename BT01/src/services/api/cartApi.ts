import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "../../store";
import type {
  CartResponse,
  AddToCartRequest,
  AddToCartResponse,
  UpdateCartItemRequest,
  DeleteCartItemResponse,
} from "../../types/cart.types";
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

export const cartApi = createApi({
  reducerPath: "cartApi",
  baseQuery: baseQueryWithAuth,
  tagTypes: ["Cart"],
  endpoints: (builder) => ({
    getCart: builder.query<CartResponse, void>({
      query: () => "/api/v1/cart",
      providesTags: ["Cart"],
    }),

    addToCart: builder.mutation<AddToCartResponse, AddToCartRequest>({
      query: (body) => ({
        url: "/api/v1/cart/add",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Cart"],
    }),

    updateCartItem: builder.mutation<
      CartResponse,
      { itemId: number; data: UpdateCartItemRequest }
    >({
      query: ({ itemId, data }) => ({
        url: `/api/v1/cart/item/${itemId}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Cart"],
    }),

    removeCartItem: builder.mutation<DeleteCartItemResponse, number>({
      query: (itemId) => ({
        url: `/api/v1/cart/item/${itemId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Cart"],
    }),

    clearCart: builder.mutation<DeleteCartItemResponse, void>({
      query: () => ({
        url: "/api/v1/cart/clear",
        method: "DELETE",
      }),
      invalidatesTags: ["Cart"],
    }),
  }),
});

export const {
  useGetCartQuery,
  useAddToCartMutation,
  useUpdateCartItemMutation,
  useRemoveCartItemMutation,
  useClearCartMutation,
} = cartApi;
