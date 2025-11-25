import mysql from "mysql2";
import dotenv from "dotenv";

dotenv.config();

// const db = mysql.createPool({
//   host: "localhost",
//   user: "root",
//   password: process.env.DB_PASS,
//   database: "spotify_pay_tracker",
// });
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

export default db;
