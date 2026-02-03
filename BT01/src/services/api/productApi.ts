import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "../../store";

// ============================================================================
// Types / DTOs
// ============================================================================

export interface ProductListItem {
  id: number;
  name: string;
  price: number;
  originalPrice: number | null;
  image: string | null;
  rating: number;
  ratingCount: number;
  sold: number;
  categoryId: number | null;
  categoryName?: string;
}

export interface DiscountedProduct extends ProductListItem {
  discountPercent: number;
}

export interface ProductDetail extends ProductListItem {
  description: string | null;
  images: string[];
  stock: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryItem {
  id: number;
  name: string;
  description: string | null;
  image: string | null;
  productCount?: number;
}

export interface ProductListResponse {
  success: boolean;
  message: string;
  data: {
    products: ProductListItem[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface ProductDetailResponse {
  success: boolean;
  message: string;
  product?: ProductDetail;
}

export interface CategoryListResponse {
  success: boolean;
  message: string;
  categories: CategoryItem[];
}

export interface FeaturedProductsResponse {
  success: boolean;
  message: string;
  data: {
    topRated: ProductListItem[];
    bestSellers: ProductListItem[];
    newest: ProductListItem[];
  };
}

export interface BestSellersResponse {
  success: boolean;
  message: string;
  products: ProductListItem[];
}

export interface DiscountedProductsResponse {
  success: boolean;
  message: string;
  products: DiscountedProduct[];
}

export interface ProductQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: number;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: "price" | "rating" | "sold" | "createdAt";
  sortOrder?: "asc" | "desc";
}

// ============================================================================
// API Configuration
// ============================================================================

const API_BASE_URL = "http://10.0.2.2:5000";

const baseQueryWithLogging = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token;
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

// ============================================================================
// Product API
// ============================================================================

export const productApi = createApi({
  reducerPath: "productApi",
  baseQuery: baseQueryWithLogging,
  tagTypes: ["Products", "Categories"],
  endpoints: (builder) => ({
    // Get all products with search, filter, pagination
    getProducts: builder.query<ProductListResponse, ProductQueryParams>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params.page) searchParams.set("page", String(params.page));
        if (params.limit) searchParams.set("limit", String(params.limit));
        if (params.search) searchParams.set("search", params.search);
        if (params.categoryId)
          searchParams.set("categoryId", String(params.categoryId));
        if (params.minPrice)
          searchParams.set("minPrice", String(params.minPrice));
        if (params.maxPrice)
          searchParams.set("maxPrice", String(params.maxPrice));
        if (params.sortBy) searchParams.set("sortBy", params.sortBy);
        if (params.sortOrder) searchParams.set("sortOrder", params.sortOrder);

        return `/api/products?${searchParams.toString()}`;
      },
      providesTags: ["Products"],
    }),

    // Get product detail by ID
    getProductById: builder.query<ProductDetailResponse, number>({
      query: (id) => `/api/products/${id}`,
    }),

    // Get all categories
    getCategories: builder.query<CategoryListResponse, void>({
      query: () => "/api/products/categories/all",
      providesTags: ["Categories"],
    }),

    // Get featured products
    getFeaturedProducts: builder.query<FeaturedProductsResponse, number | void>(
      {
        query: (limit) =>
          `/api/products/featured${limit ? `?limit=${limit}` : ""}`,
      },
    ),

    // Get top 10 best selling products
    getBestSellers: builder.query<BestSellersResponse, number | void>({
      query: (limit) =>
        `/api/products/best-sellers${limit ? `?limit=${limit}` : ""}`,
    }),

    // Get top 20 discounted products
    getDiscountedProducts: builder.query<
      DiscountedProductsResponse,
      number | void
    >({
      query: (limit) =>
        `/api/products/discounted${limit ? `?limit=${limit}` : ""}`,
    }),
  }),
});

// Export hooks
export const {
  useGetProductsQuery,
  useGetProductByIdQuery,
  useGetCategoriesQuery,
  useGetFeaturedProductsQuery,
  useGetBestSellersQuery,
  useGetDiscountedProductsQuery,
} = productApi;
