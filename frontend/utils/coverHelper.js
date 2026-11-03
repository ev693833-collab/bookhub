/**
 * coverHelper.js
 * Utilitário universal e infalível de resolução de capas oficiais em alta definição
 * para o DevSongs. Garante que nenhuma faixa ou álbum seja exibido sem capa,
 * com capas trocadas ou com placeholders cinzas (discos vazios) do Deezer.
 */

export const CANONICAL_COVERS_MAP = {
  'flowespacial': 'https://cdn-images.dzcdn.net/images/cover/6a607b99dfcb2dcd32f787ed0e11bf41/500x500-000000-80-0-0.jpg',
  'qvvjfa': 'https://cdn-images.dzcdn.net/images/cover/ca1787fb655df1405ff3bebea7c6add8/1000x1000-000000-80-0-0.jpg',
  'quantasvezesvocejabioamado': 'https://cdn-images.dzcdn.net/images/cover/ca1787fb655df1405ff3bebea7c6add8/1000x1000-000000-80-0-0.jpg',
  'otemponaopara': 'https://cdn-images.dzcdn.net/images/cover/0f61ba029f3a14618b64e32bc0fd1559/1000x1000-000000-80-0-0.jpg',
  'otemponaoparaaovivo': 'https://cdn-images.dzcdn.net/images/cover/0f61ba029f3a14618b64e32bc0fd1559/1000x1000-000000-80-0-0.jpg',
  'otemponaoparaoshowcompletoaovivo': 'https://cdn-images.dzcdn.net/images/cover/649e4ac67b395aa59903eb5a0eaa620f/1000x1000-000000-80-0-0.jpg',
  'ideologia': 'https://cdn-images.dzcdn.net/images/cover/b3421c83bafa3634fa7ce3475cb895e0/1000x1000-000000-80-0-0.jpg',
  'precisodizerqueteamo': 'https://cdn-images.dzcdn.net/images/cover/c5a02b4e539a856c34331002dd9814dd/500x500-000000-80-0-0.jpg',
  'redhotrio': 'https://cdn-images.dzcdn.net/images/cover/c5a02b4e539a856c34331002dd9814dd/500x500-000000-80-0-0.jpg',
  'superpowers': 'https://cdn-images.dzcdn.net/images/cover/0d571082af7c78114321031d7f84d331/1000x1000-000000-80-0-0.jpg',
  'neverenough': 'https://cdn-images.dzcdn.net/images/cover/0d571082af7c78114321031d7f84d331/1000x1000-000000-80-0-0.jpg',
  'indaclub': 'https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/6e/56/af/6e56af83-bdff-56c2-7c6a-b30cd0d356ce/06UMGIM08757.rgb.jpg/600x600bb.jpg',
  'getrichordietryin': 'https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/6e/56/af/6e56af83-bdff-56c2-7c6a-b30cd0d356ce/06UMGIM08757.rgb.jpg/600x600bb.jpg',
  'amanhecer': 'https://cdn-images.dzcdn.net/images/cover/927397ea14b00eba92454a88ec4f352d/1000x1000-000000-80-0-0.jpg',
  'icarus': 'https://cdn-images.dzcdn.net/images/cover/927397ea14b00eba92454a88ec4f352d/1000x1000-000000-80-0-0.jpg',
  'se': 'https://cdn-images.dzcdn.net/images/cover/9c20912f7f7754d1c0e334dbfb1731bb/500x500-000000-80-0-0.jpg',
  'coisadeacender': 'https://cdn-images.dzcdn.net/images/cover/9c20912f7f7754d1c0e334dbfb1731bb/500x500-000000-80-0-0.jpg',
  'finalfeliz': 'https://cdn-images.dzcdn.net/images/cover/919ea70f4fe87ed0455fb356813f49f8/500x500-000000-80-0-0.jpg',
  'leve': 'https://cdn-images.dzcdn.net/images/cover/919ea70f4fe87ed0455fb356813f49f8/500x500-000000-80-0-0.jpg',
  'quenemmare': 'https://cdn-images.dzcdn.net/images/cover/22b9a69d0ac7d5951ced1302bc7674d3/500x500-000000-80-0-0.jpg',
  'm4': 'https://cdn-images.dzcdn.net/images/cover/2001711833ffbd1db9c156bc2422e929/500x500-000000-80-0-0.jpg',
  '100molho': 'https://cdn-images.dzcdn.net/images/cover/823c311b28a72801b809da4d99c621f4/500x500-000000-80-0-0.jpg',
  'issoetrap': 'https://cdn-images.dzcdn.net/images/cover/823c311b28a72801b809da4d99c621f4/500x500-000000-80-0-0.jpg',
  'luzcamaeacao': 'https://cdn-images.dzcdn.net/images/cover/6646c5f4c6b60b0ddd4f00987623437c/500x500-000000-80-0-0.jpg',
  'caosdlx': 'https://cdn-images.dzcdn.net/images/cover/6646c5f4c6b60b0ddd4f00987623437c/500x500-000000-80-0-0.jpg',
  'girassoisdevangogh': 'https://cdn-images.dzcdn.net/images/cover/0421054a6a7d8cb4e52dd27ff4deef2c/500x500-000000-80-0-0.jpg',
  'bluesman': 'https://cdn-images.dzcdn.net/images/cover/0421054a6a7d8cb4e52dd27ff4deef2c/500x500-000000-80-0-0.jpg',
  'solto': 'https://cdn-images.dzcdn.net/images/cover/10ba01b01c2e8517166d7f2270a7d454/1000x1000-000000-80-0-0.jpg',
  'omeninoquequeriaserdeus': 'https://cdn-images.dzcdn.net/images/cover/10ba01b01c2e8517166d7f2270a7d454/1000x1000-000000-80-0-0.jpg',
  'nu': 'https://cdn-images.dzcdn.net/images/cover/4df1597321ee02c46b995bf7746e3bb5/500x500-000000-80-0-0.jpg',
  'eu': 'https://cdn-images.dzcdn.net/images/cover/4df1597321ee02c46b995bf7746e3bb5/500x500-000000-80-0-0.jpg',
  'rico': 'https://cdn-images.dzcdn.net/images/cover/4df1597321ee02c46b995bf7746e3bb5/500x500-000000-80-0-0.jpg',
  'nos': 'https://cdn-images.dzcdn.net/images/cover/4df1597321ee02c46b995bf7746e3bb5/500x500-000000-80-0-0.jpg',
  'oquemchega': 'https://cdn-images.dzcdn.net/images/cover/4df1597321ee02c46b995bf7746e3bb5/500x500-000000-80-0-0.jpg',
  'procuroalguem': 'https://cdn-images.dzcdn.net/images/cover/86427da38e1e93f57746964d3851f9fb/500x500-000000-80-0-0.jpg',
  'historiasdaminhaarea': 'https://cdn-images.dzcdn.net/images/cover/86427da38e1e93f57746964d3851f9fb/500x500-000000-80-0-0.jpg',
  'maquinadotempo': 'https://cdn-images.dzcdn.net/images/cover/9ad06bcb9f0bfe52bbd5e6ff464e4ca4/1000x1000-000000-80-0-0.jpg',
  'onelesslonelygirl': 'https://cdn-images.dzcdn.net/images/cover/a40e48bd5bae166186dc04c57efdae7a/500x500-000000-80-0-0.jpg',
  'myworld': 'https://cdn-images.dzcdn.net/images/cover/a40e48bd5bae166186dc04c57efdae7a/500x500-000000-80-0-0.jpg',
  'yummy': 'https://cdn-images.dzcdn.net/images/cover/8d54ffac647e9e40cd91686c8a906de6/1000x1000-000000-80-0-0.jpg',
  'sonhodeamor': 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/c5/8c/e6/c58ce6ca-8b7b-8cbf-7513-c57b1535636e/8721416112201.jpg/1000x1000bb.jpg',
  'praiadorosaacustico': 'https://is1-ssl.mzstatic.com/image/thumb/Music118/v4/aa/45/98/aa4598c4-c24b-7dfe-7ffc-7c11e09f3356/886447438053.jpg/1000x1000bb.jpg',
  'tacomessadai': 'https://cdn-images.dzcdn.net/images/cover/a6ee408695fa151f6d05a318bb0fb7e9/1000x1000-000000-80-0-0.jpg',
  'bomenovo': 'https://cdn-images.dzcdn.net/images/cover/a6ee408695fa151f6d05a318bb0fb7e9/1000x1000-000000-80-0-0.jpg',
  'palaciodelona': 'https://cdn-images.dzcdn.net/images/cover/a6ee408695fa151f6d05a318bb0fb7e9/1000x1000-000000-80-0-0.jpg',
  'sorock2': 'https://cdn-images.dzcdn.net/images/cover/b91d171dee51eb10eb799382fad0acec/1000x1000-000000-80-0-0.jpg',
  'sorock3': 'https://cdn-images.dzcdn.net/images/cover/04984889a4024d617d8fcaab1267365d/1000x1000-000000-80-0-0.jpg',
  'pensandoemmim': 'https://cdn-images.dzcdn.net/images/cover/31b86e4b5a5dc901013878cb70cdb66d/500x500-000000-80-0-0.jpg',
  'acabouacabou': 'https://cdn-images.dzcdn.net/images/cover/9801cd5811ab4677837a17edbaefb505/1000x1000-000000-80-0-0.jpg',
  'desgracadagostosamaldita': 'https://cdn-images.dzcdn.net/images/cover/3ef64652d6f7da29ce07bc38a11093a3/1000x1000-000000-80-0-0.jpg',
  'vagabundodeluxo': 'https://cdn-images.dzcdn.net/images/cover/3ef64652d6f7da29ce07bc38a11093a3/1000x1000-000000-80-0-0.jpg',
  '300no7': 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/4a/74/0a/4a740a7a-d14a-af72-90d7-a12232742116/cover.jpg/1000x1000bb.jpg',
  'penumbra': 'https://cdn-images.dzcdn.net/images/cover/5c415f9e2f05ad4d3d5781ad52f66aca/1000x1000-000000-80-0-0.jpg',
  'suedehead': 'https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/56/0d/b9/560db9d0-dbad-d868-8685-c2f8d570f5c1/mzi.npznsatp.jpg/1000x1000bb.jpg',
  'vivahate': 'https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/56/0d/b9/560db9d0-dbad-d868-8685-c2f8d570f5c1/mzi.npznsatp.jpg/1000x1000bb.jpg',
  'dosprediosdeluxe': 'https://cdn-images.dzcdn.net/images/cover/b300e05a1b78466f15c81677e4ba33d9/1000x1000-000000-80-0-0.jpg',
  'odonodolugar': 'https://cdn-images.dzcdn.net/images/cover/5c415f9e2f05ad4d3d5781ad52f66aca/1000x1000-000000-80-0-0.jpg',
  'inocentedemotape': 'https://cdn-images.dzcdn.net/images/cover/e768aeb719303899f8143d055b374896/1000x1000-000000-80-0-0.jpg',
  'quantomaiseucomomaisfomedanomeuprato': 'https://cdn-images.dzcdn.net/images/cover/dd262384105ac39d04c7d5a18ce287de/1000x1000-000000-80-0-0.jpg',
  'quantomaiseucomomaisfomeeusinto': 'https://cdn-images.dzcdn.net/images/cover/dd262384105ac39d04c7d5a18ce287de/1000x1000-000000-80-0-0.jpg'
};

export const DEFAULT_FALLBACK_COVER = 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png';

const cleanStr = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');

/**
 * Retorna a capa limpa, válida e oficial do item musical (faixa, álbum ou playlist).
 * Detecta hashes de placeholders (como discos cinzas do Deezer) e recupera a imagem canônica.
 */
export function getSafeCover(item) {
  if (!item) return DEFAULT_FALLBACK_COVER;

  const titleKey = cleanStr(item.title);
  const albumKey = cleanStr(item.album || item.album_title || item.album_name);

  // 1. Verificar se existe correspondência exata no mapa canônico
  if (titleKey && CANONICAL_COVERS_MAP[titleKey]) {
    return CANONICAL_COVERS_MAP[titleKey];
  }
  if (albumKey && CANONICAL_COVERS_MAP[albumKey]) {
    return CANONICAL_COVERS_MAP[albumKey];
  }

  // 2. Extrair URL original
  const rawUrl = item.cover || item.cover_url || item.cover_image || item.album_cover || item.albumCover || '';

  // 3. Verificar se é URL inválida ou hash de placeholder Deezer/genérico
  const isPlaceholder = !rawUrl ||
    rawUrl.includes('42078a6ff6071ef28ba866bbf30fe357') ||
    rawUrl.includes('f9f60f6064f20ec719c83fa1091b5c4f') ||
    rawUrl.includes('d41d8cd98f00b204e9800998ecf8427e') ||
    rawUrl.includes('2c5f1fa5d70f23a9d949fe52c785d1e2') ||
    rawUrl.includes('43372c0c7493a3c2069255a6d97c7689') ||
    rawUrl.includes('78aeb644e5428aa8cf2ee1f7cebca224') ||
    rawUrl.includes('7ba9963e63fc494871e84aa3664d60fe') ||
    rawUrl.includes('36be26b0ee117869aa9410115ddab58a') ||
    rawUrl.includes('5f65f3a0937a892b1a5e5fa7a1a48160') ||
    rawUrl.includes('3e09dc090e94bb51ae68e80bc4722aa0') ||
    rawUrl.includes('e0059c1b753aeb18d6a362bf75e8103c') ||
    rawUrl.includes('890458b0932bb493393b392be3ba73e9') ||
    rawUrl.includes('25391c530466487e4922b7a89e138a37') ||
    rawUrl.includes('764d8438b4d8e8bfa17cb1dfa1efc5ee') ||
    rawUrl.includes('50cent.jpg') ||
    rawUrl.includes('logo-devsongs.png');

  if (!isPlaceholder) {
    return rawUrl;
  }

  // 4. Se for placeholder ou nulo, tentar correspondência parcial no catálogo canônico
  for (const [key, cover] of Object.entries(CANONICAL_COVERS_MAP)) {
    if (titleKey && (titleKey.includes(key) || key.includes(titleKey))) {
      return cover;
    }
    if (albumKey && (albumKey.includes(key) || key.includes(albumKey))) {
      return cover;
    }
  }

  return rawUrl || DEFAULT_FALLBACK_COVER;
}
