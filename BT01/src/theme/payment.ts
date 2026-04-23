import { colors } from "./colors";
import { PaymentMethod, PaymentStatus } from "../types/order.types";

export const PAYMENT_METHOD_META: Record<
  PaymentMethod,
  {
    label: string;
    shortLabel: string;
    color: string;
    softBg: string;
    icon: string; // Ionicons name
    enabled: boolean;
  }
> = {
  [PaymentMethod.COD]: {
    label: "Thanh toán khi nhận hàng",
    shortLabel: "COD",
    color: colors.provider.cod,
    softBg: "#E8F7F3",
    icon: "cash-outline",
    enabled: true,
  },
  [PaymentMethod.MOMO]: {
    label: "Ví MoMo",
    shortLabel: "MoMo",
    color: colors.provider.momo,
    softBg: colors.provider.momoSoft,
    icon: "wallet-outline",
    enabled: true,
  },
  [PaymentMethod.VNPAY]: {
    label: "VNPay",
    shortLabel: "VNPay",
    color: colors.provider.vnpay,
    softBg: "#E0EEF9",
    icon: "card-outline",
    enabled: false,
  },
  [PaymentMethod.ZALOPAY]: {
    label: "ZaloPay",
    shortLabel: "ZaloPay",
    color: colors.provider.zalopay,
    softBg: "#E0ECFF",
    icon: "card-outline",
    enabled: false,
  },
};

export const PAYMENT_STATUS_META: Record<
  PaymentStatus,
  { label: string; color: string; softBg: string; icon: string }
> = {
  [PaymentStatus.UNPAID]: {
    label: "Chưa thanh toán",
    color: colors.payment.unpaid,
    softBg: "#FFF4E5",
    icon: "time-outline",
  },
  [PaymentStatus.PAID]: {
    label: "Đã thanh toán",
    color: colors.payment.paid,
    softBg: "#E8F7F3",
    icon: "checkmark-circle",
  },
  [PaymentStatus.FAILED]: {
    label: "Thanh toán thất bại",
    color: colors.payment.failed,
    softBg: "#FDE8E7",
    icon: "close-circle",
  },
  [PaymentStatus.REFUNDED]: {
    label: "Đã hoàn tiền",
    color: colors.payment.refunded,
    softBg: "#F0F0F0",
    icon: "arrow-undo-circle",
  },
};
