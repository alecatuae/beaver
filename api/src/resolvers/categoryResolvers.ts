import { logger } from '../utils/logger';
import fs from 'fs';
import path from 'path';
import { createReadStream } from 'fs';
import { Categories } from './categories';
import { builder } from '../builder';
import { prisma } from '../prisma';

export const categoryResolvers = (builder: any) => {
  // Note: Não definimos o tipo Category aqui pois já foi definido em componentResolvers.ts

  // Query para obter as imagens disponíveis para categorias
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
          
          // Retorna apenas os nomes dos arquivos
          return imageFiles;
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
          
          // Preparar dados para atualização
          const updateData = {
            name: args.input.name,
            description: args.input.description,
            image: args.input.image
          };
          
          // Realizar a atualização
          try {
            const updated = await prisma.category.update({
              where: { id: args.id },
              data: updateData,
            });
            
            logger.info(`Categoria atualizada com sucesso:`, JSON.stringify(updated, null, 2));
            return updated;
          } catch (updateError: any) {
            logger.error(`Erro ao atualizar: ${updateError.message || "Erro desconhecido"}`);
            throw updateError;
          }
        } catch (error: any) {
          logger.error('Erro ao atualizar a categoria:', error);
          logger.error('Mensagem do erro:', error.message || "Sem mensagem");
          throw new Error(`Erro ao atualizar a categoria: \n${error.message || "Erro desconhecido"}`);
        }
      },
    })
  );

  // Mutation para excluir uma categoria
  builder.mutationField('deleteCategory', (t: any) =>
    t.field({
      type: 'Boolean',
      args: {
        id: t.arg.int({ required: true }),
      },
      resolve: async (_, args) => {
        try {
          // Verificar se existem componentes associados à categoria
          const componentsCount = await prisma.component.count({
            where: { 
              categoryId: args.id
            }
          });

          if (componentsCount > 0) {
            throw new Error(`Não é possível excluir a categoria pois existem ${componentsCount} componentes associados a ela.`);
          }

          await prisma.category.delete({
            where: { id: args.id },
          });
          
          return true;
        } catch (error: any) {
          logger.error('Erro ao excluir a categoria:', error);
          throw new Error(`Erro ao excluir a categoria: \n${error.message}`);
        }
      },
    })
  );
}; 