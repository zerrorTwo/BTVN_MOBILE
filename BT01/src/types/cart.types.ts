export interface CartItem {
  id: number;
  productId: number;
  quantity: number;
  product: {
    id: number;
    name: string;
    price: number;
    image: string | null;
    stock: number;
  };
  itemTotal: number;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  itemCount: number;
}

export interface AddToCartRequest {
  productId: number;
  quantity: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}

export interface CartResponse {
  success: boolean;
  message: string;
  data?: Cart;
}

export interface AddToCartResponse {
  success: boolean;
  message: string;
  data?: {
    itemId: number;
    quantity: number;
  };
}

export interface DeleteCartItemResponse {
  success: boolean;
  message: string;
}
