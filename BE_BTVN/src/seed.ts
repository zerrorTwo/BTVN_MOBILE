import dotenv from "dotenv";
dotenv.config();

import { connectDatabase } from "./config/database";
import { Category, Product } from "./models/product.model";
import seedProducts from "./utils/seeder";

const isForce = process.argv.includes("--force");

const runSeed = async () => {
  try {
    await connectDatabase();

    // Sync models
    await Category.sync();
    await Product.sync();

    // If --force flag, delete existing data first
    if (isForce) {
      console.log("⚠️  Force mode: deleting existing data...");
      await Product.destroy({ where: {} });
      await Category.destroy({ where: {} });
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
