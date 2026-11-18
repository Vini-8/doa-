require('dotenv').config();
const mysql = require('mysql2/promise');

// Pool de conexões reutilizadas por todos os controllers
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true,     // DATE/TIMESTAMP chegam como texto (sem problema de fuso horário)
  decimalNumbers: true   // DECIMAL chega como número
});

module.exports = pool;
