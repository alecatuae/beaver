import { PrismaClient } from '@prisma/client';
import { createTestContext } from '../utils/testUtils';
import { readFileSync } from 'fs';
import path from 'path';

// Modificar a string de conexão para usar localhost
process.env.DATABASE_URL = process.env.DATABASE_URL?.replace('mariadb:3306', 'localhost:3306') || 
  'mysql://root:password@localhost:3306/beaver';

describe('Category Resolver Tests', () => {
  let prisma: PrismaClient;
  let ctx: any;

  // Antes dos testes: configurar o contexto e o cliente prisma
  beforeAll(async () => {
    console.log('Conectando ao banco de dados em:', process.env.DATABASE_URL);
    prisma = new PrismaClient();
    ctx = createTestContext({ prisma });
  });

  // Após todos os testes: limpar dados e desconectar
  afterAll(async () => {
    try {
      await prisma.category.deleteMany({
        where: {
          name: { contains: 'Teste' }
        }
      });
    } catch (error) {
      console.error('Erro ao limpar categorias de teste:', error);
    } finally {
      await prisma.$disconnect();
    }
  });

  // Teste para criação de categoria sem imagem
  test('Deve criar uma categoria sem imagem corretamente', async () => {
    try {
      // Dados de teste
      const categoryData = {
        name: 'Teste Categoria Simples',
        description: 'Descrição de teste para categoria sem imagem'
      };

      // Simular resolver
      const category = await prisma.category.create({
        data: categoryData
      });

      // Verificar se a categoria foi criada
      expect(category).toBeDefined();
      expect(category.id).toBeDefined();
      expect(category.name).toBe(categoryData.name);
      expect(category.description).toBe(categoryData.description);
      expect(category.image).toBeNull();

      // Limpar após o teste
      await prisma.category.delete({
        where: { id: category.id }
      });
    } catch (error) {
      console.error('Erro no teste de categoria sem imagem:', error);
      throw error;
    }
  });

  // Teste para criação de categoria com imagem
  test('Deve criar uma categoria com imagem corretamente', async () => {
    try {
      // Carregar imagem de teste
      const testImagePath = path.join(__dirname, '../../tests/fixtures/test-image.png');
      const imageBuffer = readFileSync(testImagePath, { encoding: 'base64' });

      // Dados de teste
      const categoryData = {
        name: 'Teste Categoria com Imagem',
        description: 'Descrição de teste para categoria com imagem',
        image: imageBuffer
      };

      // Converter base64 para Buffer para simular o que o resolver faz
      const imageBufferFromBase64 = Buffer.from(categoryData.image, 'base64');

      // Simular resolver
      const category = await prisma.category.create({
        data: {
          name: categoryData.name,
          description: categoryData.description,
          image: imageBufferFromBase64
        }
      });

      // Verificar se a categoria foi criada
      expect(category).toBeDefined();
      expect(category.id).toBeDefined();
      expect(category.name).toBe(categoryData.name);
      expect(category.description).toBe(categoryData.description);
      expect(category.image).toBeDefined();
      expect(Buffer.isBuffer(category.image)).toBeTruthy();

      // Verificar o conteúdo da imagem
      const retrievedCategory = await prisma.category.findUnique({
        where: { id: category.id }
      });

      expect(retrievedCategory).toBeDefined();
      expect(retrievedCategory?.image).toBeDefined();
      
      // Limpar após o teste
      await prisma.category.delete({
        where: { id: category.id }
      });
    } catch (error) {
      console.error('Erro no teste de categoria com imagem:', error);
      throw error;
    }
  });

  // Teste para atualização de categoria (incluindo imagem)
  test('Deve atualizar todos os campos da categoria corretamente', async () => {
    try {
      // Criar categoria primeiro
      const originalCategory = await prisma.category.create({
        data: {
          name: 'Teste Categoria Original',
          description: 'Descrição original'
        }
      });

      // Carregar imagem de teste para atualização
      const testImagePath = path.join(__dirname, '../../tests/fixtures/test-image.png');
      const imageBuffer = readFileSync(testImagePath, { encoding: 'base64' });
      const imageBufferFromBase64 = Buffer.from(imageBuffer, 'base64');

      // Atualizar a categoria
      const updatedCategory = await prisma.category.update({
        where: { id: originalCategory.id },
        data: {
          name: 'Teste Categoria Atualizada',
          description: 'Descrição atualizada',
          image: imageBufferFromBase64
        }
      });

      // Verificar se a categoria foi atualizada corretamente
      expect(updatedCategory).toBeDefined();
      expect(updatedCategory.id).toBe(originalCategory.id);
      expect(updatedCategory.name).toBe('Teste Categoria Atualizada');
      expect(updatedCategory.description).toBe('Descrição atualizada');
      expect(updatedCategory.image).toBeDefined();
      expect(Buffer.isBuffer(updatedCategory.image)).toBeTruthy();

      // Limpar após o teste
      await prisma.category.delete({
        where: { id: originalCategory.id }
      });
    } catch (error) {
      console.error('Erro no teste de atualização de categoria:', error);
      throw error;
    }
  });

  // Teste para remover apenas a imagem da categoria
  test('Deve remover apenas a imagem da categoria', async () => {
    try {
      // Carregar imagem de teste
      const testImagePath = path.join(__dirname, '../../tests/fixtures/test-image.png');
      const imageBuffer = readFileSync(testImagePath, { encoding: 'base64' });

      // Criar categoria com imagem
      const originalCategory = await prisma.category.create({
        data: {
          name: 'Teste Categoria Com Imagem',
          description: 'Descrição de teste',
          image: Buffer.from(imageBuffer, 'base64')
        }
      });

      // Verificar se a imagem está presente
      expect(originalCategory.image).toBeDefined();

      // Atualizar categoria removendo apenas a imagem
      const updatedCategory = await prisma.category.update({
        where: { id: originalCategory.id },
        data: {
          image: null
        }
      });

      // Verificar se apenas a imagem foi removida
      expect(updatedCategory).toBeDefined();
      expect(updatedCategory.id).toBe(originalCategory.id);
      expect(updatedCategory.name).toBe(originalCategory.name);
      expect(updatedCategory.description).toBe(originalCategory.description);
      expect(updatedCategory.image).toBeNull();

      // Limpar após o teste
      await prisma.category.delete({
        where: { id: originalCategory.id }
      });
    } catch (error) {
      console.error('Erro no teste de remoção de imagem:', error);
      throw error;
    }
  });
}); 