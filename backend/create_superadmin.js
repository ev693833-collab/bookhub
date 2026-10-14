const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function setAdmin() {
  const hash = await bcrypt.hash('admin123', 10);
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  
  await conn.query(
    `INSERT INTO users (full_name, email, password_hash, role, status, phone, city)
     VALUES (?, ?, ?, 'admin', 'active', '(11) 99999-9999', 'São Paulo')
     ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), role = 'admin', full_name = VALUES(full_name)`,
    ['Super Administrador', 'admin@bookhub.com', hash]
  );

  await conn.query(
    `INSERT INTO users (full_name, email, password_hash, role, status, phone, city)
     VALUES (?, ?, ?, 'admin', 'active', '(11) 99999-9999', 'São Paulo')
     ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), role = 'admin', full_name = VALUES(full_name)`,
    ['Super Administrador', 'admin@devsongs.com', hash]
  );

  console.log('Superadmin configurado com sucesso! E-mail: admin@bookhub.com e admin@devsongs.com | Senha: admin123');
  
  const [admins] = await conn.query("SELECT id, full_name, email, role FROM users WHERE role = 'admin'");
  console.log('Admins no banco:', admins);

  await conn.end();
}

setAdmin().catch(console.error);
