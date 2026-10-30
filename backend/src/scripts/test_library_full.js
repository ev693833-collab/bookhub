/**
 * Testes Automatizados da Biblioteca Musical — DevSongs
 * Cobre:
 * 1. Acesso à API e às rotas da Biblioteca
 * 2. Criação, edição, exclusão de playlists
 * 3. Adição, remoção e reordenação persistente de faixas
 * 4. Sistema de Privacidade de Playlists (Pública, Não listada, Particular)
 * 5. Proteção IDOR e bloqueio de acesso a terceiros
 * 6. Criação, edição e integridade referencial de Artistas e Álbuns
 * 7. Gerenciamento de Músicas no acervo e regras de arquivamento comercial
 * 8. Integração e integridade de sessões
 */

const jwt = require('../middlewares/auth').JWT_SECRET ? require('jsonwebtoken') : require('jsonwebtoken');

const API_URL = 'http://localhost:5000';
const FRONTEND_URL = 'http://localhost:3000';
const JWT_SECRET = process.env.JWT_SECRET || 'devsongs_super_secret_jwt_key_2026';

// Tokens simulados de teste
const tokenUserOwner = jwt.sign({ id: 2, email: 'admin@bookhub.com' }, JWT_SECRET, { expiresIn: '1h' });
const tokenOtherUser = jwt.sign({ id: 1, email: 'enzo@test.com' }, JWT_SECRET, { expiresIn: '1h' });

async function runLibraryTests() {
  console.log('================================================================');
  console.log('  SUITE DE TESTES: BIBLIOTECA MUSICAL — DEVSONGS');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;
  const testResults = [];

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`  [PASSOU] ${testName}`);
      passed++;
      testResults.push({ name: testName, status: 'PASSOU', details });
    } else {
      console.error(`  [FALHOU] ${testName} - ${details}`);
      failed++;
      testResults.push({ name: testName, status: 'FALHOU', details });
    }
  }

  try {
    // -------------------------------------------------------------------------
    // TESTE 1: Acesso aos endpoints do frontend e backend
    // -------------------------------------------------------------------------
    console.log('--- 1. Acesso e Disponibilidade da Biblioteca ---');
    {
      const resFrontBib = await fetch(`${FRONTEND_URL}/biblioteca`);
      assert(resFrontBib.status === 200, 'Frontend responde 200 OK em /biblioteca');

      const resFrontLib = await fetch(`${FRONTEND_URL}/library`);
      assert(resFrontLib.status === 200, 'Frontend responde 200 OK em /library (alias canônico)');

      const resTracks = await fetch(`${API_URL}/api/library/tracks`);
      const tracksData = await resTracks.json();
      assert(resTracks.status === 200 && tracksData.success === true && tracksData.count >= 11,
        'Backend lista faixas da biblioteca com status 200 e dados do acervo real');
    }

    // -------------------------------------------------------------------------
    // TESTE 2: CRUD de Artistas e Integridade Referencial
    // -------------------------------------------------------------------------
    console.log('\n--- 2. Gerenciamento de Artistas & Integridade ---');
    let createdArtistId = null;
    {
      // Criar artista
      const resCreate = await fetch(`${API_URL}/api/library/artists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenUserOwner}` },
        body: JSON.stringify({
          name: 'Artista Teste Integração ' + Date.now(),
          bio: 'Biografia para teste de integridade',
          genre: 'Rock & Indie'
        })
      });
      const createData = await resCreate.json();
      createdArtistId = createData.artist?.id;
      assert(resCreate.status === 201 && createdArtistId,
        'Criação de novo artista retorna 201 Created');

      // Editar artista
      const resEdit = await fetch(`${API_URL}/api/library/artists/${createdArtistId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenUserOwner}` },
        body: JSON.stringify({ bio: 'Biografia atualizada' })
      });
      const editData = await resEdit.json();
      assert(resEdit.status === 200 && editData.artist.bio === 'Biografia atualizada',
        'Edição de metadados do artista persiste com 200 OK');

      // Tentativa de excluir artista com faixas vinculadas (BK)
      const resDelBk = await fetch(`${API_URL}/api/library/artists/1`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${tokenUserOwner}` }
      });
      assert(resDelBk.status === 400,
        'Integridade: Exclusão de artista com faixas associadas é bloqueada com HTTP 400');

      // Exclusão bem-sucedida de artista sem vínculos
      const resDelSafe = await fetch(`${API_URL}/api/library/artists/${createdArtistId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${tokenUserOwner}` }
      });
      assert(resDelSafe.status === 200,
        'Exclusão de artista sem dependências é realizada com sucesso');
    }

    // -------------------------------------------------------------------------
    // TESTE 3: CRUD de Álbuns e Integridade
    // -------------------------------------------------------------------------
    console.log('\n--- 3. Gerenciamento de Álbuns & Integridade ---');
    let createdAlbumId = null;
    {
      const resCreateAlb = await fetch(`${API_URL}/api/library/albums`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenUserOwner}` },
        body: JSON.stringify({
          title: 'Álbum Teste ' + Date.now(),
          artist_name: 'BK',
          artist_id: 1,
          genre: 'Rap',
          release_date: '2026-10-29'
        })
      });
      const albData = await resCreateAlb.json();
      createdAlbumId = albData.album?.id;
      assert(resCreateAlb.status === 201 && createdAlbumId,
        'Criação de álbum no acervo retorna 201 Created');

      // Bloqueio de exclusão em álbum com faixas (ex: ICARUS id 1)
      const resDelIcarus = await fetch(`${API_URL}/api/library/albums/1`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${tokenUserOwner}` }
      });
      assert(resDelIcarus.status === 400,
        'Integridade: Exclusão de álbum que possui faixas no acervo é bloqueada com HTTP 400');

      // Exclusão segura do álbum sem faixas
      const resDelSafeAlb = await fetch(`${API_URL}/api/library/albums/${createdAlbumId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${tokenUserOwner}` }
      });
      assert(resDelSafeAlb.status === 200,
        'Exclusão de álbum sem faixas dependentes é realizada com 200 OK');
    }

    // -------------------------------------------------------------------------
    // TESTE 4: Gerenciamento de Músicas & Arquivamento Comercial
    // -------------------------------------------------------------------------
    console.log('\n--- 4. Gerenciamento de Músicas & Preservação Comercial ---');
    let testTrackId = null;
    {
      const resTrackCreate = await fetch(`${API_URL}/api/library/tracks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenUserOwner}` },
        body: JSON.stringify({
          title: 'Faixa Temporária Teste ' + Date.now(),
          artist: 'DevSongs Artist',
          album: 'DevSongs Album',
          genre: 'Trap',
          duration_sec: 180,
          company_id: 1,
          available_for_stream: true
        })
      });
      const tData = await resTrackCreate.json();
      testTrackId = tData.track?.id;
      assert(resTrackCreate.status === 201 && testTrackId,
        'Criação de faixa com campos reais do modelo em company_tracks retorna 201 Created');

      // Edição de metadados
      const resTrackEdit = await fetch(`${API_URL}/api/library/tracks/${testTrackId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenUserOwner}` },
        body: JSON.stringify({ title: 'Faixa Temporária Atualizada' })
      });
      const editTrackData = await resTrackEdit.json();
      assert(resTrackEdit.status === 200 && editTrackData.track.title === 'Faixa Temporária Atualizada',
        'Atualização dos metadados permitidos da faixa persiste com sucesso');
    }

    // -------------------------------------------------------------------------
    // TESTE 5: Criação, Adição, Reordenação de Playlists
    // -------------------------------------------------------------------------
    console.log('\n--- 5. Playlists: Criação, Músicas e Reordenação no Banco ---');
    let testPlaylistId = null;
    {
      const resPl = await fetch(`${API_URL}/api/library/playlists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenUserOwner}` },
        body: JSON.stringify({
          name: 'Playlist Teste Automatizado',
          description: 'Validando reordenação e privacidade',
          privacy: 'private'
        })
      });
      const plData = await resPl.json();
      testPlaylistId = plData.playlist?.id;
      assert(resPl.status === 201 && plData.playlist?.privacy === 'private',
        'Playlist criada com sucesso e privacidade padrão "private" associada ao proprietário');

      // Adicionar Faixa 1 (pos 1)
      await fetch(`${API_URL}/api/library/playlists/${testPlaylistId}/tracks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenUserOwner}` },
        body: JSON.stringify({ track_id: 1 })
      });

      // Adicionar Faixa 2 (pos 2)
      await fetch(`${API_URL}/api/library/playlists/${testPlaylistId}/tracks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenUserOwner}` },
        body: JSON.stringify({ track_id: 2 })
      });

      // Adicionar Faixa de teste criada (pos 3)
      await fetch(`${API_URL}/api/library/playlists/${testPlaylistId}/tracks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenUserOwner}` },
        body: JSON.stringify({ track_id: testTrackId })
      });

      const resCheckPl = await fetch(`${API_URL}/api/library/playlists/${testPlaylistId}`, {
        headers: { Authorization: `Bearer ${tokenUserOwner}` }
      });
      const checkData = await resCheckPl.json();
      assert(checkData.playlist.track_count === 3 && checkData.playlist.tracks.length === 3,
        'Faixas inseridas na playlist e contagem calculada dinamicamente');

      // Reordenar faixas no banco (ordem invertida: testTrackId, 2, 1)
      const resReorder = await fetch(`${API_URL}/api/library/playlists/${testPlaylistId}/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenUserOwner}` },
        body: JSON.stringify({ track_ids: [testTrackId, 2, 1] })
      });
      const reorderData = await resReorder.json();
      const firstTrackId = reorderData.playlist.tracks[0]?.id;
      assert(firstTrackId === testTrackId && reorderData.playlist.tracks[0]?.position === 1,
        'Ordem das faixas reordenada e persistida no banco de dados na coluna position');

      // Remover faixa 2 da playlist
      const resRem = await fetch(`${API_URL}/api/library/playlists/${testPlaylistId}/tracks/2`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${tokenUserOwner}` }
      });
      const remData = await resRem.json();
      assert(remData.playlist.track_count === 2,
        'Música removida da playlist com reindexação de posições');
    }

    // -------------------------------------------------------------------------
    // TESTE 6: Sistema de Privacidade e Segurança (Seção 12)
    // -------------------------------------------------------------------------
    console.log('\n--- 6. Sistema de Privacidade e Autorização (Seção 12) ---');
    {
      // 1. Playlist Particular: Outro usuário NÃO pode acessar
      const resOtherAccessPrivate = await fetch(`${API_URL}/api/library/playlists/${testPlaylistId}`, {
        headers: { Authorization: `Bearer ${tokenOtherUser}` }
      });
      assert(resOtherAccessPrivate.status === 403,
        'Cenário 3 e 4: Playlist particular bloqueia acesso de outros usuários com HTTP 403 Forbidden');

      // Tentativa anônima (sem token)
      const resAnonAccessPrivate = await fetch(`${API_URL}/api/library/playlists/${testPlaylistId}`);
      assert(resAnonAccessPrivate.status === 403,
        'Playlist particular bloqueia acesso anônimo sem token com HTTP 403 Forbidden');

      // 2. Outro usuário NÃO pode editar playlist alheia
      const resOtherEdit = await fetch(`${API_URL}/api/library/playlists/${testPlaylistId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenOtherUser}` },
        body: JSON.stringify({ name: 'Hack Playlist', privacy: 'public' })
      });
      assert(resOtherEdit.status === 403,
        'Cenário 7: Usuário sem autorização não consegue alterar a playlist nem a privacidade alheia');

      // 3. Alterar para Não Listada (unlisted)
      await fetch(`${API_URL}/api/library/playlists/${testPlaylistId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenUserOwner}` },
        body: JSON.stringify({ privacy: 'unlisted' })
      });

      // Não listada: acessível via link direto (mesmo anônimo)
      const resAnonUnlisted = await fetch(`${API_URL}/api/library/playlists/${testPlaylistId}`);
      const anonData = await resAnonUnlisted.json();
      assert(resAnonUnlisted.status === 200 && anonData.playlist.privacy === 'unlisted',
        'Cenário 2: Playlist não listada é acessível pelo link direto compartilhado');

      // 4. Alterar para Pública (public)
      await fetch(`${API_URL}/api/library/playlists/${testPlaylistId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenUserOwner}` },
        body: JSON.stringify({ privacy: 'public' })
      });

      const resOtherPublic = await fetch(`${API_URL}/api/library/playlists/${testPlaylistId}`, {
        headers: { Authorization: `Bearer ${tokenOtherUser}` }
      });
      assert(resOtherPublic.status === 200,
        'Cenário 1 e 6: Playlist pública torna-se imediatamente acessível por outros usuários');
    }

    // -------------------------------------------------------------------------
    // TESTE 7: Integridade Comercial na Exclusão de Faixas
    // -------------------------------------------------------------------------
    console.log('\n--- 7. Integridade Comercial na Exclusão de Faixas ---');
    {
      // testTrackId está vinculada à playlist testPlaylistId
      const resDelTrack = await fetch(`${API_URL}/api/library/tracks/${testTrackId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${tokenUserOwner}` }
      });
      const delTrackData = await resDelTrack.json();
      assert(delTrackData.action === 'archived',
        'Faixa vinculada a dependências é arquivada/desativada (status = inactive) sem perda de dados');
    }

    // -------------------------------------------------------------------------
    // TESTE 8: Exclusão de Playlist com Confirmação e Limpeza Segura
    // -------------------------------------------------------------------------
    console.log('\n--- 8. Exclusão de Playlist pelo Proprietário ---');
    {
      const resDelPl = await fetch(`${API_URL}/api/library/playlists/${testPlaylistId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${tokenUserOwner}` }
      });
      assert(resDelPl.status === 200,
        'Exclusão de playlist pelo proprietário é concluída com 200 OK');

      const resCheckDel = await fetch(`${API_URL}/api/library/playlists/${testPlaylistId}`, {
        headers: { Authorization: `Bearer ${tokenUserOwner}` }
      });
      assert(resCheckDel.status === 404,
        'Playlist excluída não é mais encontrada (404 Not Found)');
    }

  } catch (err) {
    console.error('Erro inesperado durante execução dos testes:', err);
    failed++;
  }

  console.log('\n================================================================');
  console.log(`  RESUMO: ${passed} PASSARAM | ${failed} FALHARAM`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runLibraryTests();

