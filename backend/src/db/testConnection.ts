import pool from "./database.js";

const testDatabaseConnection = async () => {
  try {
    const result = await pool.query("SELECT NOW()");
    console.log("PostgreSQL connected:", result.rows[0]);
  } catch (error) {
    console.error("PostgreSQL connection failed:", error);
  } finally {
    await pool.end();
  }
};

testDatabaseConnection();