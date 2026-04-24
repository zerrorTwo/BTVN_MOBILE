import dotenv from "dotenv";
dotenv.config();

import { connectDatabase } from "./config/database";
import { Coupon, CouponType } from "./models/coupon.model";

const seedCoupons = async () => {
  try {
    await connectDatabase();
    
    // Clear existing coupons
    await Coupon.destroy({ where: {} });

    const coupons = [
      {
        code: "WELCOME10",
        type: CouponType.PERCENT,
        value: 10,
        minOrderValue: 100000,
        maxDiscountValue: 50000,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days later
        usageLimit: 100,
        usedCount: 0,
        isActive: true,
      },
      {
        code: "GIAM50K",
        type: CouponType.AMOUNT,
        value: 50000,
        minOrderValue: 500000,
        maxDiscountValue: null,
        startDate: new Date(),
        endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days later
        usageLimit: 50,
        usedCount: 0,
        isActive: true,
      },
      {
        code: "FREESHIP",
        type: CouponType.AMOUNT,
        value: 30000,
        minOrderValue: 0,
        maxDiscountValue: null,
        startDate: new Date(),
        endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days later
        usageLimit: 1000,
        usedCount: 0,
        isActive: true,
      }
    ];

    await Coupon.bulkCreate(coupons);

    console.log("🎉 Coupon seeding completed!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Coupon seeding failed:", error);
    process.exit(1);
  }
};

seedCoupons();
