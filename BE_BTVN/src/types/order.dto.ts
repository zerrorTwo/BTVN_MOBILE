import { OrderStatus, PaymentMethod } from "../models/order.model";

export interface CreateOrderDto {
  paymentMethod: PaymentMethod;
  shippingAddress: string;
  receiverName: string;
  receiverPhone: string;
  note?: string;
}

export interface OrderItemResponse {
  id: number;
  quantity: number;
  unitPrice: number;
  product: {
    id: number;
    name: string;
    image: string | null;
  };
}

export interface OrderResponse {
  id: number;
  orderCode: string;
  total: number;
  discount: number;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  shippingAddress: string;
  receiverName: string;
  receiverPhone: string;
  note: string | null;
  cancellationReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  items: OrderItemResponse[];
}

export interface UpdateOrderStatusDto {
  status: OrderStatus;
  note?: string;
}

export interface CancelOrderDto {
  cancellationReason: string;
}
