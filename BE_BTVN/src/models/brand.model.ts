import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

export interface BrandAttributes {
  id?: number;
  name: string;
  imageUrl?: string | null;
}

interface BrandCreationAttributes extends Optional<BrandAttributes, "id"> {}

export class Brand
  extends Model<BrandAttributes, BrandCreationAttributes>
  implements BrandAttributes
{
  public id!: number;
  public name!: string;
  public imageUrl!: string | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Brand.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    imageUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "brands",
    timestamps: true,
  }
);

export default Brand;
