import { logger } from '../utils/logger';
import fs from 'fs';
import path from 'path';
import { createReadStream } from 'fs';
import { Categories } from './categories';
import { builder } from '../builder';
import { prisma } from '../prisma';

export const categoryResolvers = (builder: any) => {
  // Note: Não definimos o tipo Category aqui pois já foi definido em componentResolvers.ts

  // Query para obter as imagens disponíveis
  builder.queryField('categoryImages', (t: any) =>
    t.field({
      type: ['String'],
      resolve: async () => {
        try {
          const directoryPath = path.join(process.cwd(), '../public/images/categories');
          const files = fs.readdirSync(directoryPath);
          const imageFiles = files.filter(file => 
            file.endsWith('.png') || 
            file.endsWith('.jpg') || 
            file.endsWith('.jpeg') || 
            file.endsWith('.svg')
          );
          
          // Converter os arquivos para base64
          const base64Images = await Promise.all(
            imageFiles.map(async (fileName) => {
              try {
                const filePath = path.join(directoryPath, fileName);
                const imageBuffer = fs.readFileSync(filePath);
                return Buffer.from(imageBuffer).toString('base64');
              } catch (error) {
                logger.error(`Erro ao converter imagem ${fileName} para base64:`, error);
                return null;
              }
            })
          );
          
          // Filtrar quaisquer nulos que possam ter ocorrido devido a erros
          return base64Images.filter(img => img !== null);
        } catch (error: any) {
          logger.error('Erro ao ler as imagens de categorias:', error);
          return [];
        }
      },
    })
  );

  // Query para obter a lista de categorias
  builder.queryField('categories', (t: any) =>
    t.field({
      type: ['Category'],
      resolve: async () => {
        try {
          return await prisma.category.findMany({
            orderBy: {
              name: 'asc',
            },
          });
        } catch (error: any) {
          logger.error('Erro ao buscar categorias:', error);
          return [];
        }
      },
    })
  );

  // Query para obter uma categoria pelo ID
  builder.queryField('category', (t: any) =>
    t.field({
      type: 'Category',
      args: {
        id: t.arg.int({ required: true }),
      },
      resolve: async (_, args) => {
        try {
          const category = await prisma.category.findUnique({
            where: { id: args.id },
          });

          if (!category) {
            throw new Error(`Categoria com ID ${args.id} não encontrada`);
          }

          return category;
        } catch (error: any) {
          logger.error(`Erro ao buscar categoria ${args.id}:`, error);
          throw error;
        }
      },
    })
  );

  // Input type para criar/atualizar categorias
  const CategoryInput = builder.inputType('CategoryInput', {
    fields: (t: any) => ({
      name: t.string({ required: true }),
      description: t.string({ required: false }),
      image: t.string({ required: false }),
    }),
  });

  // Mutation para criar uma categoria
  builder.mutationField('createCategory', (t: any) =>
    t.field({
      type: 'Category',
      args: {
        input: t.arg({ type: CategoryInput, required: true }),
      },
      resolve: async (_, args) => {
        try {
          return await prisma.category.create({
            data: {
              name: args.input.name,
              description: args.input.description,
              image: args.input.image,
            },
          });
        } catch (error: any) {
          logger.error('Erro ao criar a categoria:', error);
          throw new Error(`Erro ao criar a categoria: \n${error.message}`);
        }
      },
    })
  );

  // Mutation para atualizar uma categoria
  builder.mutationField('updateCategory', (t: any) =>
    t.field({
      type: 'Category',
      args: {
        id: t.arg.int({ required: true }),
        input: t.arg({ type: CategoryInput, required: true }),
      },
      resolve: async (_, args) => {
        try {
          logger.info(`Atualizando categoria ID ${args.id}`);
          logger.info(`Input recebido:`, JSON.stringify(args.input, null, 2));
          
          // Verificar se a categoria existe
          const existingCategory = await prisma.category.findUnique({
            where: { id: args.id },
          });
          
          if (!existingCategory) {
            throw new Error(`Categoria com ID ${args.id} não encontrada`);
          }
          
          logger.info(`Categoria existente:`, JSON.stringify(existingCategory, null, 2));
          
          // Criar objeto de atualização explicitamente
          const updateData = {
            name: args.input.name,
            description: args.input.description,
          };
          
          // Adicionar campo de imagem apenas se fornecido
          if (args.input.image !== undefined) {
            logger.info(`Valor original da imagem: "${args.input.image}"`);
            // Verificar se não está manipulando o valor da imagem antes de salvar
            updateData.image = args.input.image; // Usar diretamente sem codificação/decodificação
            logger.info(`Valor da imagem que será salvo: "${updateData.image}"`);
          }
          
          logger.info(`Dados para atualização:`, JSON.stringify(updateData, null, 2));
          
          // Atualizar o registro
          const updated = await prisma.category.update({
            where: { id: args.id },
            data: updateData,
          });
          
          logger.info(`Categoria atualizada com sucesso:`, JSON.stringify(updated, null, 2));
          return updated;
        } catch (error: any) {
          logger.error('Erro ao atualizar a categoria:', error);
          throw new Error(`Erro ao atualizar a categoria: \n${error.message}`);
        }
      },
    })
  );

  // Mutation para excluir uma categoria
  builder.mutationField('deleteCategory', (t: any) =>
    t.field({
      type: 'Category',
      args: {
        id: t.arg.int({ required: true }),
      },
      resolve: async (_, args) => {
        try {
          // Verificar se existem componentes associados à categoria
          const componentsCount = await prisma.component.count({
            where: { 
              categories: {
                some: { id: args.id }
              }
            }
          });

          if (componentsCount > 0) {
            throw new Error(`Não é possível excluir a categoria pois existem ${componentsCount} componentes associados a ela.`);
          }

          return await prisma.category.delete({
            where: { id: args.id },
          });
        } catch (error: any) {
          logger.error('Erro ao excluir a categoria:', error);
          throw new Error(`Erro ao excluir a categoria: \n${error.message}`);
        }
      },
    })
  );
}; 