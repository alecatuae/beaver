# Beaver API Minimal

## Sobre este projeto
Este é um exemplo minimal da API Beaver usando Pothos GraphQL para demonstrar a configuração correta que evita problemas de tipagem.

## Principais Soluções de Tipagem Implementadas

### 1. Configuração correta do SchemaBuilder com Plugins

```typescript
const builder = new SchemaBuilder<{
  Context: Context;
  PrismaTypes: PrismaTypes;
  Scalars: {
    DateTime: { Input: Date; Output: Date };
    JSON: { Input: any; Output: any };
  };
}>({
  // IMPORTANTE: Usar objetos (e não strings) para registrar plugins
  plugins: [SimpleObjectsPlugin, PrismaPlugin],
  prisma: {
    client: prisma,
  },
});
```

### 2. Definição explícita das interfaces de tipos

```typescript
// Definir interface PrismaTypes para uso com plugin
interface PrismaTypes {
  Component: {
    shape: {
      id: number;
      name: string;
      description: string | null;
      status: string;
      createdAt: Date;
    };
    select: {};
  };
  // outros modelos...
}
```

### 3. Uso correto de objectRef para tipos personalizados

```typescript
const HealthCheckRef = builder.objectRef<HealthCheckData>('HealthCheck');

builder.objectType(HealthCheckRef, {
  fields: (t) => ({
    status: t.exposeString('status'),
    // ...outros campos
  }),
});
```

### 4. Separação das definições de Query e Mutation

```typescript
// Definir Query Type
builder.queryType({});

// Definir campos da Query separadamente
builder.queryFields((t) => ({
  hello: t.string({
    resolve: () => 'Hello World',
  }),
  // ...outros campos
}));
```

### 5. Tipagem explícita de resolvers com interfaces

```typescript
resolve: async (query, _root, { id }, { prisma }) => {
  const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
  return prisma.component.findUniqueOrThrow({
    ...query,
    where: { id: numericId },
  });
}
```

## Executando o Projeto

1. Instale as dependências:
   ```
   npm install
   ```

2. Configure o banco de dados:
   ```
   npx prisma generate
   npx prisma db push
   ```

3. Inicie o servidor:
   ```
   npm run dev
   ```

4. Acesse o GraphQL Playground:
   http://localhost:4000/graphql

## Problemas Comuns e Soluções

### Erro: "plugins" expected object instead of string[]
**Solução**: Passe plugins como instâncias, não como strings:
```typescript
// Errado ❌
plugins: ['prisma'],

// Correto ✅
plugins: [PrismaPlugin],
```

### Erro: Property 'prismaField' does not exist
**Solução**: Certifique-se de que o PrismaPlugin está corretamente registrado e as tipagens estão configuradas:
```typescript
import PrismaPlugin from '@pothos/plugin-prisma';

const builder = new SchemaBuilder<{
  PrismaTypes: {
    // definições necessárias...
  };
}>({
  plugins: [PrismaPlugin],
  prisma: {
    client: prisma,
  },
});
```

### Erro com notStrict
**Solução**: Remova completamente ou defina corretamente como string:
```typescript
notStrict: "Pothos may not work correctly when strict mode is not enabled in tsconfig.json"
``` 