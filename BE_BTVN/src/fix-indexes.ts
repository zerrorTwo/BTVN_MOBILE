import dotenv from "dotenv";
dotenv.config();

import sequelize from "./config/database";

/**
 * Script to fix "Too many keys" error on users table.
 * Removes redundant indexes to bring the count well below the 64-index limit.
 */
const fixIndexes = async () => {
  try {
    await sequelize.authenticate();
    console.log("Connected to database.");

    // Get all indexes on the users table
    const [indexes] = (await sequelize.query(
      "SHOW INDEX FROM users",
    )) as [any[], unknown];

    console.log(`Found ${indexes.length} index entries on users table.`);

    // Group indexes by Key_name
    const indexNames = [...new Set(indexes.map((idx: any) => idx.Key_name))];
    console.log("Current index names:", indexNames);

    if (indexNames.length >= 50) {
      console.log("⚠️ Index count is high. Dropping all non-primary indexes to reset...");
      for (const name of indexNames) {
        if (name === 'PRIMARY') continue;
        try {
          console.log(`Dropping index: ${name}`);
          await sequelize.query(`ALTER TABLE users DROP INDEX \`${name}\``);
        } catch (e: any) {
          console.error(`Could not drop ${name}: ${e.message}`);
        }
      }
    } else {
      // Selective drop for email and phone duplicates
      const emailIndexes = indexNames.filter((name: string) =>
        name.toLowerCase().includes("email")
      );
      const phoneIndexes = indexNames.filter((name: string) =>
        name.toLowerCase().includes("phone")
      );

      // Drop all but the first email index
      for (let i = 1; i < emailIndexes.length; i++) {
        console.log(`Dropping duplicate email index: ${emailIndexes[i]}`);
        await sequelize.query(`ALTER TABLE users DROP INDEX \`${emailIndexes[i]}\``);
      }

      // Drop all but the first phone index
      for (let i = 1; i < phoneIndexes.length; i++) {
        console.log(`Dropping duplicate phone index: ${phoneIndexes[i]}`);
        await sequelize.query(`ALTER TABLE users DROP INDEX \`${phoneIndexes[i]}\``);
      }

      // Also drop generic numbered ones
      const genericDupes = indexNames.filter((name: string) =>
        /^(email|phone)_\d+$/.test(name) || /^(users)_email_unique_\d+$/.test(name)
      );
      for (const idx of genericDupes) {
        try {
          console.log(`Dropping generic duplicate index: ${idx}`);
          await sequelize.query(`ALTER TABLE users DROP INDEX \`${idx}\``);
        } catch (e) {}
      }
    }

    // Verify remaining indexes
    const [remaining] = (await sequelize.query("SHOW INDEX FROM users")) as [any[], unknown];
    const remainingNames = [...new Set(remaining.map((idx: any) => idx.Key_name))];
    console.log(`\n✅ Fixed! Remaining indexes: ${remainingNames.join(", ")}`);
    console.log("You can now run 'npm run dev' to sync correctly.");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

fixIndexes();
