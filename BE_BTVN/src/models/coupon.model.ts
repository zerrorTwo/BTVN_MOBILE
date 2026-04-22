import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

export enum CouponType {
  PERCENT = "PERCENT",
  AMOUNT = "AMOUNT",
}

export interface CouponAttributes {
  id?: number;
  code: string;
  type: CouponType;
  value: number;
  minOrderValue: number;
  maxDiscountValue?: number | null;
  startDate: Date;
  endDate: Date;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
}

interface CouponCreationAttributes
  extends Optional<CouponAttributes, "id" | "usedCount" | "isActive"> {}

export class Coupon
  extends Model<CouponAttributes, CouponCreationAttributes>
  implements CouponAttributes
{
  public id!: number;
  public code!: string;
  public type!: CouponType;
  public value!: number;
  public minOrderValue!: number;
  public maxDiscountValue!: number | null;
  public startDate!: Date;
  public endDate!: Date;
  public usageLimit!: number;
  public usedCount!: number;
  public isActive!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Coupon.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    type: {
      type: DataTypes.ENUM(...Object.values(CouponType)),
      allowNull: false,
    },
    value: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    minOrderValue: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    maxDiscountValue: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      defaultValue: null,
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    usageLimit: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 100,
    },
    usedCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: "coupons",
    timestamps: true,
  },
);

export default Coupon;
