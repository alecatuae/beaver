# Scripts de Migração Beaver v2.0

Este diretório contém os scripts necessários para migrar o banco de dados e sincronizar os dados entre o MariaDB e o Neo4j para a versão 2.0 do Beaver.

## Visão Geral

A migração para a versão 2.0 envolve várias mudanças significativas no schema do banco de dados, incluindo:

- Introdução de novas entidades: Environment, Team, ComponentInstance, ADRParticipant, etc.
- Alteração do modelo de ADR para suportar múltiplos participantes
- Conversão de enums para tabelas de lookup (ex: RoadmapType)
- Alterações nos tipos de dados para usar enums no banco de dados

## Scripts Disponíveis

### `run_migration.js`

Script principal que orquestra todos os passos da migração em sequência. Este é o único script que você precisa executar.

```bash
node run_migration.js
```

Este script:
1. Faz backup do banco de dados atual
2. Executa as migrações do schema do Prisma
3. Popula dados iniciais para as novas entidades
4. Sincroniza todos os dados entre MariaDB e Neo4j
5. Atualiza referências e corrige possíveis problemas

### `v2_migration.js`

Script responsável pela migração inicial dos dados:
- Cria ambientes padrão (development, homologation, production)
- Cria times padrão (Network, Operations, Platform)
- Gera instâncias de componentes para cada ambiente
- Migra proprietários de ADRs para o novo modelo de participantes
- Cria tipos de roadmap padrão

### `sync_neo4j.js`

Script para sincronizar todos os dados entre MariaDB e Neo4j:
- Sincroniza ambientes, times e suas relações
- Sincroniza instâncias de componentes e suas relações
- Sincroniza participantes de ADRs
- Sincroniza relações entre ADRs e instâncias de componentes
- Verifica a integridade dos dados

### `update_references.js`

Script para atualizar referências entre entidades:
- Associa componentes sem time a um time padrão
- Atualiza status de termos do glossário para usar enums
- Atualiza níveis de log para usar enums
- Corrige ADRs sem participantes
- Cria associações entre ADRs e instâncias de componentes

## Execução Manual

Se preferir executar os scripts manualmente em vez de usar o orquestrador:

1. Aplicar migrações do Prisma:
```bash
cd ../../
npx prisma migrate dev --name v2_0_schema_update
```

Ou, alternativamente, executar o SQL diretamente:
```bash
cd ../../
npx prisma db execute --file ./prisma/migrations/v2_0_schema_update/migration.sql
```

2. Executar scripts de migração na ordem:
```bash
node v2_migration.js
node sync_neo4j.js
node update_references.js
```

## Backups

O script orquestrador faz backup automático do banco antes de iniciar a migração. Os backups são armazenados no diretório `api/backups` com timestamp no nome do arquivo.

## Troubleshooting

- **Erro "shadow database"**: O script tentará automaticamente uma abordagem alternativa que executa o SQL diretamente.
- **Erros de permissão**: Verifique se o usuário do banco de dados tem permissões suficientes para criar/alterar tabelas e colunas.
- **Erros de conexão com Neo4j**: Verifique se o Neo4j está em execução e acessível com as credenciais fornecidas. 