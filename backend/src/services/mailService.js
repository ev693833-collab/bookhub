const nodemailer = require('nodemailer');

/**
 * Serviço de Envio de E-mails do DevSongs
 * Responsável por estruturar transportes SMTP, gerar templates responsivos
 * e disparar confirmações de transação de forma resiliente e segura.
 */

// Validação segura de formato de e-mail
function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim());
}

// Formatação monetária em padrão brasileiro (R$ X,XX)
function formatCurrency(amount) {
  const num = typeof amount === 'number' ? amount : parseFloat(String(amount).replace('R$', '').replace(',', '.').trim()) || 0;
  return `R$ ${num.toFixed(2).replace('.', ',')}`;
}

// Formatação de data/hora no fuso horário do Brasil
function formatBrazilianDateTime(dateObj = new Date()) {
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'medium',
      timeZone: 'America/Sao_Paulo'
    }).format(dateObj);
  } catch (_) {
    return new Date().toLocaleString('pt-BR');
  }
}

/**
 * Cria ou reutiliza o transporte do Nodemailer baseado nas variáveis de ambiente.
 * Retorna null se SMTP não estiver configurado.
 */
function getMailTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass
    },
    tls: {
      rejectUnauthorized: false
    },
    connectionTimeout: 8000,
    greetingTimeout: 5000,
    socketTimeout: 10000
  });
}

/**
 * Template HTML Responsivo e Moderno (Identidade Visual DevSongs)
 */
function generatePaymentEmailHtml({
  userName = 'Cliente DevSongs',
  trackTitle = 'Faixa Musical',
  trackArtist = 'Artista',
  trackAlbum = 'Single',
  trackCover = '',
  purchaseType = 'buy',
  price = 4.90,
  paymentMethod = 'PIX',
  transactionId = '',
  formattedDate = '',
  expiresAt = null
}) {
  const isBuy = purchaseType === 'buy';
  const typeBadgeLabel = isBuy ? 'Compra Definitiva • Acesso Vitalício' : 'Aluguel Ativo • 30 Dias de Vigência';
  const typeBadgeBg = isBuy ? '#065f46' : '#1e3a8a';
  const typeBadgeColor = isBuy ? '#6ee7b7' : '#93c5fd';
  const priceDisplay = formatCurrency(price);
  const methodUpper = String(paymentMethod || 'PIX').toUpperCase();

  const validityInfo = !isBuy && expiresAt
    ? `<div style="margin-top: 8px; font-size: 13px; color: #94a3b8;">
         📅 <strong>Vigência do Aluguel:</strong> Disponível até ${new Date(expiresAt).toLocaleDateString('pt-BR')}.
       </div>`
    : '';

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pagamento Confirmado - DevSongs</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc; -webkit-font-smoothing: antialiased;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0b0f19; padding: 30px 10px;">
    <tr>
      <td align="center">
        <!-- Container Principal -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; background-color: #111827; border: 1px solid #1f2937; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);">
          
          <!-- Cabeçalho com Logotipo DevSongs -->
          <tr>
            <td style="padding: 28px 32px 20px 32px; background: linear-gradient(180deg, #1f2937 0%, #111827 100%); border-bottom: 1px solid #374151; text-align: center;">
              <div style="display: inline-block;">
                <span style="font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                  Dev<span style="color: #10b981;">Songs</span>
                </span>
                <span style="display: inline-block; margin-left: 8px; font-size: 11px; font-weight: 700; color: #10b981; background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.4); padding: 3px 8px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.5px; vertical-align: middle;">
                  DevSongs Pay
                </span>
              </div>
              <div style="font-size: 12px; color: #9ca3af; margin-top: 6px; letter-spacing: 0.5px;">
                Comprovante Oficial de Licenciamento Musical
              </div>
            </td>
          </tr>

          <!-- Destaque de Sucesso -->
          <tr>
            <td style="padding: 32px 32px 10px 32px;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 12px; padding: 20px; text-align: center;">
                <tr>
                  <td>
                    <div style="display: inline-block; width: 44px; height: 44px; line-height: 44px; border-radius: 50%; background: #10b981; color: #ffffff; font-size: 22px; font-weight: 900; margin-bottom: 10px;">
                      &#10003;
                    </div>
                    <h1 style="margin: 0 0 6px 0; font-size: 22px; font-weight: 700; color: #ffffff;">
                      Pagamento Confirmado!
                    </h1>
                    <p style="margin: 0; font-size: 14px; color: #d1fae5;">
                      Sua transação foi aprovada e a música já está desbloqueada na sua conta.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Mensagem Personalizada -->
          <tr>
            <td style="padding: 16px 32px 8px 32px; font-size: 15px; line-height: 1.6; color: #e5e7eb;">
              Olá, <strong style="color: #ffffff;">${userName}</strong>,
              <br>
              Recebemos seu pagamento com sucesso. A faixa abaixo foi liberada para reprodução imediata na sua biblioteca particular do DevSongs.
            </td>
          </tr>

          <!-- Card de Detalhes da Faixa Adquirida -->
          <tr>
            <td style="padding: 12px 32px;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #1f2937; border: 1px solid #374151; border-radius: 12px; padding: 18px;">
                <tr>
                  ${trackCover ? `
                  <td width="70" valign="top" style="padding-right: 16px;">
                    <img src="${trackCover}" alt="${trackTitle}" width="68" height="68" style="border-radius: 8px; object-fit: cover; display: block; border: 1px solid #4b5563;">
                  </td>
                  ` : ''}
                  <td valign="top">
                    <div style="font-size: 17px; font-weight: 700; color: #ffffff; margin-bottom: 3px;">
                      ${trackTitle}
                    </div>
                    <div style="font-size: 14px; color: #9ca3af; margin-bottom: 8px;">
                      ${trackArtist} &bull; <span style="color: #6b7280;">${trackAlbum}</span>
                    </div>
                    <div>
                      <span style="display: inline-block; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 5px; background-color: ${typeBadgeBg}; color: ${typeBadgeColor}; text-transform: uppercase;">
                        ${typeBadgeLabel}
                      </span>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Tabela de Resumo Financeiro da Operação -->
          <tr>
            <td style="padding: 10px 32px 20px 32px;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse;">
                <tr style="border-bottom: 1px solid #2d3748;">
                  <td style="padding: 10px 0; font-size: 13px; color: #9ca3af;">Valor da Operação:</td>
                  <td align="right" style="padding: 10px 0; font-size: 15px; font-weight: 700; color: #10b981;">${priceDisplay}</td>
                </tr>
                <tr style="border-bottom: 1px solid #2d3748;">
                  <td style="padding: 10px 0; font-size: 13px; color: #9ca3af;">Método de Pagamento:</td>
                  <td align="right" style="padding: 10px 0; font-size: 13px; font-weight: 600; color: #f3f4f6;">${methodUpper}</td>
                </tr>
                <tr style="border-bottom: 1px solid #2d3748;">
                  <td style="padding: 10px 0; font-size: 13px; color: #9ca3af;">Data e Hora da Confirmação:</td>
                  <td align="right" style="padding: 10px 0; font-size: 13px; color: #f3f4f6;">${formattedDate}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; font-size: 13px; color: #9ca3af;">Identificação da Transação:</td>
                  <td align="right" style="padding: 10px 0; font-size: 13px; font-family: monospace; color: #38bdf8;">${transactionId}</td>
                </tr>
              </table>
              ${validityInfo}
            </td>
          </tr>

          <!-- Instrução de Acesso -->
          <tr>
            <td style="padding: 0 32px 28px 32px;">
              <div style="background-color: #0f172a; border: 1px dashed #334155; border-radius: 10px; padding: 14px; text-align: center;">
                <span style="font-size: 13px; color: #cbd5e1;">
                  🎧 <strong>Como ouvir:</strong> Acesse o sistema <strong>DevSongs</strong>, vá em <strong>Sua Biblioteca</strong> e clique em <em>Ouvir Agora</em>. A faixa já faz parte da sua fila exclusiva!
                </span>
              </div>
            </td>
          </tr>

          <!-- Rodapé do E-mail -->
          <tr>
            <td style="padding: 24px 32px; background-color: #0f172a; border-top: 1px solid #1f2937; text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 12px; color: #9ca3af;">
                Obrigado por utilizar o <strong>DevSongs</strong>.
              </p>
              <p style="margin: 0; font-size: 11px; color: #64748b; line-height: 1.5;">
                Esta é uma mensagem automática de confirmação de pagamento. Por favor, não responda diretamente a este e-mail.<br>
                DevSongs Platform &bull; Todos os direitos reservados.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Versão em Texto Puro (Plain Text Fallback)
 */
function generatePaymentEmailText({
  userName = 'Cliente DevSongs',
  trackTitle = 'Faixa Musical',
  trackArtist = 'Artista',
  purchaseType = 'buy',
  price = 4.90,
  paymentMethod = 'PIX',
  transactionId = '',
  formattedDate = ''
}) {
  const isBuy = purchaseType === 'buy';
  const typeText = isBuy ? 'Compra Definitiva (Acesso Vitalício)' : 'Aluguel (Válido por 30 dias)';
  const priceDisplay = formatCurrency(price);

  return `PAGAMENTO CONFIRMADO - DEVSONGS PAY

Olá, ${userName}!

Seu pagamento foi confirmado com sucesso!

Confira abaixo os detalhes da sua transação:
--------------------------------------------------
- Faixa: ${trackTitle}
- Artista: ${trackArtist}
- Modalidade: ${typeText}
- Valor: ${priceDisplay}
- Forma de Pagamento: ${String(paymentMethod).toUpperCase()}
- Data e Hora: ${formattedDate}
- Identificação da Transação: ${transactionId}
--------------------------------------------------

Sua música já está desbloqueada e liberada para audição na sua Biblioteca do DevSongs.

Obrigado por utilizar o DevSongs!
Esta é uma mensagem automática de confirmação de pagamento.`;
}

/**
 * Função Principal de Envio Complementar de E-mail de Confirmação de Pagamento
 * Executa de forma segura: qualquer falha de SMTP ou endereço é capturada e tratada
 * sem nunca interromper o fluxo principal de pagamento da aplicação.
 *
 * @param {Object} params
 * @param {Object} params.user Objeto do usuário (id, full_name, email)
 * @param {Object} params.track Objeto da música (title, artist, album, cover)
 * @param {Object} params.purchase Objeto da transação (id, type, price, created_at, expires_at)
 * @param {string} params.paymentMethod Método utilizado (pix, card, balance)
 * @returns {Promise<{success: boolean, recipient?: string, reason?: string, error?: string, messageId?: string}>}
 */
async function sendPaymentConfirmationEmail({
  user,
  track,
  purchase,
  paymentMethod = 'pix'
}) {
  try {
    // 1. Verificação da existência e validade do e-mail da conta do usuário
    if (!user || !user.email) {
      console.warn(`[DevSongs Mail] Usuário (ID: ${user?.id || 'desconhecido'}) não possui e-mail cadastrado na conta. Envio ignorado de forma controlada.`);
      return {
        success: false,
        reason: 'no_email_on_account',
        message: 'Conta de usuário não possui endereço de e-mail cadastrado'
      };
    }

    const cleanEmail = String(user.email).trim().toLowerCase();
    if (!isValidEmail(cleanEmail)) {
      console.warn(`[DevSongs Mail] Endereço de e-mail inválido na conta #${user.id}: "${cleanEmail}". Envio cancelado de forma controlada.`);
      return {
        success: false,
        recipient: cleanEmail,
        reason: 'invalid_email_format',
        message: 'Formato de e-mail inválido'
      };
    }

    // 2. Inicialização do Transporte SMTP
    const transporter = getMailTransporter();
    if (!transporter) {
      console.info(`[DevSongs Mail] SMTP não configurado no .env (defina SMTP_HOST, SMTP_USER, SMTP_PASS). Envio real de e-mail mantido em espera para ${cleanEmail}.`);
      return {
        success: false,
        recipient: cleanEmail,
        reason: 'smtp_not_configured',
        message: 'Serviço de e-mail não configurado nas variáveis de ambiente'
      };
    }

    // 3. Montagem dos Dados e Templates
    const formattedDate = formatBrazilianDateTime(purchase?.created_at ? new Date(purchase.created_at) : new Date());
    const transactionId = `#DS-${String(purchase?.id || Date.now()).padStart(6, '0')}`;
    const subject = purchase?.type === 'buy'
      ? `Pagamento Confirmado: "${track.title}" liberada na sua Biblioteca DevSongs`
      : `Aluguel Confirmado: "${track.title}" liberada por 30 dias no DevSongs`;

    const htmlContent = generatePaymentEmailHtml({
      userName: user.full_name || 'Cliente DevSongs',
      trackTitle: track.title,
      trackArtist: track.artist,
      trackAlbum: track.album || 'Single',
      trackCover: track.cover || track.cover_url || '',
      purchaseType: purchase?.type || 'buy',
      price: purchase?.price || 4.90,
      paymentMethod,
      transactionId,
      formattedDate,
      expiresAt: purchase?.expires_at || null
    });

    const textContent = generatePaymentEmailText({
      userName: user.full_name || 'Cliente DevSongs',
      trackTitle: track.title,
      trackArtist: track.artist,
      purchaseType: purchase?.type || 'buy',
      price: purchase?.price || 4.90,
      paymentMethod,
      transactionId,
      formattedDate
    });

    const fromAddress = process.env.SMTP_FROM || (process.env.SMTP_USER ? `DevSongs Pay <${process.env.SMTP_USER}>` : 'DevSongs Pay <noreply@devsongs.com>');

    // 4. Disparo do E-mail com Timeout e Tratamento de Erros
    const sendPromise = transporter.sendMail({
      from: fromAddress,
      to: cleanEmail,
      subject,
      text: textContent,
      html: htmlContent
    });

    // Timeout de segurança (7 segundos) para não travar a aplicação caso o servidor SMTP esteja lento
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Tempo limite de conexão com o servidor SMTP excedido')), 7000)
    );

    const info = await Promise.race([sendPromise, timeoutPromise]);

    console.log(`[DevSongs Mail] E-mail de confirmação enviado com sucesso para "${cleanEmail}". Message ID: ${info.messageId}`);

    return {
      success: true,
      recipient: cleanEmail,
      messageId: info.messageId
    };
  } catch (err) {
    // Trata falhas de envio (SMTP indisponível, credenciais erradas, caixa postal inexistente etc.)
    // sem expor senhas ou tokens nem interromper a confirmação do pagamento
    const safeErrorMessage = err?.message || 'Falha desconhecida no transporte de e-mail';
    console.error(`[DevSongs Mail] Falha no envio de e-mail para "${user?.email}": ${safeErrorMessage}`);

    return {
      success: false,
      recipient: user?.email || null,
      reason: 'send_failed',
      error: safeErrorMessage
    };
  }
}

module.exports = {
  sendPaymentConfirmationEmail,
  isValidEmail,
  formatCurrency,
  formatBrazilianDateTime
};
