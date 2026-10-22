# 📜 Convenções de Código e Controle de Versão

Este documento reúne os padrões obrigatórios para escrita de código, nomenclaturas e histórico do repositório.

---

## 1. Nomenclatura

* **Pastas e Arquivos de Configuração:** Sempre em `kebab-case` (`auth-service.ts`, `button-group.module.css`).
* **Componentes React:** Sempre em `PascalCase` (`UserProfile.jsx`, `PlayerBar.tsx`).
* **Funções e Variáveis:** Sempre em `camelCase` (`fetchTracks`, `cartSubtotal`).
* **Constantes e Variáveis de Ambiente:** Sempre em `UPPER_SNAKE_CASE` (`API_URL`, `JWT_SECRET`).
* **Custom Hooks React:** Sempre com prefixo `use` em `camelCase` (`useAuth`, `usePlayerState`).
* **Tabelas do Banco:** No plural em `snake_case` (`users`, `companies`, `company_tracks`).
* **Colunas do Banco:** Em `snake_case` (`full_name`, `created_at`, `company_id`).

---

## 2. Conventional Commits

Todas as mensagens de commit devem seguir o padrão:

```text
<tipo>(<escopo>): <descrição em minúsculas e modo imperativo>
```

### Tipos Aceitos

* **`feat`**: Nova funcionalidade para o usuário final.
* **`fix`**: Correção de um erro ou comportamento inesperado.
* **`docs`**: Atualizações na documentação ou arquivos em `docs/`.
* **`style`**: Ajustes de formatação, espaços e pontuações (sem impacto na lógica).
* **`refactor`**: Reestruturação de código que não altera o comportamento externo.
* **`perf`**: Otimizações de desempenho e carregamento.
* **`test`**: Inclusão ou modificação de testes automatizados.
* **`chore`**: Atualizações de build, dependências ou tarefas operacionais.

---

## 3. Branches

* `main` — Branch de produção, sempre estável.
* `feature/<nome-curto>` — Desenvolvimento de novas funcionalidades.
* `fix/<nome-curto>` — Correção de bugs.
* `hotfix/<nome-curto>` — Correções emergenciais em produção.
