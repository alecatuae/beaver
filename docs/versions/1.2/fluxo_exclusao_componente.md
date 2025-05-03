# Fluxo de Exclusão de Componentes no Beaver

Este documento detalha o fluxo completo de dados quando um componente é excluído no sistema Beaver, desde a interface do usuário até a remoção nos bancos de dados.

## Visão Geral do Fluxo

O fluxo de exclusão de componentes percorre várias camadas da aplicação, garantindo a remoção consistente dos dados em ambos os bancos de dados (MariaDB e Neo4j).

```
┌───────────────┐          GraphQL          ┌───────────────┐
│   Front-end   │  ───────────────────────▶ │     API BFF   │
│ Next.js (SSR) │ ◀───────────────────────  │ Apollo Server │
└───────────────┘                           └───────────────┘
                                                    │
                                                    ▼
                                           ┌───────────────┐
                                           │   Resolvers   │
                                           └───────────────┘
                                              /         \
                                             /           \
                                            ▼             ▼
                                   ┌───────────────┐   ┌───────────────┐
                                   │    MariaDB    │   │     Neo4j     │
                                   │    (Prisma)   │   │   (Driver)    │
                                   └───────────────┘   └───────────────┘
```

## Validação Prévia de Relacionamentos

Antes de iniciar o processo de exclusão, o sistema verifica se o componente possui relacionamentos no banco de dados Neo4j. Esta verificação impede a exclusão de componentes que são referenciados por outros, mantendo a integridade do grafo de arquitetura.

## Fluxo Detalhado

### 1. Interface do Usuário (Frontend)

- O usuário seleciona um componente e clica no botão "Excluir" na interface
- O sistema executa a consulta GraphQL `CHECK_COMPONENT_RELATIONS` para verificar se o componente tem relacionamentos
- Se o componente possui relacionamentos, a exclusão é bloqueada e uma mensagem é exibida ao usuário
- Caso contrário, é exibido um diálogo de confirmação ao usuário

### 2. Confirmação do Usuário

- O usuário confirma a intenção de excluir o componente no diálogo de confirmação
- O frontend executa a mutation GraphQL `DELETE_COMPONENT` definida em `src/lib/graphql.ts`
- Esta mutation envia o ID do componente para o servidor Apollo GraphQL (API BFF)

### 3. Processamento no Backend (API)

- O resolver GraphQL `deleteComponent` em `api/src/resolvers/componentResolvers.ts` é acionado
- O resolver realiza uma verificação adicional de relacionamentos no Neo4j:
  ```typescript
  const relationResult = await neo4jClient.run(`
    MATCH (c:Component {id: $id})-[r]-() 
    RETURN count(r) as relationCount
  `, { id });
  
  const relationCount = relationResult.records[0]?.get('relationCount')?.toNumber() || 0;
  
  if (relationCount > 0) {
    throw new Error(`Não é possível excluir o componente pois ele está presente em ${relationCount} relacionamento(s). Remova os relacionamentos primeiro.`);
  }
  ```
- Se o componente possuir relacionamentos, a exclusão é abortada
- Caso contrário, o processo de exclusão prossegue

### 4. Exclusão no MariaDB

- Primeiro, o componente é recuperado para registro e retorno:
  ```typescript
  const component = await prisma.component.findUniqueOrThrow({
    where: { id },
    include: {
      tags: true,
    },
  });
  ```
- Em seguida, são excluídas as tags associadas ao componente:
  ```typescript
  await prisma.tag.deleteMany({
    where: {
      componentId: id,
    },
  });
  ```
- Finalmente, o componente é excluído do MariaDB:
  ```typescript
  await prisma.component.delete({
    where: {
      id,
    },
  });
  ```

### 5. Exclusão no Neo4j

- Após a exclusão no MariaDB, o componente é também removido do Neo4j:
  ```typescript
  await neo4jClient.run(`
    MATCH (c:Component {id: $id})
    DELETE c
  `, { id });
  ```
- Alternativamente, usando o método `deleteNode`:
  ```typescript
  await neo4jClient.deleteNode('Component', id);
  ```
- Este método executa a seguinte query Cypher:
  ```cypher
  MATCH (n:Component {id: $id})
  OPTIONAL MATCH (n)-[r]-()
  DELETE r, n
  ```
- A query remove tanto o nó do componente quanto quaisquer relacionamentos remanescentes

### 6. Registro da Ação (Logging)

- A ação de exclusão é registrada no sistema de logs:
  ```typescript
  await prisma.log.create({
    data: {
      userId: ctx.user?.id,
      action: `Excluiu componente ${component.name}`,
    },
  });
  ```

### 7. Resposta ao Frontend

- O resolver retorna o resultado da operação para o cliente
- O Apollo Client no frontend recebe a resposta da mutation
- O hook `useMutation` em `page.tsx` executa a função `onCompleted`
- A consulta `refetch()` é chamada para atualizar a lista de componentes na UI

### 8. Atualização da UI

- A UI é atualizada, removendo o componente da lista
- O modal de confirmação é fechado
- Uma notificação de sucesso é exibida ao usuário

## Garantia de Consistência

A arquitetura de exclusão dual do Beaver garante:

1. **Validações Prévias**: O sistema verifica a existência de relacionamentos antes de permitir a exclusão.
2. **Atomicidade**: O processo tenta garantir que ambos os bancos de dados sejam atualizados no mesmo contexto de execução.
3. **Integridade Referencial**: A exclusão de tags associadas ocorre antes da exclusão do componente.
4. **Isolamento**: As operações são executadas em sequência para evitar conflitos.
5. **Logs de Auditoria**: Todas as operações de exclusão são registradas para rastreabilidade.

## Considerações

- A validação dupla de relacionamentos (frontend e backend) garante maior segurança.
- A exclusão de um componente com relacionamentos é proibida para preservar a integridade do grafo.
- O usuário deve primeiro excluir todos os relacionamentos associados antes de poder excluir um componente.
- Logs de erro são gerados em caso de falhas no processo de exclusão.
- A arquitetura de exclusão dual garante que não haverá componentes órfãos em nenhum dos bancos de dados. 