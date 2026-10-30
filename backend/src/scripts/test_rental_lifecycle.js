/**
 * test_rental_lifecycle.js
 * 
 * Bateria de testes rigorosa para verificar:
 * "DevSongs — Regra de início e contagem do prazo de aluguel"
 * 
 * Cenários Testados:
 * 1. Pedido criado sem pagamento: aluguel não iniciado (rented_at = null, expires_at = null).
 * 2. Pagamento pendente: música continua bloqueada (HTTP 403 status: payment_pending).
 * 3. Pagamento confirmado: aluguel iniciado imediatamente com prazo exato de 30 dias a partir da confirmação.
 * 4. Confirmação duplicada: prazo não reiniciado (idempotência perfeita, datas originais preservadas).
 * 5. Renovação antes da expiração: dias restantes integralmente preservados + 30 dias acrescentados ao vencimento.
 * 6. Renovação após expiração: novo período de 30 dias começa no momento da confirmação do novo pagamento.
 * 7. Compra definitiva: acesso permanente vitalício, sem expiração de aluguel.
 */

const assert = require('assert');
const path = require('path');
const libraryStorage = require('../services/libraryStorage');

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

async function runRentalLifecycleTests() {
  console.log('================================================================');
  console.log('DEVSONGS: TESTES DE INÍCIO, CONTAGEM E VIGÊNCIA DE ALUGUEL (30 DIAS)');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  function test(name, fn) {
    total++;
    try {
      fn();
      console.log(`  ✓ [CENÁRIO ${total}] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ [CENÁRIO ${total}] ${name}`);
      console.error(`    Falha: ${err.message}`);
    }
  }

  async function testAsync(name, fn) {
    total++;
    try {
      await fn();
      console.log(`  ✓ [CENÁRIO ${total}] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ [CENÁRIO ${total}] ${name}`);
      console.error(`    Falha: ${err.message}`);
    }
  }

  const TEST_USER_ID = Math.floor(Date.now() / 1000) + Math.floor(Math.random() * 10000);
  const TEST_TRACK_ID = 3; // 'Novo Balanço' (Veigh)
  const TEST_TRACK_2_ID = 5; // 'Acabou Acabou' (Pricila areba)

  // -------------------------------------------------------------------------
  // TESTE 1: Pedido criado sem pagamento -> Aluguel não iniciado
  // -------------------------------------------------------------------------
  let createdOrder = null;
  await testAsync('1. Pedido criado sem pagamento: aluguel não iniciado', async () => {
    const res = await libraryStorage.createRentalOrder(TEST_USER_ID, TEST_TRACK_ID, {
      type: 'rent',
      price: 1.90
    });

    assert.strictEqual(res.success, true, 'Pedido deve ser criado com sucesso');
    assert.ok(res.order, 'Objeto order deve existir');
    assert.strictEqual(res.order.payment_status, 'pending', 'Status deve ser pending');
    assert.strictEqual(res.order.rented_at, null, 'rented_at deve ser nulo antes da confirmação');
    assert.strictEqual(res.order.expires_at, null, 'expires_at deve ser nulo antes da confirmação');
    assert.ok(res.order.created_at, 'created_at deve ser registrado');
    createdOrder = res.order;
  });

  // -------------------------------------------------------------------------
  // TESTE 2: Pagamento pendente -> Música continua bloqueada no backend (403)
  // -------------------------------------------------------------------------
  await testAsync('2. Pagamento pendente: reprodução bloqueada com 403 payment_pending', async () => {
    let errorCaught = null;
    try {
      await libraryStorage.checkPlaybackAccess(TEST_USER_ID, TEST_TRACK_ID);
    } catch (err) {
      errorCaught = err;
    }

    assert.ok(errorCaught, 'Deve lançar erro de acesso bloqueado');
    assert.strictEqual(errorCaught.statusCode, 403, 'Código HTTP deve ser 403 Forbidden');
    assert.strictEqual(errorCaught.status, 'payment_pending', 'Status deve ser payment_pending');
    assert.strictEqual(errorCaught.pending, true, 'Flag pending deve ser true');
  });

  // -------------------------------------------------------------------------
  // TESTE 3: Pagamento confirmado -> Aluguel iniciado imediatamente com prazo de 30 dias
  // -------------------------------------------------------------------------
  const t0 = new Date(Date.now() - 2000); // 2 segundos atrás
  const tx1 = `tx_test_${Date.now()}_001`;

  let confirmationResult = null;
  await testAsync('3. Pagamento confirmado: aluguel iniciado imediatamente com prazo de 30 dias', async () => {
    confirmationResult = await libraryStorage.confirmPayment({
      orderId: createdOrder.id,
      transactionId: tx1,
      userId: TEST_USER_ID,
      trackId: TEST_TRACK_ID,
      type: 'rent',
      confirmedAt: t0.toISOString()
    });

    assert.strictEqual(confirmationResult.success, true, 'Confirmação deve ter sucesso');
    assert.strictEqual(confirmationResult.type, 'rent', 'Tipo deve ser rent');
    assert.strictEqual(confirmationResult.rented_at, t0.toISOString(), 'rented_at deve corresponder à data de confirmação');

    const expectedExpiry = new Date(t0.getTime() + THIRTY_DAYS_MS).toISOString();
    assert.strictEqual(confirmationResult.expires_at, expectedExpiry, 'expires_at deve ser exatamente rented_at + 30 dias');

    // Verificar se reprodução foi liberada
    const access = await libraryStorage.checkPlaybackAccess(TEST_USER_ID, TEST_TRACK_ID);
    assert.strictEqual(access.allowed, true, 'Reprodução deve ser liberada');
    assert.strictEqual(access.status, 'rent_active', 'Status deve ser rent_active');
    assert.strictEqual(access.remainingDays, 30, 'Deve ter 30 dias restantes');
  });

  // -------------------------------------------------------------------------
  // TESTE 4: Confirmação duplicada -> Prazo não reiniciado (idempotência)
  // -------------------------------------------------------------------------
  await testAsync('4. Confirmação duplicada: prazo não reiniciado (idempotência garantida)', async () => {
    // Tentativa de confirmação duplicada 5 dias após T0
    const tDuplicate = new Date(t0.getTime() + 5 * 24 * 60 * 60 * 1000);

    const dupResult = await libraryStorage.confirmPayment({
      orderId: createdOrder.id,
      transactionId: tx1,
      userId: TEST_USER_ID,
      trackId: TEST_TRACK_ID,
      type: 'rent',
      confirmedAt: tDuplicate.toISOString()
    });

    assert.strictEqual(dupResult.success, true, 'Resposta deve ser de sucesso idempotente');
    assert.strictEqual(dupResult.alreadyConfirmed, true, 'Deve indicar que já foi confirmado anteriormente');
    assert.strictEqual(dupResult.rented_at, confirmationResult.rented_at, 'rented_at original NÃO deve ser alterado');
    assert.strictEqual(dupResult.expires_at, confirmationResult.expires_at, 'expires_at original NÃO deve ser alterado');
  });

  // -------------------------------------------------------------------------
  // TESTE 5: Renovação antes da expiração -> Dias restantes preservados + 30 dias acrescentados
  // -------------------------------------------------------------------------
  await testAsync('5. Renovação antes da expiração: dias restantes preservados e +30 dias acrescentados', async () => {
    // Simula renovação ocorrendo 10 dias após o início (ainda restam 20 dias)
    const tRenovacaoAntecipada = new Date(t0.getTime() + 10 * 24 * 60 * 60 * 1000);
    const txRenew = `tx_test_renew_${Date.now()}`;

    const renewResult = await libraryStorage.confirmPayment({
      transactionId: txRenew,
      userId: TEST_USER_ID,
      trackId: TEST_TRACK_ID,
      type: 'rent',
      confirmedAt: tRenovacaoAntecipada.toISOString()
    });

    assert.strictEqual(renewResult.success, true, 'Renovação deve ter sucesso');

    // Expiração anterior era t0 + 30 dias. Com a renovação antecipada, deve ser (t0 + 30d) + 30d = t0 + 60d
    const initialExpiryTime = new Date(confirmationResult.expires_at).getTime();
    const newExpiryTime = new Date(renewResult.expires_at).getTime();
    const diff = newExpiryTime - initialExpiryTime;

    assert.strictEqual(diff, THIRTY_DAYS_MS, 'Mais 30 dias devem ser somados exatamente à data de expiração anterior');
  });

  // -------------------------------------------------------------------------
  // TESTE 6: Renovação após expiração -> Novo período de 30 dias começa no momento da confirmação
  // -------------------------------------------------------------------------
  await testAsync('6. Renovação após expiração: novo período de 30 dias começa na confirmação do pagamento', async () => {
    // 1. Criar um aluguel que expirou há 5 dias para outra faixa (TEST_TRACK_2_ID)
    const pastConfirmation = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000);
    const txExpired = `tx_expired_${Date.now()}`;

    await libraryStorage.confirmPayment({
      transactionId: txExpired,
      userId: TEST_USER_ID,
      trackId: TEST_TRACK_2_ID,
      type: 'rent',
      confirmedAt: pastConfirmation.toISOString()
    });

    // 2. Verificar que o aluguel está bloqueado como expirado
    let expiredError = null;
    try {
      await libraryStorage.checkPlaybackAccess(TEST_USER_ID, TEST_TRACK_2_ID);
    } catch (err) {
      expiredError = err;
    }
    assert.ok(expiredError, 'Música expirada deve ser bloqueada');
    assert.strictEqual(expiredError.statusCode, 403, 'Status deve ser 403');
    assert.strictEqual(expiredError.status, 'rent_expired', 'Status de erro deve ser rent_expired');

    // 3. Renovar o aluguel expirado agora
    const nowConfirmation = new Date();
    const txAfterExpire = `tx_renew_expired_${Date.now()}`;

    const renewedAfterExpire = await libraryStorage.confirmPayment({
      transactionId: txAfterExpire,
      userId: TEST_USER_ID,
      trackId: TEST_TRACK_2_ID,
      type: 'rent',
      confirmedAt: nowConfirmation.toISOString()
    });

    assert.strictEqual(renewedAfterExpire.success, true, 'Renovação pós expiração deve ser aceita');
    assert.strictEqual(renewedAfterExpire.rented_at, nowConfirmation.toISOString(), 'Novo rented_at deve ser a data da confirmação do novo pagamento');

    const expectedNewExpire = new Date(nowConfirmation.getTime() + THIRTY_DAYS_MS).toISOString();
    assert.strictEqual(renewedAfterExpire.expires_at, expectedNewExpire, 'Nova expiração deve ser exatamente 30 dias a partir da confirmação');

    // 4. Verificar se a música voltou a ficar desbloqueada
    const unlockedAccess = await libraryStorage.checkPlaybackAccess(TEST_USER_ID, TEST_TRACK_2_ID);
    assert.strictEqual(unlockedAccess.allowed, true, 'Música deve ser desbloqueada após renovação');
    assert.strictEqual(unlockedAccess.status, 'rent_active', 'Status deve ser rent_active');
  });

  // -------------------------------------------------------------------------
  // TESTE 7: Compra definitiva -> Acesso permanente, sem expiração de aluguel
  // -------------------------------------------------------------------------
  await testAsync('7. Compra definitiva: acesso vitalício permanente sem expiração', async () => {
    const txBuy = `tx_buy_perm_${Date.now()}`;
    const buyResult = await libraryStorage.confirmPayment({
      transactionId: txBuy,
      userId: TEST_USER_ID,
      trackId: TEST_TRACK_ID,
      type: 'buy',
      confirmedAt: new Date().toISOString()
    });

    assert.strictEqual(buyResult.success, true, 'Compra definitiva confirmada');
    assert.strictEqual(buyResult.type, 'buy', 'Tipo deve ser buy');
    assert.strictEqual(buyResult.expires_at, null, 'expires_at deve ser nulo para compra definitiva');
    assert.strictEqual(buyResult.rented_at, null, 'rented_at deve ser nulo para compra definitiva');

    // Verificar acesso permanente
    const permanentAccess = await libraryStorage.checkPlaybackAccess(TEST_USER_ID, TEST_TRACK_ID);
    assert.strictEqual(permanentAccess.allowed, true, 'Reprodução permanente liberada');
    assert.strictEqual(permanentAccess.status, 'purchased', 'Status deve ser purchased');
  });

  console.log('\n================================================================');
  console.log(`RESULTADO FINAL: ${passed}/${total} TESTES PASSARAM COM SUCESSO!`);
  console.log('================================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runRentalLifecycleTests().catch(err => {
  console.error('Erro fatal nos testes:', err);
  process.exit(1);
});

