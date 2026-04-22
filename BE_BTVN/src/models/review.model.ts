import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

export interface ReviewAttributes {
  id?: number;
  userId: number;
  productId: number;
  rating: number;
  comment: string;
  isVisible: boolean;
  adminReply?: string | null;
}

interface ReviewCreationAttributes
  extends Optional<ReviewAttributes, "id" | "isVisible" | "adminReply"> {}

export class Review
  extends Model<ReviewAttributes, ReviewCreationAttributes>
  implements ReviewAttributes
{
  public id!: number;
  public userId!: number;
  public productId!: number;
  public rating!: number;
  public comment!: string;
  public isVisible!: boolean;
  public adminReply!: string | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Review.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "users", key: "id" },
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "products", key: "id" },
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1, max: 5 },
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    isVisible: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    adminReply: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    sequelize,
    tableName: "reviews",
    timestamps: true,
  },
);

export default Review;
