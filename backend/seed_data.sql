-- ========================================================
-- BookHub: Dados de Teste / Exemplo (Seed Data)
-- Usuários, Livros, Estoques, Aluguéis e Movimentações
-- ========================================================

-- 1. Inserir Usuários de Teste (Senha padrão: 123456 com hash bcrypt)
INSERT INTO users (full_name, email, password_hash, phone, document, role, address, city, state, zip_code, status)
VALUES 
  ('Administrador BookHub', 'admin@bookhub.com', '$2a$10$wTf26b5uQj9U3vW6h1vQ2e5lZ5nB/kL8L0rK4iR3zE7xY9wQ2e5lZ', '(11) 99999-0001', '123.456.789-00', 'admin', 'Av. Paulista, 1000', 'São Paulo', 'SP', '01310-100', 'active'),
  ('Maria Silva (Cliente)', 'maria@gmail.com', '$2a$10$wTf26b5uQj9U3vW6h1vQ2e5lZ5nB/kL8L0rK4iR3zE7xY9wQ2e5lZ', '(11) 98888-1234', '987.654.321-11', 'user', 'Rua das Flores, 250', 'São Paulo', 'SP', '04530-000', 'active'),
  ('Carlos Mendes (Cliente)', 'carlos@gmail.com', '$2a$10$wTf26b5uQj9U3vW6h1vQ2e5lZ5nB/kL8L0rK4iR3zE7xY9wQ2e5lZ', '(21) 97777-5678', '456.789.123-22', 'user', 'Rua Visconde de Pirajá, 80', 'Rio de Janeiro', 'RJ', '22410-000', 'active')
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name);

-- 2. Inserir Livros / Produtos no Catálogo
INSERT INTO books (id, title, author, isbn, category, description, sale_price, rent_price_daily, rent_price_monthly, availability, status)
VALUES 
  (1, 'O Senhor dos Anéis: A Sociedade do Anel', 'J.R.R. Tolkien', '978-8595084759', 'Fantasia', 'Clássico épico de fantasia e aventura na Terra Média.', 59.90, 3.50, 25.00, 'both', 'active'),
  (2, '1984', 'George Orwell', '978-8535914849', 'Ficção Distópica', 'Uma das obras mais influentes do século XX sobre vigilância e liberdade.', 39.90, 2.50, 18.00, 'both', 'active'),
  (3, 'Clean Code: Manual de Boas Práticas', 'Robert C. Martin', '978-8576082675', 'Tecnologia', 'Guia essencial para desenvolvedores escreverem código limpo e sustentável.', 89.90, 5.00, 35.00, 'both', 'active'),
  (4, 'O Alquimista', 'Paulo Coelho', '978-8542209358', 'Romance / Filosofia', 'A jornada mágica de um pastor andaluz em busca de sua Lenda Pessoal.', 32.50, 2.00, 15.00, 'both', 'active'),
  (5, 'Sapiens: Uma Breve História da Humanidade', 'Yuval Noah Harari', '978-8535925432', 'História / Não Ficção', 'Uma fascinante jornada pelas origens e futuro da espécie humana.', 64.90, 4.00, 28.00, 'both', 'active')
ON DUPLICATE KEY UPDATE title = VALUES(title);

-- 3. Inserir Controle de Estoque para cada Livro
INSERT INTO inventory (book_id, quantity_total, quantity_available_sale, quantity_available_rent, quantity_rented, min_alert_threshold, storage_location)
VALUES 
  (1, 15, 8, 5, 2, 3, 'Corredor A - Prateleira 1'),
  (2, 20, 12, 7, 1, 4, 'Corredor A - Prateleira 2'),
  (3, 10, 5, 4, 1, 2, 'Corredor B - Prateleira 3'),
  (4, 25, 15, 10, 0, 5, 'Corredor C - Prateleira 1'),
  (5, 12, 6, 5, 1, 2, 'Corredor C - Prateleira 2')
ON DUPLICATE KEY UPDATE 
  quantity_total = VALUES(quantity_total),
  quantity_available_sale = VALUES(quantity_available_sale),
  quantity_available_rent = VALUES(quantity_available_rent),
  quantity_rented = VALUES(quantity_rented);

-- 4. Inserir Registro de Movimentações de Estoque (Histórico com subselect dinâmico para usuário admin)
INSERT INTO stock_movements (book_id, user_id, type, quantity, notes)
SELECT 1, id, 'entry', 15, 'Entrada de lote inicial fornecedor HarperCollins' FROM users WHERE email = 'admin@bookhub.com' LIMIT 1;

INSERT INTO stock_movements (book_id, user_id, type, quantity, notes)
SELECT 1, id, 'rent_out', 2, 'Dois exemplares retirados para aluguel ativo' FROM users WHERE email = 'admin@bookhub.com' LIMIT 1;

INSERT INTO stock_movements (book_id, user_id, type, quantity, notes)
SELECT 2, id, 'entry', 20, 'Entrada de lote inicial fornecedor Companhia das Letras' FROM users WHERE email = 'admin@bookhub.com' LIMIT 1;

INSERT INTO stock_movements (book_id, user_id, type, quantity, notes)
SELECT 3, id, 'entry', 10, 'Entrada de lote técnico Alta Books' FROM users WHERE email = 'admin@bookhub.com' LIMIT 1;

-- 5. Exemplo de Registro de Aluguel Ativo
INSERT INTO rentals (user_id, book_id, rental_date, expected_return_date, rental_fee, late_fee, status, notes)
SELECT id, 1, DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_ADD(NOW(), INTERVAL 10 DAY), 25.00, 0.00, 'active', 'Aluguel mensal - retirada presencial'
FROM users WHERE email = 'maria@gmail.com' LIMIT 1;
