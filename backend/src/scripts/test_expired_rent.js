const http = require('http');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'devsongs_super_secret_jwt_key_2026';
const PORT = 5000;
const PURCHASES_FILE = path.join(__dirname, '../../data/company_purchases.json');

// Token para usuário 2 (Superadmin)
const token = jwt.sign({ id: 2, email: 'admin@bookhub.com', role: 'admin' }, JWT_SECRET, { expiresIn: '1h' });

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(body); } catch(e) { json = body; }
        resolve({ status: res.statusCode, headers: res.headers, body: json });
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

// Configura dados de teste em company_purchases.json
function prepareTestData() {
  const purchases = JSON.parse(fs.readFileSync(PURCHASES_FILE, 'utf8'));
  for (const p of purchases) {
    if (p.user_id === 2 && p.track_id === 2) {
      p.type = 'rent';
      p.expires_at = '2026-10-25T10:00:00.000Z'; // Expirado
    }
    if (p.user_id === 2 && p.track_id === 10) {
      p.type = 'rent';
      p.expires_at = '2026-10-20T10:00:00.000Z'; // Expirado
    }
    if (p.user_id === 2 && p.track_id === 6) {
      p.type = 'rent';
      p.expires_at = '2026-11-28T13:03:59.081Z'; // Ativo
    }
    if (p.user_id === 2 && p.track_id === 1) {
      p.type = 'buy';
      p.expires_at = null; // Compra vitalícia
    }
  }
  fs.writeFileSync(PURCHASES_FILE, JSON.stringify(purchases, null, 2), 'utf8');
}

async function runTests() {
  console.log('--- TESTE COMPLETO: BLOQUEIO AUTOMÁTICO DE MÚSICAS COM ALUGUEL EXPIRADO ---');
  prepareTestData();

  let passed = 0;
  let total = 0;

  function assert(desc, condition) {
    total++;
    if (condition) {
      console.log(`[PASS] ${desc}`);
      passed++;
    } else {
      console.error(`[FAIL] ${desc}`);
    }
  }

  try {
    // 1. SITUAÇÃO B: FAIXA COM ALUGUEL EXPIRADO (Track 2 - "Cacos De Vidro")
    console.log('\n1. Testando faixa com aluguel expirado (Track 2 - BK)...');
    const authExp = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/library/tracks/2/playback-auth',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assert('Playback-auth para faixa com aluguel expirado deve retornar HTTP 403', authExp.status === 403);
    assert('Resposta deve indicar status "rent_expired" e expired: true', authExp.body.status === 'rent_expired' && authExp.body.expired === true);

    const audioExp = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/library/tracks/2/audio',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assert('Tentativa direta de acesso ao áudio de faixa expirada deve retornar HTTP 403', audioExp.status === 403);

    // 2. SITUAÇÃO A: FAIXA COM ALUGUEL ATIVO (Track 6 - "Torre Eiffel")
    console.log('\n2. Testando faixa com aluguel ativo (Track 6 - Pricila Areba)...');
    const authActive = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/library/tracks/6/playback-auth',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assert('Playback-auth para aluguel ativo deve retornar HTTP 200', authActive.status === 200);
    assert('Resposta deve indicar reason "rent_active"', authActive.body.access && authActive.body.access.reason === 'rent_active');

    // 3. SITUAÇÃO C: FAIXA COMPRADA DEFINITIVAMENTE (Track 1 - "Músicas de amor nunca mais")
    console.log('\n3. Testando faixa comprada definitivamente (Track 1 - BK)...');
    const authBuy = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/library/tracks/1/playback-auth',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assert('Playback-auth para compra definitiva deve retornar HTTP 200', authBuy.status === 200);
    assert('Resposta deve indicar reason "purchased"', authBuy.body.access && authBuy.body.access.reason === 'purchased');

    // 4. RENOVAÇÃO DE ALUGUEL (Track 2)
    console.log('\n4. Testando renovação de aluguel (+30 dias na Track 2)...');
    const renewRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/library/tracks/2/renew-rent',
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assert('Endpoint de renovação deve retornar HTTP 200', renewRes.status === 200);
    assert('Resposta de renovação deve conter success: true e type: rent', renewRes.body.success === true && renewRes.body.type === 'rent');

    const authAfterRenew = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/library/tracks/2/playback-auth',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assert('Após renovação, playback-auth deve liberar reprodução (HTTP 200)', authAfterRenew.status === 200);
    assert('Status de acesso deve ser rent_active com prazo renovado', authAfterRenew.body.access.status === 'rent_active');

    // 5. COMPRA DEFINITIVA DE FAIXA ANTERIORMENTE ALUGADA/EXPIRADA (Track 10 - "Peitão Molhado")
    console.log('\n5. Testando upgrade para compra definitiva (Track 10 - MC GP)...');
    const buyPermRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/library/tracks/10/buy-permanent',
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assert('Endpoint de compra definitiva deve retornar HTTP 200', buyPermRes.status === 200);
    assert('Resposta de compra deve conter success: true e type: buy', buyPermRes.body.success === true && buyPermRes.body.type === 'buy');

    const authAfterBuyPerm = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/library/tracks/10/playback-auth',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assert('Após compra definitiva, playback-auth deve retornar HTTP 200 com motivo "purchased"', authAfterBuyPerm.status === 200 && authAfterBuyPerm.body.access.reason === 'purchased');

    // 6. FAIXA NÃO CADASTRADA / NÃO AUTORIZADA
    console.log('\n6. Testando segurança para faixa inexistente...');
    const authUnknown = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/library/tracks/999/playback-auth',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assert('Faixa inexistente deve retornar HTTP 404', authUnknown.status === 404);

    console.log(`\n========================================`);
    console.log(`RESULTADO FINAL: ${passed}/${total} TESTES PASSARAM COM SUCESSO!`);
    console.log(`========================================\n`);
  } catch (err) {
    console.error('Erro ao executar testes:', err);
  }
}

runTests();
