const jwt = require('jsonwebtoken');

const API_URL = 'http://localhost:5000';
const JWT_SECRET = process.env.JWT_SECRET || 'devsongs_jwt_secret_key_2026';

// Gera tokens para os testes
const userToken = jwt.sign({ id: 11, email: 'operador_1792688494930@devsongs.com' }, JWT_SECRET, { expiresIn: '1h' });
const adminToken = jwt.sign({ id: 2, email: 'admin@bookhub.com' }, JWT_SECRET, { expiresIn: '1h' });
const attackerToken = jwt.sign({ id: 999, email: 'attacker@evil.com' }, JWT_SECRET, { expiresIn: '1h' });

async function runTests() {
  console.log('====================================================');
  console.log('  TESTES DE SEGURANÇA E AUTORIZAÇÃO — FASE 1A');
  console.log('====================================================\n');

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

  // --------------------------------------------------------
  // 1. Um usuário autenticado consegue consultar as próprias compras
  // --------------------------------------------------------
  console.log('--- Cenário 1: Usuário autenticado consulta próprias compras ---');
  {
    const resMy = await fetch(`${API_URL}/api/companies/my-purchases`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    const dataMy = await resMy.json();
    assert(resMy.status === 200 && dataMy.success === true && dataMy.userId === 11,
      'GET /api/companies/my-purchases retorna 200 com compras do usuário autenticado');

    const resUser = await fetch(`${API_URL}/api/companies/user/11/purchases`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    const dataUser = await resUser.json();
    assert(resUser.status === 200 && dataUser.success === true && dataUser.userId === 11,
      'GET /api/companies/user/11/purchases retorna 200 quando o token bate com o ID da URL');

    const resAdmin = await fetch(`${API_URL}/api/companies/user/2/purchases`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const dataAdmin = await resAdmin.json();
    assert(resAdmin.status === 200 && dataAdmin.success === true && dataAdmin.userId === 2,
      'Admin acessa suas compras em /user/2/purchases com 200 OK');
  }

  // --------------------------------------------------------
  // 2. Um usuário não consegue consultar compras de outra conta (Proteção IDOR)
  // --------------------------------------------------------
  console.log('\n--- Cenário 2: Prevenção de IDOR (consulta de compras alheias) ---');
  {
    const resIdor1 = await fetch(`${API_URL}/api/companies/user/2/purchases`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    const dataIdor1 = await resIdor1.json();
    assert(resIdor1.status === 403,
      'Usuário comum não consegue ver compras do usuário 2 (HTTP 403 Forbidden)',
      `Recebeu status ${resIdor1.status}: ${JSON.stringify(dataIdor1)}`);

    const resIdor2 = await fetch(`${API_URL}/api/companies/user/1/purchases`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(resIdor2.status === 403,
      'Usuário comum não consegue ver compras do usuário 1 (HTTP 403 Forbidden)');

    const resAttacker = await fetch(`${API_URL}/api/companies/user/2/purchases`, {
      headers: { Authorization: `Bearer ${attackerToken}` }
    });
    assert(resAttacker.status === 403,
      'Usuário arbitrário não consegue consultar compras do Superadmin (HTTP 403)');
  }

  // --------------------------------------------------------
  // 3. Requisições sem autenticação válida não acessam informações privadas
  // --------------------------------------------------------
  console.log('\n--- Cenário 3: Bloqueio estrito de requisições não autenticadas ---');
  {
    const resNoAuth1 = await fetch(`${API_URL}/api/companies/user/2/purchases`);
    assert(resNoAuth1.status === 401,
      'GET /user/2/purchases sem token é bloqueado com 401 Unauthorized');

    const resNoAuth2 = await fetch(`${API_URL}/api/companies/my-purchases`);
    assert(resNoAuth2.status === 401,
      'GET /my-purchases sem token é bloqueado com 401 Unauthorized');

    const resInvalidToken = await fetch(`${API_URL}/api/companies/my-purchases`, {
      headers: { Authorization: 'Bearer token_invalido_123' }
    });
    assert(resInvalidToken.status === 401,
      'GET /my-purchases com token inválido é bloqueado com 401 Unauthorized');

    const resNoAuthBuy = await fetch(`${API_URL}/api/companies/1/buy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trackId: 'ct-1' })
    });
    assert(resNoAuthBuy.status === 401,
      'POST /companies/1/buy sem token é bloqueado com 401 Unauthorized');

    const resNoAuthRent = await fetch(`${API_URL}/api/companies/1/rent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trackId: 'ct-1' })
    });
    assert(resNoAuthRent.status === 401,
      'POST /companies/1/rent sem token é bloqueado com 401 Unauthorized');

    const resNoAuthVendor = await fetch(`${API_URL}/api/companies/vendor/tracks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Test', artist: 'Test', companyId: 1 })
    });
    assert(resNoAuthVendor.status === 401,
      'POST /companies/vendor/tracks sem token é bloqueado com 401 Unauthorized');

    // Teste de consulta pública de multibase sem expor compras passando ?userId=2
    const resPublicMultibase = await fetch(`${API_URL}/api/companies/multibase/tracks?userId=2`);
    const dataPublicMultibase = await resPublicMultibase.json();
    const leakedUnlocked = (dataPublicMultibase.tracks || []).filter(t => t.isPurchased || t.isRented);
    assert(resPublicMultibase.status === 200 && leakedUnlocked.length === 0,
      'GET /multibase/tracks?userId=2 sem token NÃO desbloqueia nem expõe compras do usuário 2');
  }

  // --------------------------------------------------------
  // 4. Catálogo musical continua funcionando normalmente
  // --------------------------------------------------------
  console.log('\n--- Cenário 4: Funcionamento do catálogo público e personalizado ---');
  {
    const resCompanies = await fetch(`${API_URL}/api/companies`);
    const dataCompanies = await resCompanies.json();
    assert(resCompanies.status === 200 && Array.isArray(dataCompanies) && dataCompanies.length > 0,
      'GET /api/companies retorna lista pública de gravadoras');

    const resTracks = await fetch(`${API_URL}/api/companies/1/tracks`);
    const dataTracks = await resTracks.json();
    assert(resTracks.status === 200 && Array.isArray(dataTracks.tracks) && dataTracks.tracks.length > 0,
      'GET /api/companies/1/tracks retorna catálogo público da gravadora');

    const resStreaming = await fetch(`${API_URL}/api/companies/multibase/tracks?mode=streaming`);
    const dataStreaming = await resStreaming.json();
    assert(resStreaming.status === 200 && dataStreaming.success && dataStreaming.tracks.length > 0,
      'GET /api/companies/multibase/tracks?mode=streaming retorna catálogo público de streaming');

    // Catálogo autenticado com compras do usuário 2
    const resAuthMultibase = await fetch(`${API_URL}/api/companies/multibase/tracks`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const dataAuthMultibase = await resAuthMultibase.json();
    const userPurchasedCount = (dataAuthMultibase.tracks || []).filter(t => t.isPurchased || t.isRented).length;
    assert(resAuthMultibase.status === 200 && userPurchasedCount > 0,
      `GET /multibase/tracks com token legítimo mapeia compras do usuário autenticado (${userPurchasedCount} faixas)`);
  }

  // --------------------------------------------------------
  // 5. Preservação das permissões administrativas
  // --------------------------------------------------------
  console.log('\n--- Cenário 5: Verificação de permissões administrativas ---');
  {
    const resAdminVerify = await fetch(`${API_URL}/api/admin/verify`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const dataAdminVerify = await resAdminVerify.json();
    assert(resAdminVerify.status === 200 && dataAdminVerify.authorized === true,
      'Superadmin acessa rota restrita /api/admin/verify com sucesso');

    const resUserVerify = await fetch(`${API_URL}/api/admin/verify`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(resUserVerify.status === 403,
      'Usuário comum é rejeitado em rota administrativa com 403 Forbidden');

    // Superadmin tem permissão administrativa para inspecionar biblioteca de outro usuário
    const resAdminInspect = await fetch(`${API_URL}/api/companies/user/11/purchases`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(resAdminInspect.status === 200,
      'Superadmin possui permissão para consultar compras em /user/:userId/purchases para suporte');

    // Usuário comum não pode cadastrar faixa de vendedor
    const resUserVendor = await fetch(`${API_URL}/api/companies/vendor/tracks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`
      },
      body: JSON.stringify({ title: 'Hack Track', artist: 'Evil', companyId: 1 })
    });
    assert(resUserVendor.status === 403,
      'Usuário comum é bloqueado de cadastrar faixas em /vendor/tracks (403 Forbidden)');
  }

  // --------------------------------------------------------
  // 6. Fluxo de compras e integridade
  // --------------------------------------------------------
  console.log('\n--- Cenário 6: Validação de integridade nas operações de compra ---');
  {
    // Tentativa de compra sem trackId
    const resBadBuy = await fetch(`${API_URL}/api/companies/1/buy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`
      },
      body: JSON.stringify({})
    });
    assert(resBadBuy.status === 400,
      'POST /1/buy sem trackId retorna 400 Bad Request');

    // Tentativa de aluguel sem trackId
    const resBadRent = await fetch(`${API_URL}/api/companies/1/rent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`
      },
      body: JSON.stringify({})
    });
    assert(resBadRent.status === 400,
      'POST /1/rent sem trackId retorna 400 Bad Request');
  }

  console.log('\n====================================================');
  console.log(`  RESULTADO: ${passed} passaram, ${failed} falharam.`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Erro fatal durante execução dos testes:', err);
  process.exit(1);
});
