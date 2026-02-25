import dotenv from "dotenv";
dotenv.config();

import sequelize from "./config/database";

/**
 * Script to fix "Too many keys" error on users table.
 * Removes duplicate UNIQUE indexes on email and phone columns.
 */
const fixIndexes = async () => {
  try {
    await sequelize.authenticate();
    console.log("Connected to database.");

    // Get all indexes on the users table
    const [indexes] = (await sequelize.query(
      "SHOW INDEX FROM users WHERE Key_name != 'PRIMARY'",
    )) as [any[], unknown];

    console.log(`Found ${indexes.length} index entries on users table.`);

    // Group indexes by Key_name
    const indexNames = [...new Set(indexes.map((idx: any) => idx.Key_name))];
    console.log("Index names:", indexNames);

    // Keep only the first unique index for email and phone, drop the rest
    const emailIndexes = indexNames.filter((name: string) =>
      name.toLowerCase().includes("email"),
    );
    const phoneIndexes = indexNames.filter((name: string) =>
      name.toLowerCase().includes("phone"),
    );

    // Drop all duplicate email indexes (keep the first one)
    for (let i = 1; i < emailIndexes.length; i++) {
      console.log(`Dropping duplicate email index: ${emailIndexes[i]}`);
      await sequelize.query(
        `ALTER TABLE users DROP INDEX \`${emailIndexes[i]}\``,
      );
    }

    // Drop all duplicate phone indexes (keep the first one)
    for (let i = 1; i < phoneIndexes.length; i++) {
      console.log(`Dropping duplicate phone index: ${phoneIndexes[i]}`);
      await sequelize.query(
        `ALTER TABLE users DROP INDEX \`${phoneIndexes[i]}\``,
      );
    }

    // Also drop any generic numbered indexes (email_2, email_3, etc.)
    const genericDupes = indexNames.filter((name: string) =>
      /^(email|phone)_\d+$/.test(name),
    );
    for (const idx of genericDupes) {
      try {
        console.log(`Dropping generic duplicate index: ${idx}`);
        await sequelize.query(`ALTER TABLE users DROP INDEX \`${idx}\``);
      } catch (e) {
        // Already dropped
      }
    }

    // Verify remaining indexes
    const [remaining] = (await sequelize.query("SHOW INDEX FROM users")) as [
      any[],
      unknown,
    ];
    const remainingNames = [
      ...new Set(remaining.map((idx: any) => idx.Key_name)),
    ];
    console.log(`\n✅ Fixed! Remaining indexes: ${remainingNames.join(", ")}`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

fixIndexes();
