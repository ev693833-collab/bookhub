-- ========================================================
-- BookHub: Schema Completo para Usuários, Estoque, Vendas e Aluguéis
-- Banco de Dados: MySQL (compatível com bookhub)
-- ========================================================

-- --------------------------------------------------------
-- 1. Tabela: users (Usuários / Clientes / Admins)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(20) DEFAULT NULL,
  document VARCHAR(20) DEFAULT NULL, -- CPF ou CNPJ
  avatar_url VARCHAR(500) DEFAULT NULL,
  role ENUM('user', 'admin', 'employee') DEFAULT 'user',
  address VARCHAR(255) DEFAULT NULL,
  city VARCHAR(100) DEFAULT NULL,
  state VARCHAR(2) DEFAULT NULL,
  zip_code VARCHAR(10) DEFAULT NULL,
  status ENUM('active', 'inactive', 'blocked') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_email (email),
  INDEX idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 2. Tabela: books (Catálogo de Livros / Produtos)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS books (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  author VARCHAR(255) NOT NULL,
  isbn VARCHAR(30) DEFAULT NULL UNIQUE,
  category VARCHAR(100) DEFAULT 'Geral',
  description TEXT DEFAULT NULL,
  cover_url VARCHAR(500) DEFAULT NULL,
  publisher VARCHAR(150) DEFAULT NULL,
  publication_year INT DEFAULT NULL,
  pages INT DEFAULT 0,
  sale_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,       -- Preço para venda definitiva
  rent_price_daily DECIMAL(10, 2) NOT NULL DEFAULT 0.00, -- Preço de aluguel por dia
  rent_price_monthly DECIMAL(10, 2) NOT NULL DEFAULT 0.00, -- Preço de aluguel mensal
  availability ENUM('both', 'sale_only', 'rent_only') DEFAULT 'both',
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_books_title (title),
  INDEX idx_books_author (author),
  INDEX idx_books_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 3. Tabela: inventory (Controle de Estoque Físico)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS inventory (
  id INT AUTO_INCREMENT PRIMARY KEY,
  book_id INT NOT NULL UNIQUE,
  quantity_total INT NOT NULL DEFAULT 0,            -- Quantidade física total
  quantity_available_sale INT NOT NULL DEFAULT 0,   -- Disponível para venda
  quantity_available_rent INT NOT NULL DEFAULT 0,   -- Disponível para alugar
  quantity_rented INT NOT NULL DEFAULT 0,           -- Em posse de clientes (alugados)
  min_alert_threshold INT NOT NULL DEFAULT 2,       -- Alerta quando estoque estiver baixo
  storage_location VARCHAR(100) DEFAULT 'Estante A', -- Localização na loja/estoque
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
  INDEX idx_inventory_book (book_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 4. Tabela: stock_movements (Histórico de Entradas e Saídas)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS stock_movements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  book_id INT NOT NULL,
  user_id INT DEFAULT NULL, -- Funcionário ou sistema que registrou
  type ENUM(
    'entry',          -- Entrada de mercadoria (compra/fornecedor)
    'sale',           -- Saída por venda
    'rent_out',       -- Saída para locação/aluguel
    'rent_return',    -- Retorno de devolução
    'damaged',        -- Exemplar danificado/avaria
    'loss',           -- Extravio/Perda
    'adjustment'      -- Ajuste manual de inventário
  ) NOT NULL,
  quantity INT NOT NULL,
  notes VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_movements_book (book_id),
  INDEX idx_movements_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 5. Tabela: rentals (Gestão de Aluguéis e Locações)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS rentals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  book_id INT NOT NULL,
  rental_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expected_return_date DATETIME NOT NULL,
  actual_return_date DATETIME DEFAULT NULL,
  rental_fee DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  late_fee DECIMAL(10, 2) NOT NULL DEFAULT 0.00, -- Multa acumulada se atrasar devolução
  status ENUM('active', 'returned', 'overdue', 'cancelled') DEFAULT 'active',
  notes TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
  INDEX idx_rentals_user (user_id),
  INDEX idx_rentals_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 6. Tabela: orders (Vendas / Compras de Livros)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  payment_method ENUM('credit_card', 'pix', 'cash', 'transfer') DEFAULT 'pix',
  payment_status ENUM('pending', 'approved', 'cancelled', 'refunded') DEFAULT 'approved',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_orders_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 7. Tabela: order_items (Itens de cada Venda)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  book_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
  INDEX idx_order_items_order (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
