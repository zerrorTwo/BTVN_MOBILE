import { Coupon, CouponType } from "../models/coupon.model";
import { Op } from "sequelize";

export interface ValidateCouponResult {
  isValid: boolean;
  message?: string;
  discountAmount: number;
  coupon?: Coupon;
}

export async function validateCoupon(
  code: string,
  orderTotal: number,
): Promise<ValidateCouponResult> {
  const coupon = await Coupon.findOne({
    where: {
      code: code.trim().toUpperCase(),
      isActive: true,
      startDate: { [Op.lte]: new Date() },
      endDate: { [Op.gte]: new Date() },
    },
  });

  if (!coupon) {
    return {
      isValid: false,
      message: "Mã khuyến mãi không tồn tại hoặc đã hết hạn",
      discountAmount: 0,
    };
  }

  if (coupon.usedCount >= coupon.usageLimit) {
    return {
      isValid: false,
      message: "Mã khuyến mãi đã hết lượt sử dụng",
      discountAmount: 0,
    };
  }

  if (orderTotal < coupon.minOrderValue) {
    return {
      isValid: false,
      message: `Đơn hàng tối thiểu ${coupon.minOrderValue.toLocaleString()}đ để sử dụng mã này`,
      discountAmount: 0,
    };
  }

  let discountAmount = 0;
  if (coupon.type === CouponType.PERCENT) {
    discountAmount = (orderTotal * coupon.value) / 100;
    if (coupon.maxDiscountValue && discountAmount > coupon.maxDiscountValue) {
      discountAmount = coupon.maxDiscountValue;
    }
  } else {
    discountAmount = coupon.value;
  }

  // Ensure discount doesn't exceed order total
  if (discountAmount > orderTotal) {
    discountAmount = orderTotal;
  }

  return {
    isValid: true,
    message: "Áp dụng mã khuyến mãi thành công",
    discountAmount: Math.round(discountAmount),
    coupon,
  };
}
