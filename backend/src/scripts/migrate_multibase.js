const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

async function runMigration() {
  console.log('Iniciando migração Multi-Base...');
  const connection = await mysql.createConnection({
    uri: process.env.DATABASE_URL,
    multipleStatements: true
  });

  // 1. Criar tabela companies
  await connection.query(`
    CREATE TABLE IF NOT EXISTS companies (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      slug VARCHAR(60) NOT NULL UNIQUE,
      genre VARCHAR(100) DEFAULT 'Variado',
      description TEXT,
      logo_url VARCHAR(500),
      banner_url VARCHAR(500),
      city VARCHAR(100) DEFAULT 'São Paulo',
      state VARCHAR(2) DEFAULT 'SP',
      status ENUM('active', 'inactive') DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('Tabela companies verificada/criada com sucesso.');

  // 2. Criar tabela company_tracks (Estoque de músicas da empresa)
  await connection.query(`
    CREATE TABLE IF NOT EXISTS company_tracks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      company_id INT NOT NULL,
      title VARCHAR(255) NOT NULL,
      artist VARCHAR(255) NOT NULL,
      album VARCHAR(255) DEFAULT 'Single',
      genre VARCHAR(100) DEFAULT 'Variado',
      cover_url VARCHAR(500),
      preview_url VARCHAR(500),
      youtube_video_id VARCHAR(50),
      duration_sec INT DEFAULT 210,
      stock_quantity INT DEFAULT 50,
      sale_price DECIMAL(10,2) DEFAULT 4.90,
      rent_price DECIMAL(10,2) DEFAULT 1.90,
      available_for_stream BOOLEAN DEFAULT TRUE,
      is_exclusive BOOLEAN DEFAULT FALSE,
      status ENUM('active', 'inactive') DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_comp_tracks_comp (company_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('Tabela company_tracks verificada/criada com sucesso.');

  // 3. Criar tabela company_purchases (Registro de compras/aluguéis de estoque)
  await connection.query(`
    CREATE TABLE IF NOT EXISTS company_purchases (
      id INT AUTO_INCREMENT PRIMARY KEY,
      company_id INT NOT NULL,
      user_id INT NOT NULL,
      track_id INT NOT NULL,
      type ENUM('buy', 'rent') NOT NULL DEFAULT 'buy',
      price DECIMAL(10,2) NOT NULL,
      expires_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_comp_purchases_user (user_id),
      INDEX idx_comp_purchases_comp (company_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('Tabela company_purchases verificada/criada com sucesso.');

  // 4. Inserir empresas iniciais (se não existirem)
  const [existingCompanies] = await connection.query('SELECT COUNT(*) as count FROM companies');
  if (existingCompanies[0].count === 0) {
    await connection.query(`
      INSERT INTO companies (name, slug, genre, description, logo_url, banner_url, city, state) VALUES
      ('DevSongs Urban Records', 'devsongs-urban', 'Trap & Hip-Hop', 'Gravadora focada nos maiores nomes do trap, rap e cultura urbana nacional.', '/img/bk_avatar.png', '/img/bk_banner.jpg', 'Rio de Janeiro', 'RJ'),
      ('Forró & Piseiro Prime', 'forro-prime', 'Forró & Piseiro', 'Acervo exclusivo com as melhores faixas de vaquejada, piseiro e forró do Brasil.', 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/13/98/4c/13984c56-f8fc-318e-9bc4-65b925b4783b/8447053281338.jpg/600x600bb.jpg', '/img/artist_banner_justin.jpg', 'Fortaleza', 'CE'),
      ('Mega Hits Gravadora', 'mega-hits', 'Funk & Pop', 'Distribuidora líder em lançamentos de funk, pop internacional e paradas virais.', '/img/logo-devsongs.png', '/img/bk_banner.jpg', 'São Paulo', 'SP');
    `);
    console.log('3 Empresas / Bases iniciais cadastradas.');
  }

  // 5. Inserir estoque de músicas para cada empresa (se não houver faixas)
  const [existingTracks] = await connection.query('SELECT COUNT(*) as count FROM company_tracks');
  if (existingTracks[0].count === 0) {
    const [companies] = await connection.query('SELECT id, slug FROM companies');
    const compMap = {};
    for (const c of companies) compMap[c.slug] = c.id;

    const tracksData = [
      // Base 1: DevSongs Urban (BK, Veigh, Trap)
      [compMap['devsongs-urban'], 'Músicas de amor nunca mais', 'BK', 'ICARUS', 'Rap', 'https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/3b/2e/21/3b2e21b4-57f7-f735-16b1-2a622626e3a0/8445162776523.jpg/600x600bb.jpg', 214, 45, 4.90, 1.90, 1, 1],
      [compMap['devsongs-urban'], 'Cacos De Vidro', 'BK', 'Diamantes, Lágrimas e Rostos para Esquecer', 'Rap', 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/13/98/4c/13984c56-f8fc-318e-9bc4-65b925b4783b/8447053281338.jpg/600x600bb.jpg', 198, 30, 5.90, 2.50, 1, 1],
      [compMap['devsongs-urban'], 'Novo Balanço', 'Veigh', 'Dos Prédios Deluxe', 'Trap', 'https://cdn-images.dzcdn.net/images/cover/6646c5f4c6b60b0ddd4f00987623437c/500x500-000000-80-0-0.jpg', 184, 12, 6.90, 2.90, 1, 0],
      [compMap['devsongs-urban'], '100% MOLHO', 'Brandão85, Jovem Dex, Leviano', 'ISSO É TRAP', 'Trap', 'https://cdn-images.dzcdn.net/images/cover/823c311b28a72801b809da4d99c621f4/500x500-000000-80-0-0.jpg', 165, 8, 4.50, 1.80, 1, 0],

      // Base 2: Forró & Piseiro Prime (Pri Areba, Tropykália)
      [compMap['forro-prime'], 'Acabou Acabou (Ao Vivo)', 'Pricila areba', 'Roda de Piseiro, Vol. 1 (Ao Vivo)', 'Piseiro', 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/13/98/4c/13984c56-f8fc-318e-9bc4-65b925b4783b/8447053281338.jpg/600x600bb.jpg', 190, 25, 3.90, 1.50, 1, 1],
      [compMap['forro-prime'], 'Torre Eiffel (Ao Vivo)', 'Pricila areba', 'Roda de Piseiro, Vol. 1 (Ao Vivo)', 'Piseiro', 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/13/98/4c/13984c56-f8fc-318e-9bc4-65b925b4783b/8447053281338.jpg/600x600bb.jpg', 210, 15, 3.90, 1.50, 1, 1],
      [compMap['forro-prime'], 'Planeta de Cores', 'Forrozão Tropykália', 'Tropykália 25 Anos', 'Forró', 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/e0/92/da/e092da2d-9f6d-11dc-7843-2021e95a2b61/21UMGIM17518.rgb.jpg/600x600bb.jpg', 230, 40, 4.20, 1.70, 1, 0],
      [compMap['forro-prime'], 'Par Perfeito', 'Priscila Areba', 'Par Perfeito', 'Forró', 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/13/98/4c/13984c56-f8fc-318e-9bc4-65b925b4783b/8447053281338.jpg/600x600bb.jpg', 185, 20, 3.50, 1.20, 1, 0],

      // Base 3: Mega Hits Gravadora (Funk & Pop)
      [compMap['mega-hits'], 'Nova Tendência', 'MC GP', 'Nova Tendência', 'Funk', 'https://is1-ssl.mzstatic.com/image/thumb/Music118/v4/b9/78/fa/b978fac2-a626-ea2e-ea93-5f7e7bf642b4/8429006299409.jpg/600x600bb.jpg', 175, 50, 4.90, 1.90, 1, 1],
      [compMap['mega-hits'], 'Peitão Molhado', 'MC GP', 'Funk Hits', 'Funk', 'https://is1-ssl.mzstatic.com/image/thumb/Music118/v4/b9/78/fa/b978fac2-a626-ea2e-ea93-5f7e7bf642b4/8429006299409.jpg/600x600bb.jpg', 160, 35, 4.90, 1.90, 1, 0],
      [compMap['mega-hits'], 'Sorry', 'Justin Bieber', 'Purpose', 'Pop', 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/81/a4/dc/81a4dc50-8d7e-6ae5-71d3-f83393348248/15UMGIM59807.rgb.jpg/600x600bb.jpg', 200, 100, 7.90, 2.90, 1, 0]
    ];

    for (const t of tracksData) {
      await connection.query(`
        INSERT INTO company_tracks 
        (company_id, title, artist, album, genre, cover_url, duration_sec, stock_quantity, sale_price, rent_price, available_for_stream, is_exclusive)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, t);
    }
    console.log(`${tracksData.length} músicas com estoque associadas às empresas.`);
  }

  await connection.end();
  console.log('Migração Multi-Base concluída com sucesso!');
}

runMigration().catch(console.error);
