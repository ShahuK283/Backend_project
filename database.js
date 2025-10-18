const mysql = require('mysql2');
require('dotenv').config({ path: 'sk.env' });

const connection = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'productsdb',
  port: process.env.DB_PORT || 3306,
  multipleStatements: true
});

connection.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err);
  } else {
    console.log('Database connected successfully!');
  }
});

module.exports = connection;
