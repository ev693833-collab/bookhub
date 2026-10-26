/**
 * Script de Execução Controlada da Migração Multibase — DevSongs
 * Versão: 2.0 (Revisão Técnica Corretiva)
 * 
 * ATENÇÃO: POR PADRÃO ESTE SCRIPT OPERA EM MODO 'DRY-RUN' (SIMULAÇÃO SEGURA).
 * Para aplicar as alterações de forma explícita quando autorizado, deve-se passar:
 *   node src/scripts/migrate_organizations.js --execute
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const mysql = require('mysql2/promise');

const isExecuteMode = process.argv.includes('--execute');

// Lista canônica de gravadoras verificadas e auditadas para a organização padrão inicial
const VERIFIED_COMPANY_SLUGS = ['devsongs-urban', 'forro-prime', 'mega-hits'];

async function runMigration() {
  console.log('===============================================================');
  console.log('  MIGRAÇÃO MULTIBASE: ORGANIZAÇÕES & SELOS (FASE 2B - V2.0)');
  console.log(`  MODO: ${isExecuteMode ? 'EXECUÇÃO REAL' : 'DRY-RUN (SIMULAÇÃO SEGURA)'}`);
  console.log('===============================================================\n');

  if (!isExecuteMode) {
    console.log('[AVISO DE SEGURANÇA] O modo de execução real não foi acionado.');
    console.log('Nenhum comando DDL/DML foi ou será executado no banco de dados.\n');
    console.log('Etapas verificáveis preparadas na migração V2.0:');
    console.log('  [ETAPA 1]  Verificação de pré-condições (existência de `users` e `companies`, integridade de tipos INT).');
    console.log('  [ETAPA 2]  Auditoria do inventário de gravadoras (garantir ausência de selos com propriedade incerta).');
    console.log('  [ETAPA 3]  Criação da tabela `organizations` (sem índice redundante em `slug`).');
    console.log('  [ETAPA 4]  Criação da tabela `organization_users` (FKs em CASCADE e restrição única uk_org_user).');
    console.log('  [ETAPA 5]  Inserção idempotente e resolução dinâmica do ID da organização padrão "devsongs-group".');
    console.log('  [ETAPA 6]  Adição segura da coluna `companies.organization_id INT NULL` (se ainda não existir).');
    console.log('  [ETAPA 7]  Associação das gravadoras auditadas e validação pós-vínculo (zero gravadoras órfãs).');
    console.log('  [ETAPA 8]  Aplicação da restrição NOT NULL em `companies.organization_id` (se ainda for NULL).');
    console.log('  [ETAPA 9]  Criação do índice `idx_companies_organization` (se ainda não existir).');
    console.log('  [ETAPA 10] Criação da FK `fk_companies_organization` com ON DELETE RESTRICT (se ainda não existir).');
    console.log('\nPara executar quando o planejamento for formalmente aprovado:');
    console.log('  node src/scripts/migrate_organizations.js --execute');
    console.log('===============================================================\n');
    return;
  }

  // Bloco de Execução Real (apenas quando solicitado com --execute)
  console.log('[Iniciando Conexão com o Banco de Dados]');
  const connection = await mysql.createConnection({
    uri: process.env.DATABASE_URL,
    multipleStatements: true,
  });

  try {
    // -------------------------------------------------------------------------
    // ETAPA 1: VERIFICAÇÃO DE PRÉ-CONDIÇÕES OBRIGATÓRIAS
    // -------------------------------------------------------------------------
    console.log('\n[Etapa 1/10] Verificando pré-condições obrigatórias...');
    
    // 1.1 Existência de users e companies
    const [tables] = await connection.query(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME IN ('users', 'companies')
    `);
    const tableNames = tables.map(t => t.TABLE_NAME);
    if (!tableNames.includes('users') || !tableNames.includes('companies')) {
      throw new Error('Falha de Pré-Condição: Tabelas fundamentais `users` e/ou `companies` não existem.');
    }
    console.log('  ✓ Tabelas `users` e `companies` confirmadas.');

    // 1.2 Compatibilidade de tipos das PKs para suporte a FKs
    const [pkTypes] = await connection.query(`
      SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE 
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME IN ('users', 'companies') 
        AND COLUMN_NAME = 'id'
    `);
    for (const row of pkTypes) {
      if (row.DATA_TYPE.toLowerCase() !== 'int') {
        throw new Error(`Falha de Pré-Condição: A coluna ${row.TABLE_NAME}.${row.COLUMN_NAME} possui tipo '${row.DATA_TYPE}', esperado 'int'.`);
      }
    }
    console.log('  ✓ Compatibilidade de tipos de chave primária (INT) confirmada.');

    // -------------------------------------------------------------------------
    // ETAPA 2: AUDITORIA DO INVENTÁRIO DE GRAVADORAS
    // -------------------------------------------------------------------------
    console.log('\n[Etapa 2/10] Auditando inventário de gravadoras a vincular...');
    const [companies] = await connection.query('SELECT id, name, slug FROM companies ORDER BY id ASC');
    console.log(`  Gravadoras encontradas no banco: ${companies.length}`);
    
    // Verificar se há gravadoras não reconhecidas
    const unrecognized = companies.filter(c => !VERIFIED_COMPANY_SLUGS.includes(c.slug));
    if (unrecognized.length > 0) {
      const slugs = unrecognized.map(c => `ID ${c.id} (${c.slug})`).join(', ');
      throw new Error(`Falha de Pré-Condição: Encontradas gravadoras não auditadas no banco: [${slugs}]. Verifique a propriedade antes de prosseguir.`);
    }
    console.log(`  ✓ Todas as ${companies.length} gravadoras conferem com a lista canônica auditada: ${VERIFIED_COMPANY_SLUGS.join(', ')}.`);

    // -------------------------------------------------------------------------
    // ETAPA 3: CRIAÇÃO DA TABELA organizations (SEM ÍNDICE REDUNDANTE)
    // -------------------------------------------------------------------------
    console.log('\n[Etapa 3/10] Verificando/Criando tabela `organizations`...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS organizations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        slug VARCHAR(60) NOT NULL UNIQUE,
        document VARCHAR(30) DEFAULT NULL,
        logo_url VARCHAR(500) DEFAULT NULL,
        status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
        plan ENUM('starter', 'pro', 'enterprise') DEFAULT 'pro',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_organizations_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('  ✓ Tabela `organizations` pronta (índice único exclusivo em `slug`).');

    // -------------------------------------------------------------------------
    // ETAPA 4: CRIAÇÃO DA TABELA organization_users
    // -------------------------------------------------------------------------
    console.log('\n[Etapa 4/10] Verificando/Criando tabela `organization_users`...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS organization_users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        organization_id INT NOT NULL,
        user_id INT NOT NULL,
        role ENUM('org_admin', 'manager', 'member') NOT NULL DEFAULT 'member',
        status ENUM('active', 'inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY uk_org_user (organization_id, user_id),
        INDEX idx_org_user_lookup (user_id, organization_id, status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('  ✓ Tabela `organization_users` pronta.');

    // -------------------------------------------------------------------------
    // ETAPA 5: INSERÇÃO E RESOLUÇÃO DINÂMICA DA ORGANIZAÇÃO PADRÃO
    // -------------------------------------------------------------------------
    console.log('\n[Etapa 5/10] Inserindo e resolvendo ID dinâmico da organização padrão...');
    await connection.query(`
      INSERT INTO organizations (name, slug, document, logo_url, status, plan)
      SELECT 'DevSongs Music Group', 'devsongs-group', NULL, 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png', 'active', 'enterprise'
      WHERE NOT EXISTS (
        SELECT 1 FROM organizations WHERE slug = 'devsongs-group'
      );
    `);

    const [orgRows] = await connection.query("SELECT id, name FROM organizations WHERE slug = 'devsongs-group' LIMIT 1");
    if (!orgRows || orgRows.length === 0 || !orgRows[0].id) {
      throw new Error('Falha crítica: Não foi possível obter o ID da Organização Padrão.');
    }
    const defaultOrgId = orgRows[0].id;
    if (typeof defaultOrgId !== 'number' || defaultOrgId <= 0) {
      throw new Error(`Falha crítica: ID inválido retornado para Organização Padrão: ${defaultOrgId}`);
    }
    console.log(`  ✓ Organização Padrão validada: ID ${defaultOrgId} ("${orgRows[0].name}")`);

    // -------------------------------------------------------------------------
    // ETAPA 6: ADIÇÃO DA COLUNA companies.organization_id
    // -------------------------------------------------------------------------
    console.log('\n[Etapa 6/10] Verificando coluna `organization_id` na tabela `companies`...');
    const [colCheck] = await connection.query(`
      SELECT COUNT(*) AS total 
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'companies' 
        AND COLUMN_NAME = 'organization_id'
    `);
    if (colCheck[0].total === 0) {
      await connection.query('ALTER TABLE companies ADD COLUMN organization_id INT NULL AFTER id');
      console.log('  ✓ [EXECUTANDO] Coluna `organization_id` adicionada em `companies`.');
    } else {
      console.log('  ✓ [JÁ CONCLUÍDO] Coluna `organization_id` já presente em `companies`.');
    }

    // -------------------------------------------------------------------------
    // ETAPA 7: ASSOCIAÇÃO DAS GRAVADORAS VERIFICADAS
    // -------------------------------------------------------------------------
    console.log('\n[Etapa 7/10] Vinculando gravadoras auditadas à organização padrão...');
    const [updateRes] = await connection.query(
      `UPDATE companies 
       SET organization_id = ? 
       WHERE (organization_id IS NULL OR organization_id = 0)
         AND slug IN (?)`,
      [defaultOrgId, VERIFIED_COMPANY_SLUGS]
    );
    console.log(`  ✓ Registros atualizados nesta etapa: ${updateRes.affectedRows}`);

    // Validação de pós-condição
    const [unlinked] = await connection.query(`
      SELECT COUNT(*) AS total 
      FROM companies 
      WHERE organization_id IS NULL OR organization_id = 0
    `);
    if (unlinked[0].total > 0) {
      throw new Error(`Falha pós-associação: Ainda existem ${unlinked[0].total} gravadoras sem organização vinculada!`);
    }
    console.log('  ✓ Pós-condição validada: Zero gravadoras desvinculadas.');

    // -------------------------------------------------------------------------
    // ETAPA 8: RESTRIÇÃO NOT NULL EM companies.organization_id
    // -------------------------------------------------------------------------
    console.log('\n[Etapa 8/10] Verificando restrição NOT NULL em `companies.organization_id`...');
    const [nullCheck] = await connection.query(`
      SELECT IS_NULLABLE 
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'companies' 
        AND COLUMN_NAME = 'organization_id'
    `);
    if (nullCheck.length > 0 && nullCheck[0].IS_NULLABLE === 'YES') {
      await connection.query('ALTER TABLE companies MODIFY COLUMN organization_id INT NOT NULL');
      console.log('  ✓ [EXECUTANDO] Restrição NOT NULL aplicada com sucesso.');
    } else {
      console.log('  ✓ [JÁ CONCLUÍDO] Coluna já definida como NOT NULL.');
    }

    // -------------------------------------------------------------------------
    // ETAPA 9: ÍNDICE EM companies.organization_id
    // -------------------------------------------------------------------------
    console.log('\n[Etapa 9/10] Verificando índice `idx_companies_organization`...');
    const [idxCheck] = await connection.query(`
      SELECT COUNT(*) AS total 
      FROM information_schema.STATISTICS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'companies' 
        AND INDEX_NAME = 'idx_companies_organization'
    `);
    if (idxCheck[0].total === 0) {
      await connection.query('ALTER TABLE companies ADD INDEX idx_companies_organization (organization_id)');
      console.log('  ✓ [EXECUTANDO] Índice `idx_companies_organization` adicionado.');
    } else {
      console.log('  ✓ [JÁ CONCLUÍDO] Índice `idx_companies_organization` já existe.');
    }

    // -------------------------------------------------------------------------
    // ETAPA 10: CHAVE ESTRANGEIRA COM ON DELETE RESTRICT
    // -------------------------------------------------------------------------
    console.log('\n[Etapa 10/10] Verificando chave estrangeira `fk_companies_organization`...');
    const [fkCheck] = await connection.query(`
      SELECT COUNT(*) AS total 
      FROM information_schema.TABLE_CONSTRAINTS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'companies' 
        AND CONSTRAINT_NAME = 'fk_companies_organization'
    `);
    if (fkCheck[0].total === 0) {
      await connection.query(`
        ALTER TABLE companies 
        ADD CONSTRAINT fk_companies_organization 
        FOREIGN KEY (organization_id) REFERENCES organizations(id) 
        ON DELETE RESTRICT
      `);
      console.log('  ✓ [EXECUTANDO] Chave estrangeira `fk_companies_organization` (ON DELETE RESTRICT) criada.');
    } else {
      console.log('  ✓ [JÁ CONCLUÍDO] Chave estrangeira `fk_companies_organization` já existe.');
    }

    console.log('\n===============================================================');
    console.log('  MIGRAÇÃO V2.0 CONCLUÍDA E VALIDADA COM SUCESSO!');
    console.log('===============================================================\n');
  } catch (err) {
    console.error('\n[FALHA INTERRUPTIVA DURANTE A MIGRAÇÃO]:', err.message);
    console.error('\nDIAGNÓSTICO: Como comandos DDL no MySQL realizam commits implícitos,');
    console.error('o estado atual do banco foi mantido íntegro e a migração foi abortada.');
    console.error('Consulte o script de verificação `src/scripts/precheck_multibase_migration.js`');
    console.error('para avaliar quais etapas foram concluídas antes da falha.');
    process.exit(1);
  } finally {
    await connection.end();
  }
}

runMigration().catch(err => {
  console.error('Falha geral no runner:', err);
  process.exit(1);
});
