/**
 * Script de Pós-Checagem (Post-Check) da Migração Multibase — DevSongs
 * Versão: 2.0 (Revisão Técnica Corretiva)
 * 
 * ATENÇÃO: ESTE SCRIPT É ESTRITAMENTE READ-ONLY (SOMENTE LEITURA).
 * Ele valida se o schema e os dados pós-migração estão íntegros, sem índices
 * redundantes, com chaves estrangeiras RESTRICT e sem perda de dados.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const db = require('../config/database');

async function runPostCheck() {
  console.log('===============================================================');
  console.log('  POST-CHECK DE VALIDAÇÃO: MIGRAÇÃO MULTIBASE (V2.0)');
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`  [PASSOU] ${testName}`);
      passed++;
    } else {
      console.error(`  [FALHOU] ${testName} - ${details}`);
      failed++;
    }
  }

  // 1. Tabela organizations e verificação de índices
  console.log('--- 1. Validação da Tabela organizations e Índices ---');
  let defaultOrgId = null;
  try {
    const [tableRows] = await db.query(`
      SELECT COUNT(*) AS total 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'organizations'
    `);
    assert(tableRows[0].total > 0, 'Tabela organizations existe no schema');

    const [orgRows] = await db.query("SELECT id, name, slug, status, plan FROM organizations WHERE slug = 'devsongs-group'");
    assert(orgRows.length > 0, 'Organização padrão devsongs-group está cadastrada');
    if (orgRows.length > 0) {
      defaultOrgId = orgRows[0].id;
      console.log(`    ↳ Organização Padrão ID: ${defaultOrgId} ("${orgRows[0].name}")`);
    }

    // Verificar ausência de índice redundante em slug
    const [redundantIdx] = await db.query(`
      SELECT COUNT(*) AS total 
      FROM information_schema.STATISTICS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'organizations' 
        AND INDEX_NAME = 'idx_organizations_slug'
    `);
    assert(redundantIdx[0].total === 0, 'Ausência de índice redundante idx_organizations_slug (otimização V2.0)');
  } catch (err) {
    assert(false, 'Tabela organizations acessível', err.message);
  }

  // 2. Tabela organization_users
  console.log('\n--- 2. Validação da Tabela organization_users e Chaves ---');
  try {
    const [tableRows] = await db.query(`
      SELECT COUNT(*) AS total 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'organization_users'
    `);
    assert(tableRows[0].total > 0, 'Tabela organization_users existe no schema');

    const [cols] = await db.query(`
      SELECT COLUMN_NAME 
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'organization_users'
    `);
    const colNames = cols.map(c => c.COLUMN_NAME);
    assert(
      colNames.includes('organization_id') && colNames.includes('user_id') && colNames.includes('role'),
      'Colunas essenciais (organization_id, user_id, role) presentes em organization_users'
    );

    const [ukRows] = await db.query(`
      SELECT CONSTRAINT_NAME 
      FROM information_schema.TABLE_CONSTRAINTS 
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'organization_users' AND CONSTRAINT_TYPE = 'UNIQUE'
    `);
    assert(ukRows.length > 0, 'Chave única uk_org_user ativa para impedir duplicidade de associação');
  } catch (err) {
    assert(false, 'Tabela organization_users acessível', err.message);
  }

  // 3. Coluna companies.organization_id, Not Null e Foreign Key RESTRICT
  console.log('\n--- 3. Validação da Estrutura e Restrições em companies ---');
  try {
    const [colCheck] = await db.query(`
      SELECT IS_NULLABLE, DATA_TYPE 
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'companies' 
        AND COLUMN_NAME = 'organization_id'
    `);
    assert(colCheck.length > 0, 'Coluna companies.organization_id existe');
    if (colCheck.length > 0) {
      assert(colCheck[0].IS_NULLABLE === 'NO', 'Coluna companies.organization_id é NOT NULL');
      assert(colCheck[0].DATA_TYPE === 'int', 'Coluna companies.organization_id é do tipo INT');
    }

    // Validação da FK com DELETE_RULE = RESTRICT
    const [fkDetails] = await db.query(`
      SELECT rc.CONSTRAINT_NAME, rc.DELETE_RULE, rc.UPDATE_RULE, kcu.REFERENCED_TABLE_NAME
      FROM information_schema.REFERENTIAL_CONSTRAINTS rc
      JOIN information_schema.KEY_COLUMN_USAGE kcu 
        ON rc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME 
       AND rc.CONSTRAINT_SCHEMA = kcu.CONSTRAINT_SCHEMA
      WHERE rc.CONSTRAINT_SCHEMA = DATABASE() 
        AND rc.TABLE_NAME = 'companies' 
        AND rc.CONSTRAINT_NAME = 'fk_companies_organization'
    `);
    assert(fkDetails.length > 0, 'Chave estrangeira fk_companies_organization existe');
    if (fkDetails.length > 0) {
      assert(
        fkDetails[0].DELETE_RULE === 'RESTRICT' || fkDetails[0].DELETE_RULE === 'NO ACTION',
        `Chave estrangeira configurada com ON DELETE RESTRICT (regra atual: ${fkDetails[0].DELETE_RULE})`
      );
      assert(
        fkDetails[0].REFERENCED_TABLE_NAME === 'organizations',
        'Chave estrangeira referencia a tabela organizations'
      );
    }

    const [unlinkedCompanies] = await db.query(`
      SELECT COUNT(*) AS total 
      FROM companies 
      WHERE organization_id IS NULL OR organization_id = 0
    `);
    assert(unlinkedCompanies[0].total === 0, 'Zero gravadoras com organization_id nulo ou zero');
  } catch (err) {
    assert(false, 'Validação de companies.organization_id e restrições', err.message);
  }

  // 4. Preservação Integral de Registros Existentes
  console.log('\n--- 4. Preservação Integral dos Registros Existentes ---');
  try {
    const [compCount] = await db.query('SELECT COUNT(*) AS total FROM companies');
    assert(compCount[0].total === 3, 'Todas as 3 gravadoras originais preservadas intactas');

    const [trackCount] = await db.query('SELECT COUNT(*) AS total FROM company_tracks');
    assert(trackCount[0].total === 17, 'Todas as 17 faixas de acervo preservadas intactas');

    const [purchaseCount] = await db.query('SELECT COUNT(*) AS total FROM company_purchases');
    assert(purchaseCount[0].total === 10, 'Todas as 10 transações de compra/aluguel preservadas intactas');

    const [userCount] = await db.query('SELECT COUNT(*) AS total FROM users');
    assert(userCount[0].total === 3, 'Todos os 3 usuários e credenciais preservados intactos');
  } catch (err) {
    assert(false, 'Preservação de registros', err.message);
  }

  console.log('\n===============================================================');
  console.log(`  RESULTADO POST-CHECK: ${passed} asserções passaram, ${failed} falharam.`);
  console.log('===============================================================\n');

  process.exit(failed === 0 ? 0 : 1);
}

runPostCheck().catch(err => {
  console.error('Falha no post-check:', err);
  process.exit(1);
});
