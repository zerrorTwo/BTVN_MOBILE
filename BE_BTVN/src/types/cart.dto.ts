export interface AddToCartDto {
  productId: number;
  quantity: number;
}

export interface UpdateCartItemDto {
  quantity: number;
}

export interface CartItemResponse {
  id: number;
  quantity: number;
  product: {
    id: number;
    name: string;
    price: number;
    originalPrice: number | null;
    image: string | null;
    stock: number;
  };
  itemTotal: number;
}

export interface CartResponse {
  id: number;
  items: CartItemResponse[];
  subtotal: number;
  itemCount: number;
}
