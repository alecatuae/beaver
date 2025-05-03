# Fluxo de Consulta de Relacionamentos

Este documento descreve o fluxo completo de consulta de relacionamentos no sistema Beaver, abordando desde a solicitação do cliente até a exibição dos dados na interface do usuário.

## Visão Geral

O processo de consulta de relacionamentos no Beaver envolve os seguintes componentes:

1. **Frontend (Next.js)**: Interface que exibe os dados e permite interação
2. **API GraphQL (Apollo Server)**: Processa as requisições e retorna dados estruturados
3. **Neo4j**: Banco de dados de grafos onde os relacionamentos e componentes são armazenados

```mermaid
sequenceDiagram
    participant User as Usuário
    participant UI as Next.js UI
    participant API as Apollo Server
    participant Neo4j
    
    User->>UI: Acessa página de relacionamentos
    UI->>API: Solicita query GET_RELATIONS
    API->>Neo4j: Verifica conexão e consulta relacionamentos
    alt Conexão com Neo4j bem-sucedida
        Neo4j-->>API: Retorna dados dos relacionamentos
        API->>Neo4j: Para cada relacionamento, busca detalhes dos componentes
        Neo4j-->>API: Retorna dados dos componentes
        API-->>UI: Retorna dados completos dos relacionamentos
        UI-->>User: Exibe cards de relacionamentos
    else Falha na conexão com Neo4j
        Neo4j--xAPI: Erro de conexão
        API-->>API: Encerra o processo com mensagem de erro
        Note right of API: Exibe erro detalhado no console<br/>e encerra o processo com exit(1)
    end
```

## Detalhamento das Etapas

### 1. Solicitação do Cliente

- O usuário acessa a página de relacionamentos em `/relationships`
- O componente React `RelationshipsPage` é carregado
- O hook `useQuery` do Apollo Client é usado para buscar os dados:

```typescript
const { loading, error, data, refetch } = useQuery(GET_RELATIONS, {
  fetchPolicy: 'network-only',
  onError: (error) => {
    console.error('Erro na consulta GraphQL:', error);
  }
});
```

### 2. Definição da Query GraphQL

- A query GraphQL `GET_RELATIONS` é definida para buscar todos os relacionamentos:

```graphql
query GetRelations {
  relations {
    id
    sourceId
    targetId
    type
    properties
    source {
      id
      name
      status
    }
    target {
      id
      name
      status
    }
    createdAt
    updatedAt
  }
}
```

### 3. Processamento no Servidor

- O resolver `relations` no backend processa a requisição:

```typescript
builder.queryField('relations', (t) =>
  t.field({
    type: [RelationType],
    resolve: async () => {
      try {
        const result = await neo4jClient.getRelations();
        return result;
      } catch (error) {
        logger.error('Erro ao buscar relações:', error);
        throw error;
      }
    },
  })
);
```

### 4. Verificação de Conexão com Neo4j

- Antes de qualquer operação, o sistema verifica a conexão com o Neo4j:

```typescript
// Em context.ts
async function initNeo4j() {
  try {
    // Tenta criar uma conexão real com o Neo4j
    const neo4jUrl = process.env.NEO4J_URL || 'bolt://neo4j:7687';
    const neo4jUser = process.env.NEO4J_USER || 'neo4j';
    const neo4jPassword = process.env.NEO4J_PASSWORD || 'beaver12345';
    
    console.log('🔌 Tentando conectar ao Neo4j...');
    console.log(`📡 URL: ${neo4jUrl}`);
    
    // Cria o driver do Neo4j
    const neo4jDriver = driver(
      neo4jUrl,
      auth.basic(neo4jUser, neo4jPassword)
    );
    
    // Testa a conectividade
    await neo4jDriver.verifyConnectivity();
    
    // Cria o cliente Neo4j usando o driver
    neo4jClient = new Neo4jClient(neo4jDriver);
    
    console.log('✅ Conexão com Neo4j estabelecida com sucesso!');
    logger.info('Conexão com Neo4j estabelecida com sucesso!');
    
    return neo4jClient;
  } catch (error) {
    // Mensagens de erro no console e nos logs
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('❌ ERRO CRÍTICO: Falha ao conectar com Neo4j');
    console.error(`❗ Mensagem de erro: ${errorMessage}`);
    console.error('📢 O aplicativo requer uma conexão com Neo4j para funcionar corretamente.');
    console.error('🔍 Verifique se:');
    console.error('   - O servidor Neo4j está em execução');
    console.error('   - As configurações de URL, usuário e senha estão corretas');
    console.error('   - Não há regras de firewall bloqueando a conexão');
    
    logger.error(`Falha ao conectar com Neo4j: ${errorMessage}`);
    
    // Encerra o processo com erro
    process.exit(1);
  }
}
```

### 5. Busca de Relacionamentos no Neo4j

- O Neo4jClient busca todos os relacionamentos no banco de dados:

```typescript
async getRelations(): Promise<IRelation[]> {
  const session = this.driver.session();
  try {
    const result = await session.run(`
      MATCH (source:Component)-[r]->(target:Component)
      RETURN 
        toString(id(r)) AS id, 
        type(r) AS type, 
        source.id AS sourceId, 
        target.id AS targetId,
        r.properties AS properties,
        COALESCE(r.createdAt, toString(datetime())) AS createdAt,
        COALESCE(r.updatedAt, toString(datetime())) AS updatedAt
    `);

    return result.records.map(record => {
      // Sempre manter o ID como string
      const idValue = record.get('id').toString();
      return {
        id: idValue,
        type: record.get('type'),
        sourceId: typeof record.get('sourceId') === 'number' ? record.get('sourceId') : parseInt(record.get('sourceId')),
        targetId: typeof record.get('targetId') === 'number' ? record.get('targetId') : parseInt(record.get('targetId')),
        properties: record.get('properties') || {},
        createdAt: new Date(record.get('createdAt')),
        updatedAt: new Date(record.get('updatedAt'))
      };
    });
  } catch (error) {
    logger.error('Erro ao obter relacionamentos:', error);
    throw error;
  } finally {
    await session.close();
  }
}
```

### 6. Resolução de Campos Adicionais

- Para cada relacionamento, os campos `source` e `target` são resolvidos para obter informações dos componentes conectados:

```typescript
source: t.field({
  type: 'Component',
  nullable: true,
  resolve: async (relation) => {
    // Buscar informações do componente de origem
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
      logger.error(`Erro ao buscar componente de origem (ID: ${relation.sourceId}):`, error);
      return null;
    }
  },
}),
```

### 7. Resposta ao Frontend

- O resolver retorna os dados completos dos relacionamentos para o cliente
- O Apollo Client no frontend recebe a resposta da query
- O hook `useQuery` em `page.tsx` atualiza o estado com os dados recebidos

```typescript
const { loading, error, data, refetch } = useQuery(GET_RELATIONS, {
  fetchPolicy: 'network-only',
  onError: (error) => {
    console.error('Erro na consulta GraphQL:', error);
  }
});
```

### 8. Processamento e Exibição na UI

- Os dados dos relacionamentos são transformados para o formato esperado pela UI:
  ```typescript
  const relationships = data?.relations?.map((relation: any) => ({
    ...relation,
    created_at: new Date(relation.createdAt),
    updated_at: new Date(relation.updatedAt)
  })) || [];
  ```

- Os relacionamentos são filtrados com base na busca e filtros aplicados pelo usuário:
  ```typescript
  const filteredRelationships = relationships.filter((relationship: RelationType) => {
    const sourceNameMatch = relationship.source?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const targetNameMatch = relationship.target?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const typeMatch = relationship.type.toLowerCase().includes(searchTerm.toLowerCase());
    const descriptionMatch = relationship.properties?.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSearch = sourceNameMatch || targetNameMatch || typeMatch || descriptionMatch;
    const matchesTypeFilter = typeFilter === 'all' || relationship.type === typeFilter;
    
    return matchesSearch && matchesTypeFilter;
  });
  ```

- A interface exibe os relacionamentos em forma de cards:
  ```jsx
  <div 
    key={relationship.id}
    className="bg-card rounded-lg border shadow-sm p-4 cursor-pointer hover:border-primary transition-colors h-[180px] flex flex-col"
    onClick={() => handleRelationshipClick(relationship)}
  >
    <div className="flex items-center justify-between mb-2">
      <h3 className="text-lg font-medium truncate max-w-[70%]">
        {relationship.source?.name || 'Desconhecido'}
      </h3>
    </div>
    <div className="flex items-center text-muted-foreground mb-4">
      <ArrowRight size={16} className="mx-1" />
      <div className="truncate max-w-[70%]">
        {relationship.target?.name || 'Desconhecido'}
      </div>
    </div>
    <span className="inline-block px-2 py-1 text-xs rounded-full bg-primary/10 text-primary">
      {relationship.type.replace(/_/g, ' ')}
    </span>
  </div>
  ```

## Tratamento de IDs e Particularidades

### IDs dos Relacionamentos no Neo4j

- Os IDs dos relacionamentos no Neo4j são convertidos para strings:
  ```typescript
  toString(id(r)) AS id
  ```

- Devido a limitações do JavaScript com números grandes, os IDs podem ser truncados
- A aplicação implementa uma verificação para normalizar esses IDs:
  ```typescript
  // Função utilitária para normalizar IDs do Neo4j
  normalizeNeo4jId(id: string): string {
    // Verificar se é um ID grande com possível erro de conversão
    if (id.length >= 15) {
      // Se já começa com 1, retornar como está
      if (id.startsWith('1')) {
        return id;
      }
      
      // Tentar adicionar 1 no início se o ID parecer truncado
      return `1${id}`;
    }
    return id;
  }
  ```

## Comportamento de Erro

- Quando a conexão com o Neo4j falha, o aplicativo exibe mensagens detalhadas de erro no console e encerra o processo:

```
❌ ERRO CRÍTICO: Falha ao conectar com Neo4j
❗ Mensagem de erro: Failed to connect to server
📢 O aplicativo requer uma conexão com Neo4j para funcionar corretamente.
🔍 Verifique se:
   - O servidor Neo4j está em execução
   - As configurações de URL, usuário e senha estão corretas
   - Não há regras de firewall bloqueando a conexão
```

- Esse comportamento garante que o administrador do sistema tenha ciência imediata de problemas de conexão com o Neo4j, podendo tomar medidas para resolver o problema antes de iniciar a aplicação novamente.

## Considerações sobre o Desempenho e Confiabilidade

- As consultas de relacionamentos são realizadas diretamente no Neo4j
- A conexão com o Neo4j é verificada no início da aplicação, fornecendo feedback claro em caso de falha
- A manipulação de IDs de relacionamentos requer atenção especial devido a:
  1. Formato dos IDs (string vs. number)
  2. Tamanho dos IDs no Neo4j (podem ultrapassar a precisão de inteiros em JavaScript)
- Operações de atualização e exclusão incluem verificações específicas para IDs problemáticos
- O frontend implementa infinite scrolling para carregar relacionamentos em lotes, melhorando a performance para grandes conjuntos de dados 