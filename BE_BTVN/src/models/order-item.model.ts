import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

export interface OrderItemAttributes {
  id?: number;
  orderId: number;
  productId: number;
  quantity: number;
  unitPrice: number;
}

interface OrderItemCreationAttributes extends Optional<
  OrderItemAttributes,
  "id"
> {}

export class OrderItem
  extends Model<OrderItemAttributes, OrderItemCreationAttributes>
  implements OrderItemAttributes
{
  public id!: number;
  public orderId!: number;
  public productId!: number;
  public quantity!: number;
  public unitPrice!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

OrderItem.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    orderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "orders",
        key: "id",
      },
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "products",
        key: "id",
      },
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    unitPrice: {
      type: DataTypes.DECIMAL(12, 0),
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "order_items",
    timestamps: true,
  },
);

export default OrderItem;
