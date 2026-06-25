const mysql = require("mysql2/promise");
const fs = require("fs");
require("dotenv").config();

const poll = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  port: process.env.DB_PORT,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    ca: fs.readFileSync("./certs/ca.pem", "utf8"),
  },
  waitForConnections: true,
  connectionLimit: 10,
});

module.exports = poll;
