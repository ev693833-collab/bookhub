const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const cloudinary = require('../config/cloudinary');
const db = require('../config/database');

const ROOT_DIR = path.resolve(__dirname, '../../../');
const PUBLIC_DIR = path.resolve(ROOT_DIR, 'frontend/public');
const MAP_OUTPUT_PATH = path.resolve(__dirname, 'cloudinary_assets_map.json');
const BACKUP_DIR = path.resolve(ROOT_DIR, 'public_backup');

async function getFilesRecursively(dir, fileList = [], filterExts = null, ignoreDirs = []) {
  if (!fs.existsSync(dir)) return fileList;
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    if (ignoreDirs.includes(item.name)) continue;
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      await getFilesRecursively(fullPath, fileList, filterExts, ignoreDirs);
    } else {
      if (!filterExts || filterExts.includes(path.extname(item.name).toLowerCase())) {
        fileList.push(fullPath);
      }
    }
  }
  return fileList;
}

async function runMigration() {
  console.log('================================================================');
  console.log('INICIANDO MIGRAÇÃO DOS ASSETS PARA O CLOUDINARY');
  console.log('================================================================');

  if (!fs.existsSync(PUBLIC_DIR)) {
    console.error(`Diretório ${PUBLIC_DIR} não existe.`);
    process.exit(1);
  }

  // 1. Localizar arquivos em frontend/public
  const assetFiles = await getFilesRecursively(PUBLIC_DIR);
  console.log(`[1/5] Encontrados ${assetFiles.length} arquivos estáticos na pasta public.`);

  // 2. Fazer upload para o Cloudinary
  console.log('\n[2/5] Realizando upload para o Cloudinary...');
  const urlMap = {};

  for (const filePath of assetFiles) {
    const relativePath = path.relative(PUBLIC_DIR, filePath).replace(/\\/g, '/');
    const webPath = `/${relativePath}`;
    const ext = path.extname(filePath).toLowerCase();
    const isVideo = ext === '.mp4' || ext === '.webm';
    const filenameWithoutExt = path.basename(filePath, ext);
    const subFolder = path.dirname(relativePath) === '.' ? '' : `/${path.dirname(relativePath)}`;
    const folder = `bookhub${subFolder}`;

    console.log(` -> Enviando: ${webPath} (${isVideo ? 'vídeo' : 'imagem'})...`);
    try {
      const res = await cloudinary.uploader.upload(filePath, {
        folder: folder,
        public_id: filenameWithoutExt,
        resource_type: isVideo ? 'video' : 'auto',
        overwrite: true,
      });

      urlMap[webPath] = res.secure_url;
      console.log(`    ✓ Sucesso: ${res.secure_url}`);
    } catch (err) {
      console.error(`    ✗ Erro no upload de ${webPath}:`, err.message);
    }
  }

  fs.writeFileSync(MAP_OUTPUT_PATH, JSON.stringify(urlMap, null, 2), 'utf8');
  console.log(`\n[3/5] Mapeamento salvo com sucesso em: ${MAP_OUTPUT_PATH}`);

  // 3. Substituir referências no código (Frontend e Backend)
  console.log('\n[4/5] Substituindo referências no código do frontend e backend...');
  const keys = Object.keys(urlMap).sort((a, b) => b.length - a.length);

  const codeExts = ['.js', '.jsx', '.ts', '.tsx', '.css', '.json'];
  const ignoreDirs = ['node_modules', '.next', '.git', 'public_backup', 'public'];

  const frontendFiles = await getFilesRecursively(path.resolve(ROOT_DIR, 'frontend'), [], codeExts, ignoreDirs);
  const backendFiles = await getFilesRecursively(path.resolve(ROOT_DIR, 'backend/src'), [], codeExts, ignoreDirs);
  const allCodeFiles = [...frontendFiles, ...backendFiles];

  let totalReplacements = 0;
  for (const file of allCodeFiles) {
    // Não atualizar o próprio script ou o arquivo de mapa
    if (file.includes('cloudinary_assets_map.json') || file.includes('migrate_all_to_cloudinary.js') || file.includes('replace_assets_with_cloudinary.js')) {
      continue;
    }

    let content = fs.readFileSync(file, 'utf8');
    let replacedInFile = 0;

    for (const localPath of keys) {
      const cloudUrl = urlMap[localPath];
      if (content.includes(localPath)) {
        const parts = content.split(localPath);
        replacedInFile += (parts.length - 1);
        content = parts.join(cloudUrl);
      }
    }

    if (replacedInFile > 0) {
      fs.writeFileSync(file, content, 'utf8');
      const rel = path.relative(ROOT_DIR, file).replace(/\\/g, '/');
      console.log(`  ✓ ${rel}: ${replacedInFile} referência(s) atualizada(s).`);
      totalReplacements += replacedInFile;
    }
  }
  console.log(`Total de referências substituídas no código: ${totalReplacements}`);

  // 4. Atualizar referências no Banco de Dados (MySQL)
  console.log('\nAtualizando referências no banco de dados...');
  try {
    for (const localPath of keys) {
      const cloudUrl = urlMap[localPath];
      await db.query(`
        UPDATE companies 
        SET logo_url = REPLACE(logo_url, ?, ?),
            banner_url = REPLACE(banner_url, ?, ?)
        WHERE logo_url LIKE ? OR banner_url LIKE ?
      `, [localPath, cloudUrl, localPath, cloudUrl, `%${localPath}%`, `%${localPath}%`]);
    }
    console.log('✓ Banco de dados atualizado com as novas URLs do Cloudinary.');
  } catch (dbErr) {
    console.error('Aviso ao atualizar banco de dados:', dbErr.message);
  }

  // 5. Fazer Backup e Remover pasta public
  console.log('\n[5/5] Realizando backup de segurança e remoção da pasta frontend/public...');
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  for (const file of assetFiles) {
    const rel = path.relative(PUBLIC_DIR, file);
    const dest = path.resolve(BACKUP_DIR, rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(file, dest);
  }
  console.log(`✓ Backup salvo em: ${BACKUP_DIR}`);

  // Remover a pasta public
  fs.rmSync(PUBLIC_DIR, { recursive: true, force: true });
  console.log('✓ Pasta frontend/public removida com sucesso!');

  console.log('\n================================================================');
  console.log('TODAS AS OPERAÇÕES FORAM CONCLUÍDAS COM SUCESSO!');
  console.log('================================================================');
  process.exit(0);
}

runMigration().catch(err => {
  console.error('Erro fatal durante a migração:', err);
  process.exit(1);
});
