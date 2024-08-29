import { Pool } from "pg";
import chalk from "chalk";
import fs from "fs";
import path from "path";

export const pool = new Pool({
    user: "me",
    host: "localhost",
    database: "pinpal",
    password: "password",
    port: 5432
});

// Read the contents of the user.schema.sql file
const schemaFilePath = path.resolve(__dirname, "schema/user.schema.sql");
const schemaSQL = fs.readFileSync(schemaFilePath, "utf-8");

// Create tables defined in the schema
const createTables = async () => {
    try {
      // Check if the users table already exists
      const usersResult = await pool.query(`
        SELECT EXISTS (
          SELECT * FROM information_schema.tables
          WHERE table_schema = 'users' AND table_name = 'users'
        )
      `);
      // Check if the pins table already exists
      const pinsResult = await pool.query(`
        SELECT EXISTS (
          SELECT * FROM information_schema.tables
          WHERE table_schema = 'users' AND table_name = 'pins'
        )
      `);

      const usersTableExists = usersResult.rows[0].exists;
      const pinsTableExists = pinsResult.rows[0].exists;
      if (!usersTableExists || !pinsTableExists) {
        // Create tables
        await pool.query(schemaSQL);
        console.log(chalk.greenBright("Tables created successfully"));
      } else {
        console.log(chalk.yellow("Users/Pins tables already exists"));
      }
    } catch (error) {
      console.error(chalk.red("Error creating tables:"), error);
    }
  };
  
// configure the database connection
const connectDB = async () => {
    try {
        // Connect to the database
        await pool.connect();
        console.log(chalk.greenBright("Database connected successfully"));

        // Create tables
        await createTables();
    } catch (error) {
        console.error(chalk.red("Error connecting to database:"), error);
    }
};

export default connectDB;
