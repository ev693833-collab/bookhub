# 🚀 Kickstart de Programação — Guia de Boas Práticas

> **Objetivo:** Registrar as diretrizes, padrões e convenções recomendadas antes de iniciar o desenvolvimento de qualquer projeto — desde a modelagem de dados e arquitetura até convenções de commits, documentação e design system.

---

## 📑 Sumário

1. [Estrutura de Pastas do Projeto](#1-estrutura-de-pastas-do-projeto)
2. [A Pasta `docs/`](#2-a-pasta-docs)
3. [ADRs (Architecture Decision Records)](#3-adrs-architecture-decision-records)
4. [Modelagem de Banco de Dados](#4-modelagem-de-banco-de-dados)
5. [Backend](#5-backend)
6. [Frontend](#6-frontend)
7. [Design System](#7-design-system)
8. [Git Flow e Convenções](#8-git-flow-e-convenções)
9. [Outras Boas Práticas e Checklist de Kickoff](#9-outras-boas-práticas-e-checklist-de-kickoff)

---

## 1. Estrutura de Pastas do Projeto

A estrutura de diretórios comunica a **intenção** do software. Antes de escrever a primeira linha de código, define-se a organização do repositório.

### Monorepo vs. Polyrepo

* **Monorepo:** Frontend, backend e pacotes utilitários no mesmo repositório, em diretórios dedicados (`/frontend`, `/backend` ou `/apps`, `/packages`).
  * *Vantagens para Solo Dev:* Menos alternância de contexto, tipos compartilhados sem necessidade de publicar no npm, deploy e controle de versão coordenados em um só lugar.
* **Polyrepo:** Repositórios separados para cada aplicação/serviço.
  * *Quando usar:* Equipes independentes com ciclos de deploy completamente autônomos.
* **Recomendação geral:** Para desenvolvedores solo ou equipes enxutas, o monorepo reduz drasticamente a fricção diária.

### Estrutura Sugerida

```text
projeto/
├── apps/
│   ├── web/                     # Aplicação Frontend
│   └── api/                     # Aplicação Backend
├── packages/                    # Código compartilhado entre apps
│   ├── shared-types/            # Tipagens e interfaces TypeScript comuns
│   └── design-system/           # Tokens e componentes de UI reutilizáveis
├── docs/                        # Documentação viva do projeto (ver Seção 2)
│   ├── adr/                     # Registros de decisões arquiteturais
│   ├── architecture/            # Diagramas e modelagens
│   └── api/                     # Especificação e contratos de API (OpenAPI)
├── .github/                     # Workflows de CI/CD, templates de PR e Issues
├── docker-compose.yml           # Ambiente local unificado (DB, Redis, etc.)
├── .env.example                 # Modelo de variáveis de ambiente obrigatórias
└── README.md                    # Visão geral e instruções para rodar o projeto
```

### Boas Práticas de Organização

1. **Nomenclatura em `kebab-case`:** Pastas e arquivos de configuração devem usar letras minúsculas separadas por hífen (`user-profile`, `order-status`), sem espaços ou caracteres especiais.
2. **Separação de responsabilidades:**
   * `config/` → Configurações de ambiente, bancos e serviços externos.
   * `src/` → Código de negócio e regras da aplicação.
   * `tests/` → Testes automatizados (ou colocation como `*.test.ts`).
3. **README por pacote:** Cada aplicação ou pacote interno deve possuir seu próprio `README.md` detalhando como executá-la e testá-la isoladamente.
4. **Variáveis de Ambiente:** Sempre manter um `.env.example` versionado e atualizado. **Nunca versionar arquivos `.env` reais**.

---

## 2. A Pasta `docs/`

A pasta `docs/` centraliza todo o conhecimento que não é código-fonte, mas que é vital para o ciclo de vida do software:

```text
docs/
├── adr/                         # Architecture Decision Records (histórico de decisões)
│   ├── 0001-escolha-do-banco-de-dados.md
│   └── 0002-estrategia-de-autenticacao.md
├── architecture/
│   ├── diagrama-geral.md        # Visão macro do sistema (C4 Model, fluxogramas)
│   └── modelagem-dados.md       # Diagrama Entidade-Relacionamento e descrição
├── api/
│   └── openapi.yaml             # Contrato da API (Swagger / OpenAPI 3.0)
├── design-system/
│   └── tokens.md                # Paleta, tipografia, elevações e espaçamentos
├── runbooks/                    # Procedimentos operacionais ("Como resolver X em produção")
├── onboarding.md                # Guia passo a passo para configurar o ambiente do zero
└── conventions.md               # Padrões de código, nomenclatura e git commits
```

> 💡 **Princípio Fundamental:**  
> Comentários no código respondem ao **"o quê"** e **"como"**.  
> A documentação em `docs/` responde ao **"por quê"** — contexto, trade-offs, premissas de negócio e restrições que não cabem no código-fonte.

---

## 3. ADRs (Architecture Decision Records)

### O que é um ADR?

Um documento conciso que registra uma decisão arquitetural relevante, o contexto em que foi tomada, as alternativas avaliadas e os impactos positivos e negativos resultantes.

### Por que usar (inclusive em projetos individuais)?

1. **Memória técnica externa:** Em 3 a 6 meses, os motivos exatos de uma escolha técnica são esquecidos.
2. **Elimina retrabalho:** Ao pensar *"por que não usei a tecnologia X?"*, a resposta já está documentada com seus prós e contras.
3. **Onboarding acelerado:** Novos desenvolvedores compreendem a maturidade e evolução do projeto sem reuniões explicativas.
4. **Histórico evolutivo:** ADRs não são editados para mudar decisões; um novo ADR é criado superando o anterior (`Substituído por ADR-000X`).

### Quando criar um ADR?

* **Criar:** Escolha do banco de dados, estratégia de autenticação (JWT vs. Sessão/OAuth), protocolo de API (REST vs. GraphQL), motor de mensageria ou padrão de deploy.
* **Não criar:** Decisões triviais ou facilmente reversíveis (nome de variável, escolha de biblioteca pontual de formatação de datas).

### Template Padrão de ADR

```markdown
# ADR 0001 — [Título Curto e Descritivo da Decisão]

## Status
[Proposto | Aceito | Substituído por ADR-XXXX | Depreciado]

## Contexto
Qual é o problema ou necessidade técnica? Quais são as restrições de tempo, custo, infraestrutura ou conformidade existentes?

## Decisão
Qual solução foi adotada, explicada de forma clara e assertiva.

## Alternativas Consideradas
* **Opção A:** Prós e Contras.
* **Opção B:** Prós e Contras.

## Consequências
* **Pontos positivos:** O que fica mais simples, mais rápido ou mais seguro?
* **Pontos de atenção / Dívidas técnicas:** O que fica mais complexo? Quais manutenções futuras serão exigidas?
```

---

## 4. Modelagem de Banco de Dados

### Antes de Criar a Primeira Tabela

1. **Desenhar o Diagrama ER (Entidade-Relacionamento):** Validar cardinalidades (`1:1`, `1:N`, `N:N`) utilizando ferramentas como [dbdiagram.io](https://dbdiagram.io), Mermaid ou Draw.io.
2. **Definir a estratégia de normalização:** Decidir até qual forma normal (3FN) seguir e registrar eventuais desnormalizações propositais por performance em um ADR.
3. **Mapear campos obrigatórios e opcionais:** Evitar campos genéricos e definir tipos de dados adequados desde o primeiro dia.

### Convenções Recomendadas

* **Tabelas:** No plural e em snake_case (`users`, `companies`, `company_tracks`, `orders`).
* **Chaves Primárias (PK):** `id` padronizado. Avaliar o uso de UUID (`uuidv4` ou `ULID`) para evitar exposição de IDs sequenciais em rotas públicas e facilitar sincronização entre bases.
* **Chaves Estrangeiras (FK):** Nome explícito com tabela no singular + sufixo `_id` (`user_id`, `company_id`).
* **Timestamps:**
  * `created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`
  * `updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`
  * `deleted_at TIMESTAMP NULL` (quando adotada a estratégia de *soft delete*).
* **Migrations:** Todas as alterações estruturais devem ser versionadas em scripts de migration sequenciais. Nunca editar uma migration já executada em produção — crie uma nova migration corretiva.
* **Lógica no banco:** Evitar procedures e triggers complexas. Mantenha as regras de negócio preferencialmente na camada de serviços do backend.

---

## 5. Backend

### Separação de Camadas

```text
api/src/
├── controllers/       # Recepção de requisição (HTTP), validação superficial e resposta
├── services/          # Regras de negócio, cálculos, validações de domínio e orquestrações
├── repositories/      # Acesso a dados, queries SQL, consultas ORM e persistência
├── models/            # Entidades, esquemas de dados e interfaces
├── middlewares/       # Autenticação, rate-limiting, CORS e tratamento de erros
├── routes/            # Definição e mapeamento dos endpoints
└── config/            # Inicialização de banco, variáveis de ambiente e serviços terceiros
```

### Boas Práticas Fundamentais

1. **Configuração via variáveis de ambiente:** Credenciais, chaves de API, portas e URLs de banco devem vir de `process.env`.
2. **Validação estrita de entrada:** Validar schemas de entrada (body, query, params) em uma camada dedicada usando ferramentas robustas (ex: Zod, Joi).
3. **Tratamento centralizado de erros:** Utilizar um middleware global de tratamento de erros para responder sempre com formato JSON padronizado:
   ```json
   {
     "error": "Descrição legível do erro",
     "code": "RESOURCE_NOT_FOUND",
     "details": []
   }
   ```
4. **Contrato de API Documentado:** Manter a documentação OpenAPI/Swagger sincronizada para agilizar a integração do frontend e de parceiros.
5. **Logs estruturados:** Utilizar bibliotecas com saída estruturada (JSON) contendo timestamp, nível de log (`info`, `warn`, `error`) e contexto da operação.

---

## 6. Frontend

### Organização de Diretórios

```text
web/src/
├── components/        # Componentes puramente visuais e reutilizáveis (UI)
├── pages/ ou app/     # Rotas da aplicação (Next.js / Vite)
├── hooks/             # Custom hooks React reutilizáveis (ex: useAuth, useDebounce)
├── services/          # Camada de comunicação HTTP / API (fetch / axios)
├── store/             # Gerenciamento de estado global (Zustand, Context API, Redux)
├── styles/            # Tokens CSS, módulos globais e temas
├── types/             # Definições de tipos TypeScript
└── utils/             # Funções utilitárias puras (formatação, cálculos, validações)
```

### Boas Práticas de Interface e Código

1. **Separação Presentational vs. Container:**
   * *Componentes de Apresentação:* Recebem dados e eventos via `props`. Não realizam chamadas de rede diretamente.
   * *Componentes de Página/Container:* Gerenciam estado, acionam serviços e orquestram a interface.
2. **Centralização de chamadas de API:** Nunca utilizar `fetch` ou `axios` dispersos dentro dos componentes; agrupe-os em funções claras em `services/` (ex: `authService.login()`, `musicService.getAlbums()`).
3. **Convenção de nomenclatura:**
   * Componentes e páginas em **PascalCase** (`UserProfile.jsx`, `PlayerBar.tsx`).
   * Custom hooks sempre iniciados por **`use`** (`usePlayerState.ts`).
   * Utilitários e arquivos auxiliares em **camelCase** ou **kebab-case**.
4. **Gerenciamento de Estado consciente:**
   * Estado local para controle efêmero de UI (modais abertos, abas ativas, inputs de formulário).
   * Estado global apenas para informações compartilhadas entre múltiplas telas não correlacionadas (dados do usuário logado, carrinho, player de reprodução global).

---

## 7. Design System

### Estrutura Recomendada

```text
design-system/
├── tokens/
│   ├── colors.ts       # Cores primárias, secundárias, tons de cinza, alertas
│   ├── typography.ts   # Famílias de fontes, pesos e escalas de tamanho
│   ├── spacing.ts      # Escalas de padding, margin e gap (ex: 4px, 8px, 16px)
│   └── breakpoints.ts  # Pontos de quebra responsivos (sm, md, lg, xl)
├── components/
│   ├── Button/
│   ├── Input/
│   ├── Modal/
│   └── Card/
└── docs/
    └── tokens.md       # Guia visual para desenvolvedores e designers
```

### Diretrizes de Consistência Visual

* **Design Tokens:** Evitar valores soltos no CSS (ex: `#141414`, `16px`). Centralizar em tokens semânticos (`--bg-primary`, `--space-4`, `--color-accent`) para permitir atualizações globais ou temas escuro/claro com facilidade.
* **Componentes Primitivos vs. Compostos:**
  * *Primitivos:* Menores blocos indivisíveis (`Button`, `Badge`, `Icon`, `Input`).
  * *Compostos:* Combinação de primitivos para um contexto específico (`SearchInputWithDropdown`, `LoginCard`).
* **Storybook ou Catálogo Visual:** Documentar os estados dos componentes (hover, active, disabled, loading) para garantir reaproveitamento sem duplicações.

---

## 8. Git Flow e Convenções

### Estratégia de Branches

Para desenvolvedores solo ou equipes ágeis, recomenda-se o **GitHub Flow** ou uma versão simplificada do **Git Flow**:

* `main` → Código estável, testado e pronto para produção.
* `develop` → Linha de integração de desenvolvimento (opcional para times enxutos).
* `feature/*` → Novas funcionalidades (`feature/auth-avatar-menu`, `feature/cart-checkout`).
* `fix/*` → Correções de bugs identificados (`fix/album-release-year`).
* `hotfix/*` → Correções emergenciais diretamente sobre a `main`.

### Nomenclatura de Branches

Sempre em `kebab-case`, descritiva e enxuta:
* `feature/nome-da-funcionalidade`
* `fix/descricao-do-bug`
* `chore/atualizacao-dependencias`
* `docs/adiciona-guia-kickstart`

### Conventional Commits

Padronização de mensagens de commit para gerar changelogs automatizados e facilitar a auditoria do histórico:

```text
<tipo>(<escopo opcional>): <descrição no imperativo e em minúsculas>

[corpo detalhado opcional explicando o contexto e decisões tomadas]

[rodapé opcional com referências a issues ou breaking changes]
```

#### Tabela de Tipos Comuns

| Tipo | Finalidade | Exemplo |
| :--- | :--- | :--- |
| **`feat`** | Nova funcionalidade para o usuário | `feat(cart): adiciona aplicador de cupons no drawer` |
| **`fix`** | Correção de um bug | `fix(player): corrige cálculo de progresso ao pausar` |
| **`docs`** | Alteração em documentação ou comentários | `docs(adr): registra decisão sobre migração para MySQL` |
| **`style`** | Ajustes visuais/formatação sem alteração de lógica | `style(home): alinha espaçamentos dos cards de álbuns` |
| **`refactor`**| Refatoração de código sem alterar comportamento externo | `refactor(auth): desacopla validação de token em helper` |
| **`perf`** | Melhoria de desempenho | `perf(search): adiciona cache em memória com TTL` |
| **`test`** | Adição ou correção de testes automatizados | `test(auth): adiciona testes unitários para login` |
| **`chore`** | Atualização de tarefas, dependências ou configurações | `chore(deps): atualiza pacote bcryptjs para versão mais recente` |

---

## 9. Outras Boas Práticas e Checklist de Kickoff

### Qualidade e Automação

1. **Linting e Formatação:** Configurar ESLint e Prettier desde o início, padronizando regras em todo o repositório.
2. **Git Hooks:** Utilizar Husky e `lint-staged` para garantir que nenhum commit quebre as regras de estilo ou contenha erros sintáticos.
3. **CI/CD:** Configurar uma pipeline mínima no GitHub Actions que execute `npm run lint` e testes unitários em cada Pull Request.

---

### ✅ Checklist de Kickoff (Antes de codar a primeira feature)

- [ ] **1. Estrutura de pastas decidida e inicializada** (Monorepo ou Polyrepo organizado)
- [ ] **2. Arquivo `.env.example` criado e conferido** com todas as variáveis necessárias
- [ ] **3. Modelo inicial de banco de dados desenhado** (Diagrama ER em `docs/architecture/`)
- [ ] **4. Primeiro ADR registrado** formalizando a escolha da stack e do banco de dados
- [ ] **5. Estratégia de branches e convenção de commits alinhada**
- [ ] **6. Linter, Prettier e Git Hooks configurados**
- [ ] **7. README principal do repositório escrito** com instruções claras de instalação local
- [ ] **8. Estrutura de design tokens definida** no frontend para evitar cores e medidas hardcoded
