export enum OrderStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  PREPARING = "PREPARING",
  SHIPPING = "SHIPPING",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  CANCEL_REQUESTED = "CANCEL_REQUESTED",
}

export enum PaymentMethod {
  COD = "COD",
  MOMO = "MOMO",
  VNPAY = "VNPAY",
  ZALOPAY = "ZALOPAY",
}

export enum PaymentStatus {
  UNPAID = "UNPAID",
  PAID = "PAID",
  FAILED = "FAILED",
  REFUNDED = "REFUNDED",
}

export interface OrderItem {
  id: number;
  quantity: number;
  unitPrice: number;
  product: {
    id: number;
    name: string;
    image: string | null;
  };
}

export interface Order {
  id: number;
  orderCode: string;
  total: number;
  discount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  transId?: string | null;
  status: OrderStatus;
  canCancel: "direct" | "request" | "none";
  shippingAddress: string;
  receiverName: string;
  receiverPhone: string;
  note?: string | null;
  cancellationReason?: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

export interface CheckoutRequest {
  paymentMethod: PaymentMethod;
  shippingAddress: string;
  receiverName: string;
  receiverPhone: string;
  note?: string;
}

export interface CheckoutResponse {
  success: boolean;
  message: string;
  data?: {
    orderId: number;
    orderCode: string;
    total: number;
    status: OrderStatus;
    paymentStatus: PaymentStatus;
    paymentMethod: PaymentMethod;
    payUrl?: string;
    deeplink?: string;
    qrCodeUrl?: string;
  };
}

export interface InitMomoResponse {
  success: boolean;
  data?: {
    orderId: number;
    payUrl?: string;
    deeplink?: string;
    qrCodeUrl?: string;
  };
}

export interface OrderListResponse {
  success: boolean;
  data: Order[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface OrderDetailResponse {
  success: boolean;
  data: Order;
}

export interface CancelOrderRequest {
  cancellationReason: string;
}

export interface CancelOrderResponse {
  success: boolean;
  message: string;
  data?: {
    status: OrderStatus;
  };
}
