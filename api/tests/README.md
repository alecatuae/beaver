# Testes para o Beaver API v2.0

Este diretório contém testes automatizados para verificar o funcionamento correto das novas funcionalidades implementadas na versão 2.0 do Beaver.

## Estrutura dos Testes

Os testes estão organizados nos seguintes diretórios:

- `db/`: Testes para integrações com bancos de dados (MariaDB via Prisma e Neo4j)
- `resolvers/`: Testes para resolvers GraphQL
- `utils/`: Testes para funções utilitárias
- `fixtures/`: Arquivos usados nos testes
- `impact/`: Testes de impacto e compatibilidade com v1.x

## Testes Implementados para v2.0

### Testes de Funcionalidades Básicas

1. **Validadores** (`utils/validators.test.ts`)
   - Validação de participantes de ADR (pelo menos um owner)
   - Validação de unicidade de instâncias de componentes por ambiente

2. **Compatibilidade** (`utils/compatibility.test.ts`)
   - Conversão de enums legados para IDs de entidades
   - Tratamento de erros para valores inexistentes

3. **Hashtags do Glossário** (`utils/glossary-hashtags.test.ts`)
   - Extração de referências a termos do glossário em texto
   - Busca de termos no banco de dados
   - Transformação de texto com links para o glossário

### Testes de Integração com Banco de Dados

1. **Neo4j Integration v2** (`db/neo4j_integration_v2.test.ts`)
   - Sincronização de ambientes, times, instâncias
   - Validação de integridade entre MariaDB e Neo4j
   - Correção de discrepâncias

2. **Teams com Neo4j** (`db/team-neo4j-integration.test.ts`)
   - Sincronização de times e membros
   - Hooks do Prisma para sincronização automática

### Testes de Resolvers GraphQL

1. **Component Instance** (`resolvers/component-instance.test.ts`)
   - Mutations para criação de instâncias
   - Queries para busca de instâncias
   - Validações e tratamento de erros

2. **Environment** (`resolvers/environment.test.ts`)
   - CRUD completo para ambientes
   - Validação de nome único
   - Verificação de dependências na exclusão

3. **Team** (`resolvers/team.test.ts`)
   - CRUD completo para times
   - Gerenciamento de membros (adicionar/remover)
   - Verificação de componentes associados na exclusão

4. **ADR Participant** (`resolvers/adr-participant.test.ts`)
   - Adição de participantes a ADRs
   - Remoção de participantes
   - Validação de pelo menos um owner

### Testes de Compatibilidade e Impacto v1.x → v2.0

1. **API Compatibility** (`impact/api-compatibility.test.ts`)
   - Conversão de enums legados para novos IDs
   - Preservação de estrutura de resposta compatível
   - Mapeamento entre campos antigos e novos
   - Tratamento adequado de erros

2. **Resolvers Compatibility** (`impact/resolvers-compatibility.test.ts`)
   - Compatibilidade em queries Component com env
   - Compatibilidade em queries ADR com owner
   - Compatibilidade em RoadmapItems com type
   - Aceitação de parâmetros no formato v1.x
   - Respostas no formato compatível

## Cobertura de Testes

A configuração atual (`jest.config.js`) define um threshold mínimo de cobertura de 70% para branches, funções, linhas e statements. Os testes implementados foram projetados para garantir essa cobertura mínima.

## Executando os Testes

Para executar todos os testes:

```bash
npm test
```

Para executar testes específicos:

```bash
npm test -- --testPathPattern=neo4j_integration
```

Para ver a cobertura de testes:

```bash
npm test -- --coverage
```

## Considerações para Testes Futuros

Para as próximas iterações, considere:

1. Adicionar testes E2E com Playwright
2. Expandir testes de integração para cobrir cenários mais complexos
3. Implementar testes de carga para verificar performance das novas entidades 