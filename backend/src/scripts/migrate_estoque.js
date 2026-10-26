const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

async function run() {
  const connection = await mysql.createConnection({
    uri: process.env.DATABASE_URL,
    multipleStatements: true
  });
  console.log('Connected to MySQL...');

  // 1. Add extra columns to users if missing
  const colsToAdd = [
    { name: 'phone', def: 'VARCHAR(20) DEFAULT NULL' },
    { name: 'document', def: 'VARCHAR(20) DEFAULT NULL' },
    { name: 'address', def: 'VARCHAR(255) DEFAULT NULL' },
    { name: 'city', def: 'VARCHAR(100) DEFAULT NULL' },
    { name: 'state', def: 'VARCHAR(2) DEFAULT NULL' },
    { name: 'zip_code', def: 'VARCHAR(10) DEFAULT NULL' },
    { name: 'status', def: "ENUM('active', 'inactive', 'blocked') DEFAULT 'active'" }
  ];

  for (const col of colsToAdd) {
    const [chk] = await connection.query(
      "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = ?",
      [col.name]
    );
    if (chk.length === 0) {
      await connection.query(`ALTER TABLE users ADD COLUMN ${col.name} ${col.def}`);
      console.log('Added column ' + col.name + ' to users');
    }
  }

  // 2. Execute database_estoque_vendas.sql
  const sql = fs.readFileSync(path.join(__dirname, 'database_estoque_vendas.sql'), 'utf8');
  await connection.query(sql);
  console.log('Executed schema successfully!');

  // 3. Show all tables
  const [tables] = await connection.query('SHOW TABLES');
  console.log('Tables in database:', tables);
  await connection.end();
}

run().catch(console.error);
