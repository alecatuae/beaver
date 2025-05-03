# Boas Práticas para Neo4j no Beaver

Este documento apresenta diretrizes e recomendações para trabalhar com o banco de dados Neo4j no projeto Beaver, fornecendo orientações específicas para desenvolvedores que precisam manipular o grafo de arquitetura.

## Princípios Gerais

Neo4j é utilizado no Beaver para armazenar e consultar o grafo de arquitetura, onde:
- **Nós (Nodes)**: Representam componentes da arquitetura
- **Relacionamentos (Relationships)**: Representam conexões entre componentes
- **Propriedades (Properties)**: Metadados dos nós e relacionamentos

## Manipulação de Nós (Components)

### Criação e Atualização

Para criar ou atualizar componentes no Neo4j:

```cypher
// Recomendado: MERGE para criar ou atualizar
MERGE (c:Component {id: $id})
ON CREATE SET 
  c.name = $name,
  c.description = $description,
  c.valid_from = datetime($validFrom),
  c.valid_to = datetime($validTo)
ON MATCH SET
  c.name = $name,
  c.description = $description,
  c.valid_from = datetime($validFrom),
  c.valid_to = datetime($validTo)
```

### Busca de Componentes

Para buscar componentes de forma eficiente:

```cypher
// Busca por ID (recomendado, usa índice)
MATCH (c:Component {id: $id})
RETURN c

// Busca por nome (parcial)
MATCH (c:Component)
WHERE c.name CONTAINS $namePart
RETURN c
```

## Requisitos para Criação de Relacionamentos

Para garantir a integridade do grafo, todo relacionamento no Neo4j deve seguir os seguintes requisitos:

### 1. Existência dos Nós

**Requisito**: Os nós de origem e destino DEVEM existir antes de criar um relacionamento.

✅ **Correto**:
```cypher
// Verificar existência antes de criar
MATCH (source:Component {id: $sourceId})
MATCH (target:Component {id: $targetId})
CREATE (source)-[r:DEPENDS_ON]->(target)
```

❌ **Incorreto**:
```cypher
// Criar relacionamento sem verificar nós
CREATE (source:Component {id: $sourceId})-[r:DEPENDS_ON]->(target:Component {id: $targetId})
```

### 2. Direção do Relacionamento

**Requisito**: Todo relacionamento DEVE ter uma direção clara.

✅ **Correto**:
```cypher
// Direção explícita
CREATE (source)-[r:CONNECTS_TO]->(target)
```

❌ **Incorreto**:
```cypher
// Direção indefinida ou bidirecional incorreta
CREATE (source)-[r:CONNECTS_TO]-(target)
```

### 3. Tipo de Relacionamento

**Requisito**: Todo relacionamento DEVE ter um tipo definido.

✅ **Correto**:
```cypher
// Tipo específico em CAIXA ALTA
CREATE (source)-[r:DEPENDS_ON {since: '2023-01-01'}]->(target)
```

❌ **Incorreto**:
```cypher
// Sem tipo definido
CREATE (source)-[r]->(target)
```

### 4. Propriedades em Relacionamentos

**Prática Recomendada**: Use propriedades para enriquecer relacionamentos.

✅ **Correto**:
```cypher
// Adicionar metadados úteis
CREATE (source)-[r:COMMUNICATES_WITH {
  protocol: 'HTTP',
  port: 8080,
  createdAt: datetime()
}]->(target)
```

### 5. Evitar Relacionamentos Duplicados

**Prática Recomendada**: Previna a criação de relacionamentos idênticos entre os mesmos nós.

✅ **Correto**:
```cypher
// Usar MERGE para garantir unicidade
MERGE (source:Component {id: $sourceId})
MERGE (target:Component {id: $targetId})
MERGE (source)-[r:DEPENDS_ON]->(target)
ON CREATE SET r.createdAt = datetime()
```

### 6. Uso de Índices e Constraints

**Prática Recomendada**: Crie índices para campos frequentemente pesquisados.

```cypher
// Criar índice para busca rápida por ID
CREATE INDEX ON :Component(id)

// Criar constraint de unicidade
CREATE CONSTRAINT ON (c:Component) ASSERT c.id IS UNIQUE
```

### 7. Permissões Adequadas

**Requisito**: Usuários devem ter permissões para criar relacionamentos.

```javascript
// Verificação de permissão no código
if (!userHasPermission(user, 'CREATE_RELATIONSHIP')) {
  throw new Error('Permissão negada para criar relacionamento');
}
```

## Consultas Comuns

### Componentes e Seus Relacionamentos

```cypher
// Buscar componente e seus relacionamentos de saída
MATCH (c:Component {id: $id})-[r]->(target)
RETURN c, r, target

// Buscar componente e seus relacionamentos de entrada
MATCH (source)-[r]->(c:Component {id: $id})
RETURN source, r, c
```

### Análise de Impacto

```cypher
// Encontrar todos os componentes que dependem direta ou indiretamente do componente X
MATCH (c:Component {id: $id})<-[:DEPENDS_ON*1..3]-(dependent)
RETURN dependent.name, dependent.id
```

## Tratamento de IDs

O Neo4j gera IDs internos para nós e relacionamentos que podem ser grandes (maiores que 2^32). Para lidar com esses valores:

```typescript
// Ao recuperar IDs do Neo4j, converta para string
const idValue = record.get('id').toString();

// Nos parâmetros da API, use tipo string para IDs de relacionamentos
interface RelationType {
  id: string;
  sourceId: number;
  targetId: number;
  // ...
}
```

## Transações

Para operações complexas, use transações explícitas:

```typescript
const session = driver.session();
const txc = session.beginTransaction();

try {
  // Múltiplas operações
  await txc.run(query1, params1);
  await txc.run(query2, params2);
  
  // Commit se tudo estiver ok
  await txc.commit();
} catch (error) {
  // Rollback em caso de erro
  await txc.rollback();
  throw error;
} finally {
  await session.close();
}
```

# Comentários em Relacionamentos no Neo4j

## É possível adicionar comentários?

- Não é possível adicionar comentários tradicionais (`//` ou `#`) diretamente no Cypher.
- Porém, é possível armazenar comentários como **propriedades** no relacionamento.

## Exemplo de uso:

```cypher
MATCH (a:Component {name: "Frontend"}), (b:Component {name: "Backend"})
CREATE (a)-[:DEPENDS_ON {comment: "Frontend needs Backend APIs to function properly"}]->(b)


## Considerações de Performance

1. **Prefira Parâmetros**: Sempre use parâmetros em vez de concatenação de strings
2. **Limite Resultados**: Use `LIMIT` para consultas que podem retornar muitos resultados
3. **Profiling**: Use `PROFILE` antes de consultas para analisar planos de execução
4. **Cache de Resultados**: Implemente cache para consultas frequentes e com resultados estáveis

## Conclusão

Seguindo essas práticas, você garantirá que o grafo de arquitetura no Neo4j permanecerá consistente, performático e refletirá com precisão as relações entre os componentes do sistema arquitetado. 