const db = require('./src/config/database');

async function migrate() {
  console.log('🚀 Iniciando migração das novas estruturas do DevSongs...');

  try {
    // 1. Remover tabelas obsoletas de livros se existirem
    console.log('🧹 Limpando tabelas legadas de livros...');
    await db.query('SET FOREIGN_KEY_CHECKS = 0;');
    await db.query(`
      DROP TABLE IF EXISTS order_items, orders, rentals, stock_movements, inventory, books;
    `);
    await db.query('SET FOREIGN_KEY_CHECKS = 1;');
    console.log('✅ Tabelas legadas de livros removidas.');

    // 2. Criar tabela notifications
    console.log('📦 Criando tabela notifications...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(150) NOT NULL,
        message TEXT NOT NULL,
        type ENUM('rental_due_soon', 'rental_expired', 'purchase_success', 'new_release', 'system', 'promo') NOT NULL DEFAULT 'system',
        link_url VARCHAR(255) DEFAULT NULL,
        read_at TIMESTAMP NULL DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_notif_user_read (user_id, read_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ Tabela notifications criada.');

    // 3. Criar tabela cart_items
    console.log('📦 Criando tabela cart_items...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        track_id INT NOT NULL,
        transaction_type ENUM('buy', 'rent') NOT NULL DEFAULT 'buy',
        rental_days INT DEFAULT 7,
        quantity INT NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (track_id) REFERENCES company_tracks(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_cart_track (user_id, track_id, transaction_type),
        INDEX idx_cart_user (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ Tabela cart_items criada.');

    // 4. Criar tabela reviews
    console.log('📦 Criando tabela reviews...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        item_type ENUM('track', 'company') NOT NULL,
        item_id INT NOT NULL,
        rating TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
        title VARCHAR(150) DEFAULT NULL,
        comment TEXT DEFAULT NULL,
        is_verified_purchase BOOLEAN DEFAULT FALSE,
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'approved',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_reviews_item (item_type, item_id),
        INDEX idx_reviews_rating (rating)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ Tabela reviews criada.');

    // 5. Criar tabela coupons
    console.log('📦 Criando tabela coupons...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS coupons (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(50) NOT NULL UNIQUE,
        discount_type ENUM('percentage', 'fixed') NOT NULL DEFAULT 'percentage',
        discount_value DECIMAL(10, 2) NOT NULL,
        min_order_value DECIMAL(10, 2) DEFAULT 0.00,
        max_uses INT DEFAULT NULL,
        used_count INT DEFAULT 0,
        valid_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        valid_until TIMESTAMP NULL DEFAULT NULL,
        status ENUM('active', 'inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ Tabela coupons criada.');

    // 6. Criar tabela coupon_usages
    console.log('📦 Criando tabela coupon_usages...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS coupon_usages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        coupon_id INT NOT NULL,
        user_id INT NOT NULL,
        discount_applied DECIMAL(10, 2) NOT NULL,
        order_ref VARCHAR(100) DEFAULT NULL,
        used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_coupon_usage_user (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ Tabela coupon_usages criada.');

    // 7. Inserir cupons de boas-vindas caso não existam
    await db.query(`
      INSERT INTO coupons (code, discount_type, discount_value, min_order_value, max_uses, status)
      VALUES 
        ('BEMVINDO10', 'percentage', 10.00, 0.00, 500, 'active'),
        ('DEVMUSIC20', 'percentage', 20.00, 10.00, 200, 'active'),
        ('PRIMEIRAFAIXA', 'fixed', 2.00, 4.00, 1000, 'active')
      ON DUPLICATE KEY UPDATE discount_value = VALUES(discount_value);
    `);
    console.log('🎟️ Cupons promocionais de exemplo inseridos com sucesso!');

    console.log('🎉 Migração concluída com sucesso!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Erro durante a migração:', err);
    process.exit(1);
  }
}

migrate();
