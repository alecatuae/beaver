# Guia de Migração e Gerenciamento do Neo4j para Beaver v2.0

## Visão Geral

Este documento descreve os processos de migração, sincronização e gerenciamento do banco de dados Neo4j para o Beaver v2.0. O Neo4j é utilizado como banco de dados de grafos para armazenar as relações entre componentes, instâncias, ambientes, ADRs e outras entidades.

## Principais Mudanças na v2.0

- Novos tipos de nós:
  - `Environment`: Ambientes onde componentes podem ser implantados (dev, homologation, prod)
  - `Team`: Times responsáveis por componentes
  - `ComponentInstance`: Instâncias específicas de componentes em ambientes

- Novos relacionamentos:
  - `INSTANTIATES`: De Component para ComponentInstance
  - `DEPLOYED_IN`: De ComponentInstance para Environment
  - `MANAGED_BY`: De Component para Team
  - `PARTICIPATES_IN`: De User para ADR
  - `AFFECTS_INSTANCE`: De ADR para ComponentInstance

## Scripts Disponíveis

### Script de Migração para v2.0

O script `scripts/neo4j/migrate-v2.sh` realiza a migração do Neo4j da v1.x para a v2.0:

1. Aplica constraints e índices do Neo4j v2.0
2. Sincroniza ambientes do MariaDB
3. Sincroniza times do MariaDB
4. Cria relações entre componentes e times
5. Prepara estrutura para instâncias de componentes
6. Cria instâncias de exemplo para componentes existentes
7. Configura relações ADR-participantes
8. Configura relações ADR-instância

#### Uso:

```bash
# Executar a migração
./scripts/neo4j/migrate-v2.sh

# Executar em modo de teste (sem aplicar mudanças permanentes)
./scripts/neo4j/migrate-v2.sh --dry-run

# Exibir ajuda
./scripts/neo4j/migrate-v2.sh --help
```

#### Modo Dry-Run

O modo `--dry-run` permite executar o script para testar todas as etapas sem aplicar mudanças permanentes ao banco de dados Neo4j. Isso é útil para:

1. Verificar a validade das consultas Cypher
2. Identificar possíveis erros antes de executar a migração real
3. Validar a contagem de entidades que seriam criadas
4. Testar o processo de migração em ambiente de desenvolvimento

Ao executar no modo dry-run, o script:
- Executa todas as etapas normalmente
- Registra todos os passos no log
- Mostra a contagem de entidades criadas 
- Ao final, reverte automaticamente todas as mudanças feitas

#### Procedimento de Migração em Produção

Para migrar um ambiente de produção, siga estas etapas:

1. **Faça backup dos dados existentes:**
   ```bash
   ./scripts/neo4j/backup-restore.sh backup neo4j-pre-v2-$(date +%Y%m%d).dump
   ```

2. **Execute o script em modo dry-run para verificar compatibilidade:**
   ```bash
   ./scripts/neo4j/migrate-v2.sh --dry-run
   ```

3. **Se o dry-run for bem-sucedido, execute a migração real:**
   ```bash
   ./scripts/neo4j/migrate-v2.sh
   ```

4. **Verifique os logs para garantir que a migração foi concluída com sucesso:**
   ```bash
   tail -n 50 logs/neo4j-migration.log
   ```

5. **Configure as cores e estilos para visualização:**
   ```bash
   ./scripts/neo4j/setup-visualization.sh
   ```

6. **Verifique a migração acessando o Neo4j Browser:**
   - Acesse http://localhost:7474
   - Execute a consulta `CALL db.schema.visualization()`
   - Verifique se as novas entidades e relacionamentos estão presentes

### Script de Sincronização

O script `scripts/neo4j/sync-neo4j.sh` sincroniza o Neo4j com o MariaDB:

1. Sincroniza ambientes
2. Sincroniza times
3. Sincroniza instâncias de componentes
4. Sincroniza relações ADR-instância
5. Valida a sincronização

#### Uso:

```bash
./scripts/neo4j/sync-neo4j.sh
```

### Script de Backup e Restauração

O script `scripts/neo4j/backup-restore.sh` gerencia backups do Neo4j:

#### Uso:

Para criar um backup:
```bash
./scripts/neo4j/backup-restore.sh backup [nome_arquivo]
```

Para restaurar um backup:
```bash
./scripts/neo4j/backup-restore.sh restore caminho/para/arquivo
```

### Script de Configuração Visual

O script `scripts/neo4j/setup-visualization.sh` configura a visualização do Neo4j Browser:

1. Define cores personalizadas para cada tipo de nó
2. Define estilos para os relacionamentos
3. Configura diâmetros dos nós para melhor visualização
4. Salva a configuração visual como padrão para o banco de dados

#### Uso:

```bash
./scripts/neo4j/setup-visualization.sh
```

Para aplicar os estilos no Neo4j Browser:
1. Acesse http://localhost:7474
2. Faça login (neo4j/beaver12345)
3. No campo de consulta, digite `:play import/set_style.cypher`
4. Execute cada comando de estilo separadamente

## Guia de Solução de Problemas

### Erros Comuns

| Erro | Causa Provável | Solução |
|------|---------------|---------|
| `The client is unauthorized due to authentication failure` | Credenciais incorretas | Verifique as credenciais nos scripts |
| `Node(xxxx) already exists` | Duplicação de nós | Execute `MATCH (n) DETACH DELETE n` e tente novamente |
| `Neo4j container is not running` | Container parado | Inicie com `docker-compose up -d neo4j` |
| `MySQL container is not running` | Container MariaDB parado | O script usará dados padrão, ou inicie com `docker-compose up -d mariadb` |

### Verificação de Integridade

Para verificar a integridade entre MariaDB e Neo4j:

```cypher
// Contagens MariaDB vs Neo4j
MATCH (e:Environment) RETURN count(e) as environments;
MATCH (t:Team) RETURN count(t) as teams;
MATCH (ci:ComponentInstance) RETURN count(ci) as instances;
```

Compare com as contagens do MariaDB usando:

```sql
SELECT COUNT(*) FROM Environment;
SELECT COUNT(*) FROM Team;
SELECT COUNT(*) FROM Component_Instance;
```

### Verificando Logs de Migração

Todos os logs de migração são armazenados em `logs/neo4j-migration.log`. Para visualizar:

```bash
# Ver os últimos 50 registros do log
tail -n 50 logs/neo4j-migration.log

# Buscar por erros no log
grep "erro" -i logs/neo4j-migration.log

# Verificar estatísticas de migração
grep "Resultados da validação" -A 10 logs/neo4j-migration.log
```

## Integração API-Neo4j

A integração entre a API e o Neo4j é gerenciada através:

1. **Middleware Prisma**: Sincroniza automaticamente alterações do MariaDB para o Neo4j
2. **Cliente Neo4j**: Implementado em `api/src/db/neo4j_integration_v2.ts`
3. **Validação de Integridade**: Função `validateIntegrity()` verifica consistência entre bancos

## Consultas Úteis

### Visualização de Instâncias por Ambiente

```cypher
MATCH (ci:ComponentInstance)-[:DEPLOYED_IN]->(e:Environment {name: "development"})
MATCH (c:Component)-[:INSTANTIATES]->(ci)
RETURN c, ci, e
```

### Visualização de ADRs e Instâncias Afetadas

```cypher
MATCH (a:ADR)-[r:AFFECTS_INSTANCE]->(ci:ComponentInstance)
MATCH (c:Component)-[:INSTANTIATES]->(ci)
MATCH (ci)-[:DEPLOYED_IN]->(e:Environment)
RETURN a, r, ci, c, e
```

### Visualizar Componentes por Time

```cypher
MATCH (c:Component)-[:MANAGED_BY]->(t:Team {name: "Platform"})
RETURN c.name as component, c.status as status
```

### Esquema do Banco de Dados

```cypher
CALL db.schema.visualization()
```

## Monitoramento e Manutenção

### Verificação Periódica de Integridade

Após a migração inicial, é recomendado executar verificações periódicas de integridade:

```bash
# Sincronizar dados (útil após operações em massa no MariaDB)
./scripts/neo4j/sync-neo4j.sh

# Verificar integridade via API
curl -X POST http://localhost:3000/api/admin/neo4j/validate-integrity
```

### Backups Programados

Configure backups automáticos usando cron:

```bash
# Adicione ao crontab (crontab -e)
# Fazer backup diário às 2:00 AM
0 2 * * * cd /caminho/para/beaver && ./scripts/neo4j/backup-restore.sh backup neo4j-daily-$(date +\%Y\%m\%d).dump
```

## Notas Adicionais

- O Neo4j Browser está disponível em http://localhost:7474
- Login padrão: neo4j/beaver12345
- Os logs de migração ficam em `logs/neo4j-migration.log`

## Referências

- [Documentação Neo4j](https://neo4j.com/docs/)
- [Cypher Query Language](https://neo4j.com/developer/cypher/)
- [Documentação do Schema Neo4j v2.0](./neo4j_schema_v2.0_pt_br.md) 