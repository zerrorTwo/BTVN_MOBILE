import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

export enum PaymentProvider {
  MOMO = "MOMO",
  VNPAY = "VNPAY",
  ZALOPAY = "ZALOPAY",
}

export enum PaymentTxnStatus {
  PENDING = "PENDING",
  SUCCESS = "SUCCESS",
  FAILED = "FAILED",
}

export interface PaymentAttributes {
  id?: number;
  orderId: number;
  provider: PaymentProvider;
  requestId: string;
  amount: number;
  status: PaymentTxnStatus;
  transId?: string | null;
  resultCode?: number | null;
  message?: string | null;
  rawRequest?: string | null;
  rawResponse?: string | null;
}

interface PaymentCreationAttributes extends Optional<PaymentAttributes, "id"> {}

export class Payment
  extends Model<PaymentAttributes, PaymentCreationAttributes>
  implements PaymentAttributes
{
  public id!: number;
  public orderId!: number;
  public provider!: PaymentProvider;
  public requestId!: string;
  public amount!: number;
  public status!: PaymentTxnStatus;
  public transId!: string | null;
  public resultCode!: number | null;
  public message!: string | null;
  public rawRequest!: string | null;
  public rawResponse!: string | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Payment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    orderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "orders", key: "id" },
    },
    provider: {
      type: DataTypes.ENUM(...Object.values(PaymentProvider)),
      allowNull: false,
    },
    requestId: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    amount: {
      type: DataTypes.DECIMAL(12, 0),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(PaymentTxnStatus)),
      allowNull: false,
      defaultValue: PaymentTxnStatus.PENDING,
    },
    transId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: null,
    },
    resultCode: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    },
    message: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null,
    },
    rawRequest: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },
    rawResponse: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    sequelize,
    tableName: "payments",
    timestamps: true,
  },
);

export default Payment;
