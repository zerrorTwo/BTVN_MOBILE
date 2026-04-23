import dotenv from "dotenv";
dotenv.config();

import { connectDatabase } from "./config/database";
import { Category, Product } from "./models/product.model";
import Brand from "./models/brand.model";
import { CartItem, Order, OrderItem, Review } from "./models";
import seedProducts from "./utils/seeder";

const isForce = process.argv.includes("--force");

const safeDestroy = async (model: {
  destroy: (args: { where: {} }) => Promise<unknown>;
}) => {
  try {
    await model.destroy({ where: {} });
  } catch (error: any) {
    if (
      error?.name === "SequelizeDatabaseError" &&
      error?.original?.code === "ER_NO_SUCH_TABLE"
    ) {
      return;
    }
    throw error;
  }
};

const runSeed = async () => {
  try {
    await connectDatabase();

    // Sync models
    await Brand.sync({ alter: true });
    await Category.sync({ alter: true });
    await Product.sync({ alter: true });

    // If --force flag, delete existing data first
    if (isForce) {
      console.log("⚠️  Force mode: deleting existing data...");
      await safeDestroy(OrderItem);
      await safeDestroy(Review);
      await safeDestroy(CartItem);
      await safeDestroy(Order);
      await safeDestroy(Product);
      await safeDestroy(Category);
      await safeDestroy(Brand);
      console.log("🗑️  Existing data deleted.");
    }

    // Run seeder
    await seedProducts();

    console.log("🎉 Seeding completed!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
};

runSeed();
