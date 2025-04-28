# Requisitos para Criação de Relacionamentos no Neo4j

Este documento técnico detalha os requisitos específicos e implementações recomendadas para a criação de relacionamentos no banco de dados Neo4j dentro do sistema Beaver.

## Visão Geral

No Neo4j, relacionamentos representam conexões significativas entre nós. Na arquitetura do Beaver, os relacionamentos representam as conexões entre componentes de software, infraestrutura e outros elementos de arquitetura.

**Importante**: Os relacionamentos são gerenciados exclusivamente no Neo4j e não possuem representação no banco MariaDB. Somente os componentes têm integração entre MariaDB e Neo4j, seguindo a arquitetura definida para o sistema.

## Requisitos Fundamentais

### 1. Existência Prévia dos Nós

**Descrição**: Os nós (componentes) de origem e destino devem existir no banco de dados Neo4j antes de criar um relacionamento entre eles.

**Implementação no Beaver**:

```typescript
// Em neo4jClient.ts
async createRelation(sourceId: number, targetId: number, type: string, properties: any = {}): Promise<IRelation> {
  // Verificação de existência primeiro
  const existInNeo4j = await this.run(`
    MATCH (source:Component {id: $sourceId})
    MATCH (target:Component {id: $targetId})
    RETURN count(source) > 0 AND count(target) > 0 as exist
  `, { sourceId, targetId });

  if (!existInNeo4j.records[0].get('exist')) {
    throw new Error('Componente não encontrado no Neo4j');
  }
  
  // Procedemos com a criação apenas se ambos os nós existirem
  // ...resto do código...
}
```

**Alternativas Recomendadas**:
- Usar `MERGE` para nós de origem e destino antes de criar o relacionamento
- Usar transações para verificar e criar em uma única operação atômica

### 2. Direção Definida do Relacionamento

**Descrição**: Todos os relacionamentos no Neo4j devem ter uma direção clara, indicada pela sintaxe `(a)-[:TIPO]->(b)`.

**Implementação no Beaver**:

```cypher
// Sintaxe correta para direção definida
MATCH (source:Component {id: $sourceId})
MATCH (target:Component {id: $targetId})
CREATE (source)-[r:${type}]->(target)
```

**Significado Semântico**:
- `CONNECTS_TO`: O componente de origem conecta-se ao componente de destino
- `DEPENDS_ON`: O componente de origem depende do componente de destino
- `PART_OF`: O componente de origem é parte do componente de destino

**Obs**: A direção é crítica para a análise de impacto e rastreamento de dependências.

### 3. Tipo de Relacionamento Obrigatório

**Descrição**: Todo relacionamento deve ter um tipo específico que define a natureza da conexão.

**Tipos de Relacionamento Suportados**:

| Tipo | Descrição | Uso |
|------|-----------|-----|
| `CONNECTS_TO` | Conexão direta entre componentes | Frontend → API |
| `DEPENDS_ON` | Dependência funcional | Serviço → Banco de Dados |
| `PART_OF` | Relação de composição | Microserviço → Sistema |
| `COMMUNICATES_WITH` | Comunicação entre componentes | Serviço A → Serviço B |
| `RELATED_TO` | Relacionamento genérico | Qualquer conexão lógica |

**Validação na API**:

```typescript
// No schema GraphQL
builder.inputType('RelationInput', {
  fields: (t) => ({
    sourceId: t.int({ required: true }),
    targetId: t.int({ required: true }),
    type: t.string({ required: true }), // Tipo é obrigatório
    // ...
  }),
});
```

### 4. Propriedades Opcionais nos Relacionamentos

**Descrição**: Relacionamentos podem ter propriedades adicionais que fornecem metadados ou contexto.

**Propriedades Padrão**:
- `createdAt`: Data/hora de criação do relacionamento
- `updatedAt`: Data/hora da última atualização
- `properties`: Objeto JSON contendo propriedades personalizadas (incluindo `description`)

**Exemplo de Uso**:

```typescript
// Adicionando propriedades a um relacionamento
const properties = {
  description: "Conexão segura via HTTPS",
  port: 443,
  protocol: "HTTPS",
  isEncrypted: true
};

await neo4jClient.createRelation(
  sourceId,
  targetId,
  "CONNECTS_TO",
  properties
);
```

### 5. Prevenção de Relacionamentos Duplicados

**Descrição**: O sistema deve evitar a criação de múltiplos relacionamentos idênticos entre os mesmos nós.

**Implementação Futura Recomendada**:

```cypher
// Em vez do atual CREATE, usar MERGE
MATCH (source:Component {id: $sourceId})
MATCH (target:Component {id: $targetId})
MERGE (source)-[r:${type}]->(target)
ON CREATE SET 
  r.properties = $properties,
  r.createdAt = datetime($now),
  r.updatedAt = datetime($now)
ON MATCH SET
  r.properties = $properties,
  r.updatedAt = datetime($now)
```

**Obs**: A implementação atual usa `CREATE`, o que permite relacionamentos duplicados. Uma melhoria futura deve implementar verificação de unicidade.

### 6. Índices e Constraints para Otimização

**Descrição**: Índices e constraints melhoram o desempenho e garantem a integridade dos dados.

**Scripts de Inicialização Recomendados**:

```cypher
// Índice para busca rápida de componentes por ID
CREATE INDEX component_id_index IF NOT EXISTS FOR (c:Component) ON (c.id);

// Constraint de unicidade para IDs de componentes
CREATE CONSTRAINT component_id_unique IF NOT EXISTS ON (c:Component) ASSERT c.id IS UNIQUE;
```

**Benefícios**:
- Buscas mais rápidas para operações MATCH por ID
- Garantia de unicidade para prevenir duplicação de componentes
- Melhoria de performance em grafos grandes

### 7. Permissões de Usuário

**Descrição**: Usuários precisam ter permissões adequadas para criar relacionamentos.

**Verificação de Permissões**:

```typescript
// No resolver GraphQL
builder.mutationField('createRelation', (t) =>
  t.field({
    // ...
    resolve: async (_, { input }, context) => {
      // Verificar autenticação
      if (!context.user) {
        throw new Error('Autenticação necessária');
      }
      
      // Verificar permissão
      if (!['admin', 'architect'].includes(context.user.role)) {
        throw new Error('Permissão insuficiente para criar relacionamentos');
      }
      
      // Proceder com a criação...
    }
  })
);
```

## Tratamento de IDs de Relacionamentos

O Neo4j gera IDs internos para relacionamentos que podem ser maiores que 2^32, causando problemas em sistemas que usam inteiros de 32 bits.

**Solução Implementada**:

```typescript
// Ao recuperar ID do Neo4j
const result = await session.run(`
  // ...query...
  RETURN 
    toString(id(r)) AS id,  // Converter para string
    // outros campos...
`);

// Na tipagem TypeScript
interface IRelation {
  id: string | number;  // Suportar ambos os tipos
  // ...outros campos...
}
```

## Operações de Relacionamentos

Todas as operações CRUD (Criação, Leitura, Atualização e Exclusão) de relacionamentos são executadas exclusivamente no Neo4j através dos resolvers GraphQL, sem qualquer representação ou operação no MariaDB. Esta abordagem garante:

1. **Consistência de Dados**: Mantém um único ponto de verdade para relacionamentos.
2. **Performance Otimizada**: Operações de grafo são realizadas diretamente no banco específico para esse fim.
3. **Separação Clara de Responsabilidades**: MariaDB gerencia apenas dados de componentes enquanto Neo4j gerencia relacionamentos.

### Fluxo de Operações

#### Criação
A criação de relacionamentos segue estas etapas:
1. O frontend envia a mutation `createRelation` com dados do relacionamento.
2. O resolver verifica a existência dos componentes no Neo4j.
3. O relacionamento é criado exclusivamente no Neo4j via `neo4jClient.createRelation()`.
4. Nenhuma entrada é criada no MariaDB.

#### Atualização
A atualização é implementada através de:
1. Exclusão do relacionamento existente.
2. Criação de um novo relacionamento com os dados atualizados.
3. Preservação da data de criação original.

```typescript
// Em neo4j.ts - método updateRelation
async updateRelation(id: number, sourceId: number, targetId: number, type: string, properties: any = {}): Promise<IRelation> {
  // ... validações ...
  
  const session = this.driver.session();
  try {
    // Primeiro, excluímos o relacionamento existente
    await session.run(`
      MATCH ()-[r]->()
      WHERE id(r) = $id
      DELETE r
    `, { id });

    // Em seguida, criamos um novo relacionamento com os dados atualizados
    // ... resto do código ...
  } 
  // ... tratamento de erros ...
}
```

#### Exclusão
A exclusão é direta no Neo4j:

```typescript
// Em neo4j.ts - método deleteRelation
async deleteRelation(id: number | string): Promise<boolean> {
  // ... verificações ...
  
  try {
    // Verificar existência do relacionamento
    let findResult = await session.run(`
      MATCH ()-[r]->()
      WHERE toString(id(r)) = $id
      RETURN r
    `, { id: originalId });
    
    if (findResult.records.length > 0) {
      // Exclusão direta no Neo4j
      const result = await session.run(`
        MATCH ()-[r]->()
        WHERE toString(id(r)) = $id
        DELETE r
        RETURN count(r) as count
      `, { id: originalId });
      
      // ... processamento do resultado ...
    }
  }
  // ... tratamento de erros ...
}
```

### Recuperação de Dados de Componentes

Os dados dos componentes associados aos relacionamentos (origem e destino) são recuperados diretamente do Neo4j, sem consultar o MariaDB. Isso garante consistência e performance adequada na página de Gerenciamento de Relacionamentos.

```typescript
// No resolver de relacionamentos
source: t.field({
  type: 'Component',
  nullable: true,
  resolve: async (relation) => {
    // Buscar informações do componente diretamente do Neo4j
    try {
      const result = await neo4jClient.run(`
        MATCH (c:Component {id: $id})
        RETURN c.id as id, c.name as name, c.status as status, c.description as description
      `, { id: relation.sourceId });

      if (result.records && result.records.length > 0) {
        const record = result.records[0];
        return {
          id: typeof record.get('id') === 'number' ? record.get('id') : parseInt(record.get('id')),
          name: record.get('name'),
          status: record.get('status'),
          description: record.get('description') || ''
        };
      }
      return null;
    } catch (error) {
      logger.error(`Erro ao buscar componente (ID: ${relation.sourceId}) no Neo4j:`, error);
      return null;
    }
  },
}),
```

## Exemplos Completos

### Criação de Relacionamento

```typescript
// Criação segura de relacionamento com todas as verificações
async function createSecureRelation(sourceId: number, targetId: number, type: string, properties: any = {}) {
  const session = driver.session();
  
  try {
    // 1. Verificar existência dos componentes
    const existCheck = await session.run(`
      MATCH (source:Component {id: $sourceId})
      MATCH (target:Component {id: $targetId})
      RETURN count(source) > 0 AND count(target) > 0 as exist
    `, { sourceId, targetId });
    
    if (!existCheck.records[0].get('exist')) {
      throw new Error('Um ou ambos os componentes não existem');
    }
    
    // 2. Verificar relacionamento duplicado (opcional)
    const duplicateCheck = await session.run(`
      MATCH (source:Component {id: $sourceId})-[r:${type}]->(target:Component {id: $targetId})
      RETURN count(r) > 0 as duplicate
    `, { sourceId, targetId });
    
    if (duplicateCheck.records[0].get('duplicate')) {
      throw new Error('Relacionamento já existe');
    }
    
    // 3. Criar relacionamento com todas as propriedades necessárias
    const now = new Date().toISOString();
    const result = await session.run(`
      MATCH (source:Component {id: $sourceId})
      MATCH (target:Component {id: $targetId})
      CREATE (source)-[r:${type} {
        properties: $properties,
        createdAt: $now,
        updatedAt: $now
      }]->(target)
      RETURN 
        toString(id(r)) AS id,
        type(r) AS type, 
        source.id AS sourceId, 
        target.id AS targetId
    `, { sourceId, targetId, properties, now });
    
    // 4. Processar resultado
    const record = result.records[0];
    return {
      id: record.get('id'),
      type: record.get('type'),
      sourceId: parseInt(record.get('sourceId')),
      targetId: parseInt(record.get('targetId')),
      properties,
      createdAt: new Date(now),
      updatedAt: new Date(now)
    };
  } finally {
    await session.close();
  }
}
```

## Conclusão

A correta implementação destes requisitos garante que o grafo de relacionamentos no Neo4j permaneça consistente, significativo e otimizado para consultas. A arquitetura do sistema Beaver mantém os relacionamentos exclusivamente no Neo4j, sem referência no MariaDB, permitindo uma clara separação de responsabilidades entre os bancos de dados e facilitando a manutenção do sistema. 