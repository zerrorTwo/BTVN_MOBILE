import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";

export interface UserAttributes {
  id?: number;
  name: string;
  email: string;
  password: string;
  phone?: string | null;
  avatar?: string | null;
  isVerified?: boolean;
  otp?: string | null;
  otpExpiry?: Date | null;
  otpPurpose?:
    | "REGISTER"
    | "RESET_PASSWORD"
    | "CHANGE_EMAIL"
    | "CHANGE_PHONE"
    | null;
  pendingEmail?: string | null;
  pendingPhone?: string | null;
  role?: "USER" | "ADMIN";
}

class User extends Model<UserAttributes> implements UserAttributes {
  public id!: number;
  public name!: string;
  public email!: string;
  public password!: string;
  public phone!: string | null;
  public avatar!: string | null;
  public isVerified!: boolean;
  public otp!: string | null;
  public otpExpiry!: Date | null;
  public otpPurpose!:
    | "REGISTER"
    | "RESET_PASSWORD"
    | "CHANGE_EMAIL"
    | "CHANGE_PHONE"
    | null;
  public pendingEmail!: string | null;
  public pendingPhone!: string | null;
  public role!: "USER" | "ADMIN";

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

User.init(
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
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      unique: true,
      defaultValue: null,
    },
    avatar: {
      type: DataTypes.TEXT("long"),
      allowNull: true,
      defaultValue: null,
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    otp: {
      type: DataTypes.STRING(6),
      allowNull: true,
      defaultValue: null,
    },
    otpExpiry: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    otpPurpose: {
      type: DataTypes.ENUM(
        "REGISTER",
        "RESET_PASSWORD",
        "CHANGE_EMAIL",
        "CHANGE_PHONE",
      ),
      allowNull: true,
      defaultValue: null,
    },
    pendingEmail: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: null,
    },
    pendingPhone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: null,
    },
    role: {
      type: DataTypes.ENUM("USER", "ADMIN"),
      allowNull: false,
      defaultValue: "USER",
    },
  },
  {
    sequelize,
    tableName: "users",
    timestamps: true,
  },
);

export default User;
