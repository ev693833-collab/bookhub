# 📖 Planejamento e Especificação das Rotas da API — BookHub

Este documento define a arquitetura, regras de negócio, dados de entrada, validações e respostas esperadas para as rotas do backend da plataforma **BookHub**. O objetivo é servir como guia técnico canônico antes da implementação dos endpoints.

---

## 📌 Sumário das Entidades

1. [Autenticação e Usuários](#1-entidade-usuários)
2. [Empresas](#2-entidade-empresas)
3. [Relação entre Usuários e Empresas](#3-entidade-relação-usuários-e-empresas)
4. [Categorias](#4-entidade-categorias)
5. [Obras](#5-entidade-obras)

---

## 1. Entidade: Usuários

Gerencia o ciclo de vida dos usuários na plataforma (leitores, autores, administradores e colaboradores).

---

### POST /usuarios

* **Objetivo:** Cadastrar um novo usuário no sistema.
* **Dados de entrada:**
  * **Body (JSON):**
    * `nome` (string, obrigatório)
    * `email` (string, obrigatório, formato de e-mail válido)
    * `senha` (string, obrigatório, mínimo 6 caracteres)
    * `telefone` (string, opcional)
    * `cpf` (string, opcional, 11 dígitos numéricos)
* **Regras de validação:**
  * Todos os campos obrigatórios (`nome`, `email`, `senha`) devem ser preenchidos e não podem ser vazios.
  * O campo `email` deve possuir estrutura de e-mail válida e deve ser único na base de dados (não pode haver duplicidade).
  * A `senha` deve conter no mínimo 6 caracteres.
  * Se o `cpf` for informado, deve conter exatamente 11 dígitos numéricos válidos.
* **Respostas HTTP:**
  * **201 Created:** Usuário cadastrado com sucesso (retorna o objeto do usuário sem o hash da senha).
  * **400 Bad Request:** Dados de entrada inválidos, campos obrigatórios ausentes ou senha menor que 6 caracteres.
  * **409 Conflict:** E-mail ou CPF já cadastrado no sistema.

---

### POST /usuarios/login

* **Objetivo:** Autenticar um usuário e fornecer o token de acesso (JWT).
* **Dados de entrada:**
  * **Body (JSON):**
    * `email` (string, obrigatório)
    * `senha` (string, obrigatório)
* **Regras de validação:**
  * `email` e `senha` são de preenchimento obrigatório.
  * O usuário deve existir na base e estar com status ativo.
* **Respostas HTTP:**
  * **200 OK:** Login bem-sucedido. Retorna token JWT e os dados básicos do usuário.
  * **400 Bad Request:** E-mail ou senha não informados na requisição.
  * **401 Unauthorized:** Credenciais inválidas (e-mail inexistente ou senha incorreta).
  * **403 Forbidden:** Conta de usuário desativada ou suspensa.

---

### GET /usuarios

* **Objetivo:** Listar os usuários cadastrados com suporte a filtros e paginação.
* **Dados de entrada:**
  * **Query Params:**
    * `pagina` (inteiro, opcional, padrão: 1)
    * `limite` (inteiro, opcional, padrão: 10)
    * `nome` (string, opcional, busca textual parcial)
    * `email` (string, opcional, busca textual parcial)
    * `status` (string, opcional, ex: `ativo` ou `inativo`)
* **Regras de validação:**
  * A rota exige autenticação prévia via Bearer Token.
  * Apenas usuários com permissão de administrador (`admin`) podem listar todos os usuários da base.
* **Respostas HTTP:**
  * **200 OK:** Lista de usuários retornada com sucesso (com metadados de paginação: total, páginas, página atual).
  * **401 Unauthorized:** Token ausente, inválido ou expirado.
  * **403 Forbidden:** Usuário autenticado não possui privilégios de administrador.

---

### GET /usuarios/:id

* **Objetivo:** Obter detalhes do perfil de um usuário específico.
* **Dados de entrada:**
  * **Parâmetros de Rota (`params`):**
    * `id` (inteiro ou UUID, obrigatório na URL)
* **Regras de validação:**
  * O `id` informado deve ser um identificador válido.
  * O usuário só pode visualizar o próprio perfil, a menos que possua permissão de administrador.
* **Respostas HTTP:**
  * **200 OK:** Dados do usuário retornados com sucesso.
  * **400 Bad Request:** Identificador inválido na URL.
  * **401 Unauthorized:** Usuário não autenticado.
  * **403 Forbidden:** Usuário tentando visualizar dados de outro usuário sem permissão administrativa.
  * **404 Not Found:** Usuário não encontrado no sistema.

---

### PUT /usuarios/:id

* **Objetivo:** Atualizar as informações cadastrais de um usuário.
* **Dados de entrada:**
  * **Parâmetros de Rota (`params`):**
    * `id` (obrigatório)
  * **Body (JSON):**
    * `nome` (string, obrigatório)
    * `telefone` (string, opcional)
    * `cpf` (string, opcional)
* **Regras de validação:**
  * O usuário só pode alterar o próprio registro (ou ter papel de administrador).
  * `nome` é obrigatório e não pode ser vazio.
  * Não é permitido alterar a senha por esta rota (utilizar rota específica de redefinição de senha).
* **Respostas HTTP:**
  * **200 OK:** Usuário atualizado com sucesso.
  * **400 Bad Request:** Dados enviados inválidos ou campos obrigatórios ausentes.
  * **401 Unauthorized:** Usuário não autenticado.
  * **403 Forbidden:** Sem permissão para alterar dados deste usuário.
  * **404 Not Found:** Usuário não localizado para atualização.

---

### DELETE /usuarios/:id

* **Objetivo:** Desativar ou remover um usuário do sistema.
* **Dados de entrada:**
  * **Parâmetros de Rota (`params`):**
    * `id` (obrigatório)
* **Regras de validação:**
  * O usuário autenticado deve ser o próprio titular ou administrador.
  * O usuário não pode ser excluído fisicamente se possuir vínculos financeiros ou transações ativas (aplica-se exclusão lógica / inativação).
* **Respostas HTTP:**
  * **200 OK** ou **204 No Content:** Usuário removido/inativado com sucesso.
  * **401 Unauthorized:** Não autenticado.
  * **403 Forbidden:** Sem autorização para exclusão.
  * **404 Not Found:** Usuário inexistente.

---

## 2. Entidade: Empresas

Representa as editoras, livrarias parceiras, selos de publicação e organizações vinculadas ao BookHub.

---

### POST /empresas

* **Objetivo:** Cadastrar uma nova empresa na plataforma.
* **Dados de entrada:**
  * **Body (JSON):**
    * `razao_social` (string, obrigatório)
    * `nome_fantasia` (string, obrigatório)
    * `cnpj` (string, obrigatório, 14 dígitos numéricos)
    * `email_contato` (string, obrigatório, formato de e-mail válido)
    * `telefone` (string, opcional)
    * `endereco` (objeto ou string, opcional)
* **Regras de validação:**
  * `razao_social`, `nome_fantasia`, `cnpj` e `email_contato` são obrigatórios.
  * O `cnpj` deve ser válido e exclusivo na plataforma (não pode existir outra empresa com o mesmo CNPJ).
  * Exige autenticação de administrador do sistema ou usuário credenciado para abertura de empresa parceira.
* **Respostas HTTP:**
  * **201 Created:** Empresa cadastrada com sucesso.
  * **400 Bad Request:** CNPJ inválido, campos obrigatórios ausentes ou e-mail de contato em formato incorreto.
  * **401 Unauthorized:** Usuário não autenticado.
  * **403 Forbidden:** Usuário não autorizado a cadastrar empresas.
  * **409 Conflict:** Empresa com este CNPJ já existente no sistema.

---

### GET /empresas

* **Objetivo:** Listar as empresas parceiras cadastradas.
* **Dados de entrada:**
  * **Query Params:**
    * `pagina` (inteiro, opcional, padrão: 1)
    * `limite` (inteiro, opcional, padrão: 10)
    * `busca` (string, opcional, pesquisa por razão social ou nome fantasia)
    * `status` (string, opcional, `ativa` ou `inativa`)
* **Regras de validação:**
  * Rota pública para consulta de parceiros ou restrita a usuários autenticados para gestão.
* **Respostas HTTP:**
  * **200 OK:** Lista de empresas retornada com sucesso.
  * **400 Bad Request:** Parâmetros de paginação com valores inválidos (ex: números negativos).

---

### GET /empresas/:id

* **Objetivo:** Consultar o cadastro completo de uma empresa específica.
* **Dados de entrada:**
  * **Parâmetros de Rota (`params`):**
    * `id` (inteiro ou UUID, obrigatório na URL)
* **Regras de validação:**
  * O `id` informado deve corresponder a uma empresa existente no banco.
* **Respostas HTTP:**
  * **200 OK:** Detalhes da empresa retornados com sucesso.
  * **404 Not Found:** Empresa com o ID informado não foi encontrada.

---

### PUT /empresas/:id

* **Objetivo:** Atualizar os dados cadastrais da empresa.
* **Dados de entrada:**
  * **Parâmetros de Rota (`params`):**
    * `id` (obrigatório)
  * **Body (JSON):**
    * `razao_social` (string, obrigatório)
    * `nome_fantasia` (string, obrigatório)
    * `email_contato` (string, obrigatório)
    * `telefone` (string, opcional)
    * `endereco` (objeto ou string, opcional)
* **Regras de validação:**
  * Requer permissão de gestor da empresa ou administrador geral da plataforma.
  * O campo `cnpj` não pode ser alterado por esta rota por questões fiscais e de auditoria.
* **Respostas HTTP:**
  * **200 OK:** Empresa atualizada com sucesso.
  * **400 Bad Request:** Dados incompletos ou formatos inválidos.
  * **401 Unauthorized:** Não autenticado.
  * **403 Forbidden:** O usuário autenticado não possui vínculo administrativo com esta empresa.
  * **404 Not Found:** Empresa não encontrada.

---

### DELETE /empresas/:id

* **Objetivo:** Inativar ou remover uma empresa da plataforma.
* **Dados de entrada:**
  * **Parâmetros de Rota (`params`):**
    * `id` (obrigatório)
* **Regras de validação:**
  * Exclusivo para administradores do sistema.
  * Empresas com obras ativas ou vínculos contratuais em andamento não podem sofrer exclusão física (aplica-se inativação lógica).
* **Respostas HTTP:**
  * **200 OK** ou **204 No Content:** Empresa inativada com sucesso.
  * **401 Unauthorized:** Não autenticado.
  * **403 Forbidden:** Sem permissão administrativa geral.
  * **404 Not Found:** Empresa não encontrada.

---

## 3. Entidade: Relação Usuários e Empresas

Controla os vínculos institucionais, papéis, permissões de acesso e colaboração entre usuários e empresas (ex: dono da editora, gestor de catálogo, operador).

---

### POST /empresas/:empresaId/usuarios

* **Objetivo:** Vincular um usuário existente a uma empresa, atribuindo um papel de acesso.
* **Dados de entrada:**
  * **Parâmetros de Rota (`params`):**
    * `empresaId` (obrigatório)
  * **Body (JSON):**
    * `usuario_id` (inteiro ou UUID, obrigatório)
    * `papel` (string, obrigatório, ex: `'admin'`, `'gestor'`, `'operador'`, `'colaborador'`)
* **Regras de validação:**
  * Ambos `empresaId` e `usuario_id` devem existir no banco de dados.
  * O usuário autenticado que realiza o vínculo deve ser administrador da empresa em questão.
  * O usuário a ser vinculado não pode já possuir um vínculo ativo com esta mesma empresa.
  * O campo `papel` deve respeitar os valores permitidos pelo sistema.
* **Respostas HTTP:**
  * **201 Created:** Usuário vinculado à empresa com sucesso.
  * **400 Bad Request:** Papel inválido ou campos obrigatórios ausentes.
  * **401 Unauthorized:** Usuário não autenticado.
  * **403 Forbidden:** Usuário não tem permissão de gerenciar membros desta empresa.
  * **404 Not Found:** Empresa ou Usuário não localizado.
  * **409 Conflict:** Usuário já se encontra vinculado a esta empresa.

---

### GET /empresas/:empresaId/usuarios

* **Objetivo:** Listar todos os colaboradores e membros vinculados a uma empresa.
* **Dados de entrada:**
  * **Parâmetros de Rota (`params`):**
    * `empresaId` (obrigatório)
  * **Query Params:**
    * `papel` (string, opcional, filtro por papel ex: `'gestor'`)
* **Regras de validação:**
  * Acesso restrito a membros autorizados da própria empresa ou administradores do BookHub.
* **Respostas HTTP:**
  * **200 OK:** Lista de membros da empresa retornada com sucesso (incluindo nome, e-mail, papel e data de vinculação).
  * **401 Unauthorized:** Não autenticado.
  * **403 Forbidden:** Usuário não pertence ao quadro administrativo desta empresa.
  * **404 Not Found:** Empresa não encontrada.

---

### GET /usuarios/:usuarioId/empresas

* **Objetivo:** Listar todas as empresas às quais um usuário específico está vinculado.
* **Dados de entrada:**
  * **Parâmetros de Rota (`params`):**
    * `usuarioId` (obrigatório)
* **Regras de validação:**
  * O usuário solicitante deve ser o próprio titular ou administrador geral.
* **Respostas HTTP:**
  * **200 OK:** Lista de empresas vinculadas retornada com sucesso.
  * **401 Unauthorized:** Não autenticado.
  * **403 Forbidden:** Tentativa de visualizar vínculos de terceiros sem permissão.
  * **404 Not Found:** Usuário não encontrado.

---

### PATCH /empresas/:empresaId/usuarios/:usuarioId

* **Objetivo:** Alterar o papel ou permissão de um membro dentro da empresa.
* **Dados de entrada:**
  * **Parâmetros de Rota (`params`):**
    * `empresaId` (obrigatório)
    * `usuarioId` (obrigatório)
  * **Body (JSON):**
    * `papel` (string, obrigatório, ex: `'gestor'` para `'admin'`)
* **Regras de validação:**
  * O vínculo deve existir.
  * O solicitante deve ser gestor/admin da empresa.
  * Não é permitido rebaixar o único administrador ativo da empresa (prevenção de empresa órfã).
* **Respostas HTTP:**
  * **200 OK:** Papel atualizado com sucesso.
  * **400 Bad Request:** Novo papel inválido ou não informado.
  * **401 Unauthorized:** Não autenticado.
  * **403 Forbidden:** Sem autorização para alterar papéis de membros.
  * **404 Not Found:** Vínculo não encontrado entre a empresa e o usuário.

---

### DELETE /empresas/:empresaId/usuarios/:usuarioId

* **Objetivo:** Desvincular um usuário de uma empresa.
* **Dados de entrada:**
  * **Parâmetros de Rota (`params`):**
    * `empresaId` (obrigatório)
    * `usuarioId` (obrigatório)
* **Regras de validação:**
  * Exige que o solicitante seja administrador da empresa ou o próprio usuário que deseja se desvincular voluntariamente.
  * A empresa não pode ficar sem nenhum administrador responsável.
* **Respostas HTTP:**
  * **200 OK** ou **204 No Content:** Vínculo removido com sucesso.
  * **400 Bad Request:** Tentativa de remover o único administrador da empresa.
  * **401 Unauthorized:** Não autenticado.
  * **403 Forbidden:** Sem permissão para remover o membro.
  * **404 Not Found:** Vínculo inexistente.

---

## 4. Entidade: Categorias

Classifica e categoriza as obras disponibilizadas no catálogo (ex: Ficção, Tecnologia, Romance, Ciências, Biografia).

---

### POST /categorias

* **Objetivo:** Cadastrar uma nova categoria no acervo do BookHub.
* **Dados de entrada:**
  * **Body (JSON):**
    * `nome` (string, obrigatório)
    * `descricao` (string, opcional)
* **Regras de validação:**
  * `nome` é obrigatório, deve ter no mínimo 3 caracteres e deve ser único na plataforma.
  * Apenas usuários com privilégios administrativos podem cadastrar categorias.
* **Respostas HTTP:**
  * **201 Created:** Categoria cadastrada com sucesso.
  * **400 Bad Request:** Nome da categoria ausente ou com tamanho insuficiente.
  * **401 Unauthorized:** Usuário não autenticado.
  * **403 Forbidden:** Usuário sem permissão para criar categorias.
  * **409 Conflict:** Categoria com este mesmo nome já cadastrada.

---

### GET /categorias

* **Objetivo:** Listar todas as categorias cadastradas para consulta e filtros do catálogo.
* **Dados de entrada:**
  * **Query Params:**
    * `busca` (string, opcional, busca por nome)
* **Regras de validação:**
  * Rota pública: acessível por todos os usuários e visitantes.
* **Respostas HTTP:**
  * **200 OK:** Lista de categorias cadastradas retornada com sucesso.

---

### GET /categorias/:id

* **Objetivo:** Obter detalhes de uma categoria específica.
* **Dados de entrada:**
  * **Parâmetros de Rota (`params`):**
    * `id` (obrigatório na URL)
* **Regras de validação:**
  * O `id` informado deve existir na base.
* **Respostas HTTP:**
  * **200 OK:** Dados da categoria retornados com sucesso.
  * **404 Not Found:** Categoria não encontrada.

---

### PUT /categorias/:id

* **Objetivo:** Atualizar os dados de uma categoria existente.
* **Dados de entrada:**
  * **Parâmetros de Rota (`params`):**
    * `id` (obrigatório)
  * **Body (JSON):**
    * `nome` (string, obrigatório)
    * `descricao` (string, opcional)
* **Regras de validação:**
  * `nome` é obrigatório e não pode colidir com o nome de outra categoria já existente.
  * Acesso restrito a administradores.
* **Respostas HTTP:**
  * **200 OK:** Categoria atualizada com sucesso.
  * **400 Bad Request:** Dados inválidos ou nome não informado.
  * **401 Unauthorized:** Não autenticado.
  * **403 Forbidden:** Sem permissão administrativa.
  * **404 Not Found:** Categoria não encontrada.
  * **409 Conflict:** Outra categoria já utiliza o novo nome fornecido.

---

### DELETE /categorias/:id

* **Objetivo:** Excluir uma categoria.
* **Dados de entrada:**
  * **Parâmetros de Rota (`params`):**
    * `id` (obrigatório)
* **Regras de validação:**
  * Acesso restrito a administradores.
  * **Regra de Integridade Referencial:** Uma categoria **não pode ser excluída** se existirem obras associadas a ela.
* **Respostas HTTP:**
  * **200 OK** ou **204 No Content:** Categoria excluída com sucesso.
  * **400 Bad Request:** A categoria possui obras vinculadas e não pode ser deletada antes de desassociá-las.
  * **401 Unauthorized:** Não autenticado.
  * **403 Forbidden:** Sem permissão.
  * **404 Not Found:** Categoria não encontrada.

---

## 5. Entidade: Obras

Representa os livros, e-books, audiolivros e publicações disponíveis na plataforma BookHub.

---

### POST /obras

* **Objetivo:** Cadastrar uma nova obra no catálogo do BookHub.
* **Dados de entrada:**
  * **Body (JSON):**
    * `titulo` (string, obrigatório)
    * `subtitulo` (string, opcional)
    * `autor` (string, obrigatório)
    * `categoria_id` (inteiro ou UUID, obrigatório)
    * `empresa_id` (inteiro ou UUID, obrigatório)
    * `isbn` (string, opcional, formato numérico válido)
    * `ano_publicacao` (inteiro, opcional, ano válido menor ou igual ao atual)
    * `sinopse` (string, opcional)
    * `preco` (número decimal, obrigatório, maior ou igual a zero)
    * `formato` (string, opcional, ex: `'digital'`, `'fisico'`, `'audio'`)
    * `estoque` (inteiro, opcional, padrão: 0 se for físico)
* **Regras de validação:**
  * `titulo`, `autor`, `categoria_id`, `empresa_id` e `preco` são campos estritamente obrigatórios.
  * A `categoria_id` deve corresponder a uma categoria existente no banco.
  * A `empresa_id` deve corresponder a uma empresa ativa no banco.
  * O usuário autenticado deve possuir vínculo ativo e com permissão de publicação na empresa dona da obra (ou ser administrador geral).
  * O `preco` deve ser um valor numérico não negativo.
  * Se o `isbn` for informado, deve ser único no catálogo.
* **Respostas HTTP:**
  * **201 Created:** Obra cadastrada com sucesso. Retorna o registro criado.
  * **400 Bad Request:** Faltando campos obrigatórios, preço negativo ou tipos incompatíveis.
  * **401 Unauthorized:** Usuário não autenticado.
  * **403 Forbidden:** Usuário não tem permissão para cadastrar obras em nome desta empresa.
  * **404 Not Found:** `categoria_id` ou `empresa_id` informados não existem.
  * **409 Conflict:** Já existe uma obra cadastrada com este mesmo ISBN.

---

### GET /obras

* **Objetivo:** Listar e pesquisar obras com suporte a múltiplos filtros, busca textual e paginação.
* **Dados de entrada:**
  * **Query Params:**
    * `busca` (string, opcional, busca textual por título ou autor)
    * `categoria_id` (inteiro/UUID, opcional, filtro por categoria)
    * `empresa_id` (inteiro/UUID, opcional, filtro por editora/empresa)
    * `autor` (string, opcional)
    * `preco_min` (número, opcional)
    * `preco_max` (número, opcional)
    * `ordenar_por` (string, opcional, ex: `'preco'`, `'titulo'`, `'data'`)
    * `ordem` (string, opcional, `'asc'` ou `'desc'`)
    * `pagina` (inteiro, opcional, padrão: 1)
    * `limite` (inteiro, opcional, padrão: 12)
* **Regras de validação:**
  * Rota pública para consulta geral do catálogo.
  * Valores de paginação e filtros numéricos devem ser positivos.
* **Respostas HTTP:**
  * **200 OK:** Lista de obras retornada com sucesso (com metadados de paginação).
  * **400 Bad Request:** Parâmetros de filtro com formatos inválidos.

---

### GET /obras/:id

* **Objetivo:** Obter todos os detalhes e ficha técnica de uma obra específica.
* **Dados de entrada:**
  * **Parâmetros de Rota (`params`):**
    * `id` (obrigatório na URL)
* **Regras de validação:**
  * O `id` da obra deve existir no sistema.
* **Respostas HTTP:**
  * **200 OK:** Detalhes completos da obra retornados com sucesso (incluindo dados da categoria e da empresa publicadora).
  * **404 Not Found:** Obra não encontrada.

---

### PUT /obras/:id

* **Objetivo:** Atualizar as informações cadastrais e comerciais de uma obra.
* **Dados de entrada:**
  * **Parâmetros de Rota (`params`):**
    * `id` (obrigatório)
  * **Body (JSON):**
    * `titulo` (string, obrigatório)
    * `subtitulo` (string, opcional)
    * `autor` (string, obrigatório)
    * `categoria_id` (inteiro ou UUID, obrigatório)
    * `preco` (número, obrigatório)
    * `sinopse` (string, opcional)
    * `estoque` (inteiro, opcional)
* **Regras de validação:**
  * A obra deve existir.
  * O usuário solicitante deve ser gestor da empresa responsável pela obra ou administrador da plataforma.
  * A `categoria_id` informada deve existir.
  * O `preco` deve ser um número maior ou igual a zero.
* **Respostas HTTP:**
  * **200 OK:** Obra atualizada com sucesso.
  * **400 Bad Request:** Dados inválidos ou campos obrigatórios ausentes.
  * **401 Unauthorized:** Não autenticado.
  * **403 Forbidden:** O usuário não possui autorização para alterar obras desta empresa.
  * **404 Not Found:** Obra ou Categoria não localizada.

---

### DELETE /obras/:id

* **Objetivo:** Remover ou arquivar uma obra do catálogo.
* **Dados de entrada:**
  * **Parâmetros de Rota (`params`):**
    * `id` (obrigatório)
* **Regras de validação:**
  * O usuário deve ter privilégios na empresa detentora da obra ou ser administrador da plataforma.
  * Se a obra já foi adquirida por leitores ou possui pedidos vinculados, a obra deve ser arquivada/desativada logicamente para preservar o histórico de compra dos usuários.
* **Respostas HTTP:**
  * **200 OK** ou **204 No Content:** Obra removida ou arquivada com sucesso.
  * **401 Unauthorized:** Não autenticado.
  * **403 Forbidden:** Sem permissão para excluir esta obra.
  * **404 Not Found:** Obra não encontrada.

---

## 📊 Matriz Resumo de Códigos de Status HTTP

| Código | Significado | Aplicação no BookHub |
| :--- | :--- | :--- |
| **200 OK** | Sucesso na requisição | Consultas (`GET`) e atualizações bem-sucedidas (`PUT`, `PATCH`). |
| **201 Created** | Recurso criado | Cadastros bem-sucedidos (`POST /usuarios`, `POST /obras`, etc.). |
| **204 No Content** | Sucesso sem conteúdo | Exclusões bem-sucedidas (`DELETE`). |
| **400 Bad Request** | Erro de validação | Campos obrigatórios ausentes, tipos incorretos ou regras violadas. |
| **401 Unauthorized** | Não autenticado | Ausência de Token JWT ou credenciais inválidas. |
| **403 Forbidden** | Sem autorização | Usuário autenticado tentando acessar/modificar recurso de outra empresa. |
| **404 Not Found** | Não encontrado | ID informado não existe na base de dados. |
| **409 Conflict** | Conflito de integridade | Tentativa de duplicar dados únicos (E-mail, CPF, CNPJ, ISBN ou Vínculo já existente). |
