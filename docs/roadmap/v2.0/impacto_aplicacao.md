# Impacto na Aplicação

## Backend / ORM (Prisma, etc.)

- Reconstruir enums como tabelas (`RoadmapType`, `Environment`) ou utilizar tabelas de lookup.
- Adicionar modelo `TRMLayer` e relações.
- Remover o campo `ownerId` em `ADR`.
- Refatorar serviços que gravavam `component.env` ou liam `owner_id`.

## GraphQL / REST

- Novos tipos/queries:
  - `layers`
  - `categoriesByLayer`
  - `componentInstances`
- As mutations de `ADR` agora exigem lista de participantes:
  ```graphql
  [{ userId, role }]
  ```

## Frontend

- Dropdowns que antes usavam enums `Env` ou `RoadmapType` devem buscar dados de forma assíncrona nas tabelas correspondentes.
- Tela de TRM com navegação:
  ```
  Layer → Category → Component
  ```
- Formulário de ADR:
  - Novo step “Participantes” para escolha de owner, reviewer etc.

## ETL / Seeds de Dados

Antes de rodar o novo script em uma base já populada, execute a migração:

```sql
INSERT INTO TRMLayer (name) VALUES ('Infrastructure'),('Platform'),('Application');

UPDATE Category SET layer_id = 1 WHERE layer_id IS NULL;  -- ajuste temporário

INSERT INTO Environment(name)
SELECT DISTINCT env FROM Component;

-- Depois, copie os valores dos enums para as tabelas correspondentes
-- e converta Component.env → environment_id
```

- Gerar registros iniciais na tabela `RoadmapType` para refletir os valores do enum legado, mantendo os mesmos nomes.

## Conclusão

O novo script **não é compatível plug-and-play** com o schema original (`mariadb_schema.sql`). Ele introduz:

- Mudança de enums para tabelas (`Env`, `RoadmapType`).
- Nova obrigatoriedade de chave estrangeira (`layer_id`), bloqueando inserts antigos.
- Remoção da coluna `owner_id`, exigindo ajustes no código.

### Requisitos para evitar perda de dados ou falhas de build:

- Executar migrações de dados para preencher:
  - `Environment`
  - `TRMLayer`
  - `RoadmapType`
  - `ADR_Participant`
- Refatorar ORM, API e UI para refletir as novas tabelas e chaves estrangeiras.
- Garantir execução em ambiente **MariaDB 10.5+** (necessário para uso de campos JSON e `CHECK` triggers).

> Cumpridas essas etapas, o novo esquema trará benefícios como visão hierárquica via TRM, suporte a múltiplos ambientes e backlog unificado, sem riscos de inconsistência funcional.
