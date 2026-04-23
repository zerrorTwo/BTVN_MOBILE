import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";


export interface CategoryAttributes {
  id?: number;
  name: string;
  parentId?: number | null;
  description?: string | null;
  image?: string | null;
  isActive?: boolean;
}

interface CategoryCreationAttributes extends Optional<
  CategoryAttributes,
  "id"
> {}

export class Category
  extends Model<CategoryAttributes, CategoryCreationAttributes>
  implements CategoryAttributes
{
  public id!: number;
  public name!: string;
  public parentId!: number | null;
  public description!: string | null;
  public image!: string | null;
  public isActive!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Category.init(
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
    parentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "categories",
        key: "id",
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    image: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: "categories",
    timestamps: true,
  },
);


export interface ProductAttributes {
  id?: number;
  name: string;
  sku?: string;
  description?: string | null;
  price: number;
  originalPrice?: number | null;
  image?: string | null;
  images?: string | null; // JSON array of image URLs
  categoryId?: number | null;
  brandId?: number | null;
  attributes?: any | null;
  stock?: number;
  sold?: number;
  rating?: number;
  ratingCount?: number;
  isActive?: boolean;
}

interface ProductCreationAttributes extends Optional<ProductAttributes, "id"> {}

export class Product
  extends Model<ProductAttributes, ProductCreationAttributes>
  implements ProductAttributes
{
  public id!: number;
  public name!: string;
  public sku!: string;
  public description!: string | null;
  public price!: number;
  public originalPrice!: number | null;
  public image!: string | null;
  public images!: string | null;
  public categoryId!: number | null;
  public brandId!: number | null;
  public attributes!: any | null;
  public stock!: number;
  public sold!: number;
  public rating!: number;
  public ratingCount!: number;
  public isActive!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public readonly category?: Category;
  public readonly brand?: {
    id: number;
    name: string;
    imageUrl: string | null;
  };
}

Product.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    sku: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    price: {
      type: DataTypes.DECIMAL(12, 0),
      allowNull: false,
    },
    originalPrice: {
      type: DataTypes.DECIMAL(12, 0),
      allowNull: true,
    },
    image: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    images: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "JSON array of image URLs",
    },
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "categories",
        key: "id",
      },
    },
    brandId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "brands",
        key: "id",
      },
    },
    attributes: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: "JSON object for product specs",
    },
    stock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    sold: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    rating: {
      type: DataTypes.DECIMAL(2, 1),
      allowNull: false,
      defaultValue: 0,
    },
    ratingCount: {
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
    tableName: "products",
    timestamps: true,
  },
);


Product.belongsTo(Category, {
  foreignKey: "categoryId",
  as: "category",
});

Category.hasMany(Product, {
  foreignKey: "categoryId",
  as: "products",
});

export default { Product, Category };
