// Product DTOs - Data Transfer Objects for Product API

/**
 * Product item for list display
 */
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

/**
 * Product detail
 */
export interface ProductDetail extends ProductListItem {
  description: string | null;
  images: string[];
  stock: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Category item
 */
export interface CategoryItem {
  id: number;
  name: string;
  description: string | null;
  image: string | null;
  productCount?: number;
}

/**
 * Product list response with pagination
 */
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

/**
 * Product detail response
 */
export interface ProductDetailResponse {
  success: boolean;
  message: string;
  product?: ProductDetail;
}

/**
 * Category list response
 */
export interface CategoryListResponse {
  success: boolean;
  message: string;
  categories: CategoryItem[];
}

/**
 * Search/Filter query params
 */
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
