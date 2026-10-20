-- ========================================================
-- DevSongs: Dados de Teste / Exemplo (Seed Data)
-- Usuários, Cupons, Notificações e Reviews
-- ========================================================

-- 1. Inserir Usuários de Teste (Senha padrão: 123456 com hash bcrypt)
INSERT INTO users (full_name, email, password_hash, role)
VALUES 
  ('Administrador DevSongs', 'admin@devsongs.com', '$2a$10$wTf26b5uQj9U3vW6h1vQ2e5lZ5nB/kL8L0rK4iR3zE7xY9wQ2e5lZ', 'admin'),
  ('Maria Silva (Ouvinte)', 'maria@gmail.com', '$2a$10$wTf26b5uQj9U3vW6h1vQ2e5lZ5nB/kL8L0rK4iR3zE7xY9wQ2e5lZ', 'user'),
  ('Carlos Mendes (Produtor)', 'carlos@gmail.com', '$2a$10$wTf26b5uQj9U3vW6h1vQ2e5lZ5nB/kL8L0rK4iR3zE7xY9wQ2e5lZ', 'user')
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name);

-- 2. Inserir Cupons de Desconto Promocionais
INSERT INTO coupons (code, discount_type, discount_value, min_order_value, max_uses, status)
VALUES 
  ('BEMVINDO10', 'percentage', 10.00, 0.00, 500, 'active'),
  ('DEVMUSIC20', 'percentage', 20.00, 10.00, 200, 'active'),
  ('PRIMEIRAFAIXA', 'fixed', 2.00, 4.00, 1000, 'active')
ON DUPLICATE KEY UPDATE discount_value = VALUES(discount_value);

-- 3. Inserir Notificações de Exemplo para Usuários
INSERT INTO notifications (user_id, title, message, type, link_url)
SELECT id, 'Bem-vindo ao DevSongs!', 'Aproveite o cupom BEMVINDO10 para ganhar 10% de desconto na sua primeira compra de faixa exclusiva.', 'promo', '/profile'
FROM users WHERE email = 'admin@devsongs.com' LIMIT 1;

