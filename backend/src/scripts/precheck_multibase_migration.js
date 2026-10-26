/**
 * Script de Pré-Checagem (Pre-Check) da Migração Multibase — DevSongs
 * Versão: 2.0 (Revisão Técnica Corretiva)
 * 
 * ATENÇÃO: ESTE SCRIPT É ESTRITAMENTE READ-ONLY (SOMENTE LEITURA).
 * Ele NÃO executa nenhuma alteração, criação ou deleção no banco de dados.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const db = require('../config/database');

const VERIFIED_COMPANY_SLUGS = ['devsongs-urban', 'forro-prime', 'mega-hits'];

async function runPreCheck() {
  console.log('===============================================================');
  console.log('  PRE-CHECK DIAGNÓSTICO: MIGRAÇÃO MULTIBASE (V2.0)');
  console.log('===============================================================\n');

  let issues = 0;
  let warnings = 0;

  // 1. Informações da Conexão e Versão do MySQL
  try {
    const [versionRows] = await db.query('SELECT VERSION() AS version, DATABASE() AS current_db');
    console.log(`[Banco Conectado] Schema: ${versionRows[0].current_db} (MySQL/MariaDB v${versionRows[0].version})`);
  } catch (err) {
    console.error('Falha de conexão com o banco de dados:', err.message);
    process.exit(1);
  }

  // 2. Verificação de Tabelas Essenciais Existentes
  console.log('\n--- 1. Verificação de Tabelas Fundamentais ---');
  const requiredTables = ['users', 'companies', 'company_tracks', 'company_purchases'];
  for (const table of requiredTables) {
    try {
      const [countRows] = await db.query(`SELECT COUNT(*) AS total FROM ${table}`);
      console.log(`  ✓ Tabela '${table}': Presente com ${countRows[0].total} registros.`);
    } catch (err) {
      console.error(`  ✗ Tabela '${table}' ausente ou inacessível:`, err.message);
      issues++;
    }
  }

  // 3. Verificação de Compatibilidade dos Tipos de Chave Primária
  console.log('\n--- 2. Verificação de Compatibilidade de Tipos para FKs ---');
  try {
    const [pkTypes] = await db.query(`
      SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE 
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME IN ('users', 'companies') 
        AND COLUMN_NAME = 'id'
    `);
    pkTypes.forEach(pk => {
      if (pk.DATA_TYPE.toLowerCase() === 'int') {
        console.log(`  ✓ ${pk.TABLE_NAME}.${pk.COLUMN_NAME}: Tipo '${pk.DATA_TYPE}' compatível com chaves estrangeiras.`);
      } else {
        console.error(`  ✗ ${pk.TABLE_NAME}.${pk.COLUMN_NAME}: Tipo '${pk.DATA_TYPE}' incompatível (esperado 'int').`);
        issues++;
      }
    });
  } catch (err) {
    console.error('  Erro ao verificar tipos das chaves primárias:', err.message);
    issues++;
  }

  // 4. Auditoria de Gravadoras e Validação de Propriedade
  console.log('\n--- 3. Auditoria do Inventário de Gravadoras ---');
  try {
    const [companies] = await db.query('SELECT id, name, slug, status FROM companies ORDER BY id ASC');
    console.log(`  Total de gravadoras cadastradas: ${companies.length}`);
    
    let unverifiedFound = false;
    companies.forEach((c) => {
      const isVerified = VERIFIED_COMPANY_SLUGS.includes(c.slug);
      const mark = isVerified ? '✓' : '⚠';
      console.log(`    ${mark} ID ${c.id}: "${c.name}" (slug: ${c.slug}, status: ${c.status}) ${isVerified ? '[VERIFICADO]' : '[NÃO AUDITADO]'}`);
      if (!isVerified) {
        unverifiedFound = true;
      }
    });

    if (unverifiedFound) {
      console.warn('  ⚠ ATENÇÃO: Encontradas gravadoras com slug fora do inventário auditado. A propriedade deve ser confirmada.');
      warnings++;
    } else {
      console.log('  ✓ Todas as gravadoras pertencem ao inventário verificado da organização padrão.');
    }
  } catch (err) {
    console.error('  Erro ao listar gravadoras:', err.message);
    issues++;
  }

  // 5. Integridade Referencial Atual
  console.log('\n--- 4. Verificação de Integridade Referencial Atual ---');
  try {
    const [orphanedTracks] = await db.query(`
      SELECT COUNT(*) AS total 
      FROM company_tracks ct 
      LEFT JOIN companies c ON ct.company_id = c.id 
      WHERE c.id IS NULL
    `);
    if (orphanedTracks[0].total === 0) {
      console.log('  ✓ Nenhuma faixa órfã encontrada (todas pertencem a gravadoras válidas).');
    } else {
      console.warn(`  ⚠ ATENÇÃO: Encontradas ${orphanedTracks[0].total} faixas órfãs sem gravadora correspondente!`);
      issues++;
    }

    const [orphanedPurchases] = await db.query(`
      SELECT COUNT(*) AS total 
      FROM company_purchases cp 
      LEFT JOIN companies c ON cp.company_id = c.id 
      WHERE c.id IS NULL
    `);
    if (orphanedPurchases[0].total === 0) {
      console.log('  ✓ Nenhuma compra órfã de gravadora encontrada.');
    } else {
      console.warn(`  ⚠ ATENÇÃO: Encontradas ${orphanedPurchases[0].total} compras vinculadas a gravadoras inexistentes!`);
      issues++;
    }
  } catch (err) {
    console.error('  Erro ao verificar integridade relacional:', err.message);
    issues++;
  }

  // 6. Estado Atual dos Objetos de Migração e Detecção de Estruturas Parciais
  console.log('\n--- 5. Detecção de Estruturas Pré-existentes ou Parciais ---');
  try {
    // 6.1 organizations
    const [orgTableCheck] = await db.query(`
      SELECT COUNT(*) AS total 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'organizations'
    `);
    const orgTableExists = orgTableCheck[0].total > 0;
    console.log(`  - Tabela 'organizations': ${orgTableExists ? 'JÁ EXISTE' : 'NÃO CRIADA'}`);

    if (orgTableExists) {
      // Checar se existe índice redundante idx_organizations_slug
      const [redundantIdx] = await db.query(`
        SELECT COUNT(*) AS total 
        FROM information_schema.STATISTICS 
        WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = 'organizations' 
          AND INDEX_NAME = 'idx_organizations_slug'
      `);
      if (redundantIdx[0].total > 0) {
        console.warn('    ⚠ Detectado índice secundário redundante `idx_organizations_slug` (já coberto pelo UNIQUE `slug`).');
        warnings++;
      }
    }

    // 6.2 organization_users
    const [orgUsersTableCheck] = await db.query(`
      SELECT COUNT(*) AS total 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'organization_users'
    `);
    const orgUsersExists = orgUsersTableCheck[0].total > 0;
    console.log(`  - Tabela 'organization_users': ${orgUsersExists ? 'JÁ EXISTE' : 'NÃO CRIADA'}`);

    // 6.3 companies.organization_id
    const [colCheck] = await db.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'companies' 
        AND COLUMN_NAME = 'organization_id'
    `);
    const colExists = colCheck.length > 0;
    console.log(`  - Coluna 'companies.organization_id': ${colExists ? `JÁ EXISTE (Tipo: ${colCheck[0].DATA_TYPE}, Nullable: ${colCheck[0].IS_NULLABLE})` : 'NÃO CRIADA'}`);

    // 6.4 Chave estrangeira
    const [fkCheck] = await db.query(`
      SELECT CONSTRAINT_NAME 
      FROM information_schema.TABLE_CONSTRAINTS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'companies' 
        AND CONSTRAINT_NAME = 'fk_companies_organization'
    `);
    console.log(`  - Chave estrangeira 'fk_companies_organization': ${fkCheck.length > 0 ? 'JÁ CONFIGURADA' : 'NÃO CRIADA'}`);

    // 6.5 Organização padrão pré-existente
    if (orgTableExists) {
      const [defaultOrg] = await db.query("SELECT id, name, slug FROM organizations WHERE slug = 'devsongs-group'");
      if (defaultOrg.length > 0) {
        console.log(`  - Organização Padrão ('devsongs-group'): Já existente com ID ${defaultOrg[0].id}`);
      } else {
        console.log("  - Organização Padrão ('devsongs-group'): Ainda não cadastrada");
      }
    }
  } catch (err) {
    console.error('  Erro ao checar schema:', err.message);
    issues++;
  }

  // 7. Conclusão
  console.log('\n===============================================================');
  if (issues === 0 && warnings === 0) {
    console.log('  DIAGNÓSTICO: APROVADO PARA ETAPA DE HOMOLOGAÇÃO');
    console.log('  O banco está íntegro, compatível e sem estruturas parciais conflitantes.');
  } else if (issues === 0) {
    console.log(`  DIAGNÓSTICO: APROVADO COM AVISOS (${warnings} aviso(s))`);
    console.log('  Pré-condições técnicas satisfeitas. Revise os avisos informativos acima.');
  } else {
    console.error(`  DIAGNÓSTICO: REPROVADO (${issues} erro(s) crítico(s))`);
    console.error('  A migração NÃO deve ser executada até a correção dos problemas apontados.');
  }
  console.log('===============================================================\n');

  process.exit(issues === 0 ? 0 : 1);
}

runPreCheck().catch((err) => {
  console.error('Falha inesperada no pre-check:', err);
  process.exit(1);
});
