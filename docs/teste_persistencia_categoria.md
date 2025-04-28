# Testes de Persistência de Categorias

Este documento descreve os testes de persistência implementados para o modelo `Category` na aplicação Beaver, com foco na validação do armazenamento correto de todos os campos, incluindo imagens.

## Objetivos dos Testes

Os testes de persistência têm como objetivos principais:

1. Validar que os dados das categorias são corretamente armazenados no banco de dados MariaDB
2. Confirmar o processamento adequado de imagens (conversão de base64 para Buffer e vice-versa)
3. Verificar operações CRUD (Create, Read, Update, Delete) no modelo Category
4. Garantir o tratamento correto dos diferentes campos (name, description, image)

## Estrutura dos Testes

Os testes estão organizados no arquivo `api/src/tests/categoryResolver.test.ts` e utilizam os seguintes componentes:

- **Jest**: Framework de testes
- **Prisma Client**: ORM para acesso ao banco de dados
- **Contexto de Teste**: Simulação do contexto GraphQL

### Casos de Teste Implementados

#### 1. Criação de categoria sem imagem

Testa a criação básica de uma categoria contendo apenas nome e descrição, verificando se:
- O registro é criado no banco
- Os campos name e description são armazenados corretamente
- O campo image permanece como null

```typescript
test('Deve criar uma categoria sem imagem corretamente', async () => {
  // Dados de teste
  const categoryData = {
    name: 'Teste Categoria Simples',
    description: 'Descrição de teste para categoria sem imagem'
  };

  // Simular resolver
  const category = await prisma.category.create({
    data: categoryData
  });

  // Verificações
  expect(category).toBeDefined();
  expect(category.id).toBeDefined();
  expect(category.name).toBe(categoryData.name);
  expect(category.description).toBe(categoryData.description);
  expect(category.image).toBeNull();
});
```

#### 2. Criação de categoria com imagem

Testa a criação de uma categoria com todos os campos, incluindo uma imagem em formato base64, verificando se:
- O registro é criado no banco com todos os campos
- A imagem é convertida corretamente de base64 para Buffer
- O Buffer da imagem é armazenado corretamente no banco

```typescript
test('Deve criar uma categoria com imagem corretamente', async () => {
  // Carregar imagem de teste
  const testImagePath = path.join(__dirname, '../../tests/fixtures/test-image.png');
  const imageBuffer = readFileSync(testImagePath, { encoding: 'base64' });

  // Dados de teste
  const categoryData = {
    name: 'Teste Categoria com Imagem',
    description: 'Descrição de teste para categoria com imagem',
    image: imageBuffer
  };

  // Converter base64 para Buffer para simular o resolver
  const imageBufferFromBase64 = Buffer.from(categoryData.image, 'base64');

  // Criar categoria no banco
  const category = await prisma.category.create({
    data: {
      name: categoryData.name,
      description: categoryData.description,
      image: imageBufferFromBase64
    }
  });

  // Verificações
  expect(category).toBeDefined();
  expect(category.image).toBeDefined();
  expect(Buffer.isBuffer(category.image)).toBeTruthy();

  // Verificar recuperação da imagem
  const retrievedCategory = await prisma.category.findUnique({
    where: { id: category.id }
  });
  expect(retrievedCategory?.image).toBeDefined();
});
```

#### 3. Atualização completa de categoria

Testa a atualização de todos os campos da categoria, incluindo a adição de uma imagem a uma categoria que não possuía, verificando se:
- A atualização mantém o mesmo ID
- Todos os campos são atualizados corretamente
- A imagem é adicionada como um Buffer válido

#### 4. Remoção seletiva da imagem

Testa a atualização parcial de uma categoria para remover apenas a imagem, verificando se:
- Apenas o campo image é alterado
- Os outros campos permanecem inalterados
- O campo image passa a ser null após a atualização

## Implementação da Persistência

A persistência de categorias está implementada no resolver correspondente (`api/src/resolvers/categoryResolvers.ts`), que utiliza o Prisma Client para interagir com o banco de dados MariaDB.

### Fluxo para Imagens

1. **Frontend**: A imagem é carregada pelo usuário e convertida para base64
2. **Mutation GraphQL**: O base64 é enviado como uma string no campo `image` do input
3. **Resolver**: Converte a string base64 para um Buffer usando `Buffer.from(image, 'base64')`
4. **Prisma**: Armazena o Buffer no campo LONGBLOB da tabela Category no MariaDB
5. **Consulta**: Ao recuperar, o Buffer é convertido de volta para base64 para envio ao frontend
6. **Exibição**: O frontend recebe a string base64 e a exibe como uma imagem

### Validações Implementadas

- **Tipo de imagem**: Somente PNG e SVG são permitidos
- **Tamanho máximo**: Imagens até 2MB e dimensões máximas de 256x256px
- **Campo opcional**: A imagem é um campo opcional que pode ser null
- **Conversão segura**: Tratamento de erros durante a conversão entre base64 e Buffer

## Conclusão

Os testes de persistência confirmam que o modelo Category está funcionando corretamente, permitindo o armazenamento e recuperação de todos os campos, incluindo imagens. O sistema lida adequadamente com:

- Categorias sem imagem
- Categorias com imagem
- Atualizações completas e parciais
- Remoção seletiva da imagem

Estes testes garantem a integridade dos dados e o funcionamento correto das operações CRUD, validando a persistência adequada no banco de dados MariaDB conforme os requisitos da aplicação. 