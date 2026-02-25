import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

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

export interface OrderAttributes {
  id?: number;
  userId: number;
  orderCode: string;
  total: number;
  discount: number;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  shippingAddress: string;
  receiverName: string;
  receiverPhone: string;
  note?: string | null;
  cancellationReason?: string | null;
}

interface OrderCreationAttributes extends Optional<OrderAttributes, "id"> {}

export class Order
  extends Model<OrderAttributes, OrderCreationAttributes>
  implements OrderAttributes
{
  public id!: number;
  public userId!: number;
  public orderCode!: string;
  public total!: number;
  public discount!: number;
  public paymentMethod!: PaymentMethod;
  public status!: OrderStatus;
  public shippingAddress!: string;
  public receiverName!: string;
  public receiverPhone!: string;
  public note!: string | null;
  public cancellationReason!: string | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Order.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    orderCode: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    total: {
      type: DataTypes.DECIMAL(12, 0),
      allowNull: false,
    },
    discount: {
      type: DataTypes.DECIMAL(12, 0),
      allowNull: false,
      defaultValue: 0,
    },
    paymentMethod: {
      type: DataTypes.ENUM(...Object.values(PaymentMethod)),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(OrderStatus)),
      allowNull: false,
      defaultValue: OrderStatus.PENDING,
    },
    shippingAddress: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    receiverName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    receiverPhone: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },
    cancellationReason: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    sequelize,
    tableName: "orders",
    timestamps: true,
  },
);

export default Order;
