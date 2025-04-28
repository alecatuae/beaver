import { logger } from '../utils/logger';

export const categoryResolvers = (builder: any) => {
  // Define o tipo Category, verificando se já existe
  const Category = builder.objectRef<any>('Category');
  
  // Só define o tipo se não existir
  if (!builder.configStore.hasConfigWithTypename('Category')) {
    builder.objectType(Category, {
      fields: (t: any) => ({
        id: t.field({
          type: 'Int',
          resolve: (parent: any) => parent.id,
        }),
        name: t.field({
          type: 'String',
          resolve: (parent: any) => parent.name,
        }),
        description: t.field({
          type: 'String',
          nullable: true,
          resolve: (parent: any) => parent.description,
        }),
        image: t.field({
          type: 'String',
          nullable: true,
          resolve: (parent: any) => {
            if (parent.image) {
              // Converte Buffer para string base64 se existir
              return Buffer.from(parent.image).toString('base64');
            }
            return null;
          }
        }),
        createdAt: t.field({
          type: 'Date',
          resolve: (parent: any) => parent.createdAt || new Date(),
        }),
        components: t.field({
          type: ['Component'],
          resolve: async (parent: any, _args: any, ctx: any) => {
            return await ctx.prisma.component.findMany({
              where: { categoryId: parent.id }
            });
          }
        }),
      }),
    });
  }

  // Input para criação/atualização de categoria
  const CategoryInput = builder.inputRef<any>('CategoryInput');
  
  // Só define o tipo se não existir
  if (!builder.configStore.hasConfigWithTypename('CategoryInput')) {
    builder.inputType(CategoryInput, {
      fields: (t: any) => ({
        name: t.string({ required: true }),
        description: t.string(),
        image: t.string(),
      }),
    });
  }

  // Query para listar categorias
  builder.queryField('categories', (t: any) =>
    t.field({
      type: [Category],
      resolve: async (_root: any, _args: any, ctx: any) => {
        try {
          return await ctx.prisma.category.findMany({
            orderBy: { name: 'asc' }
          });
        } catch (error: any) {
          logger.error('Erro ao buscar categorias:', error);
          throw new Error(`Erro ao carregar as categorias: ${error.message}`);
        }
      },
    })
  );

  // Query para buscar categoria por ID
  builder.queryField('category', (t: any) =>
    t.field({
      type: Category,
      nullable: true,
      args: {
        id: t.arg.int({ required: true }),
      },
      resolve: async (_root: any, args: any, ctx: any) => {
        try {
          return await ctx.prisma.category.findUnique({
            where: { id: args.id }
          });
        } catch (error: any) {
          logger.error(`Erro ao buscar categoria com ID ${args.id}:`, error);
          throw new Error(`Erro ao carregar a categoria: ${error.message}`);
        }
      },
    })
  );

  // Mutation para criar categoria
  builder.mutationField('createCategory', (t: any) =>
    t.field({
      type: Category,
      args: {
        input: t.arg({
          type: CategoryInput,
          required: true,
        }),
      },
      resolve: async (_root: any, { input }: any, ctx: any) => {
        try {
          const { name, description, image } = input;
          
          logger.info(`Criando nova categoria: ${name}`);
          
          // Converter a imagem de base64 para Buffer, se existir
          let imageBuffer = null;
          if (image) {
            imageBuffer = Buffer.from(image, 'base64');
          }
          
          // Criar categoria no banco de dados
          const category = await ctx.prisma.category.create({
            data: {
              name,
              description,
              image: imageBuffer,
            },
          });
          
          logger.info(`Categoria criada com sucesso: ${category.id}`);
          return category;
        } catch (error: any) {
          logger.error('Erro ao criar categoria:', error);
          throw new Error(`Erro ao criar a categoria: ${error.message}`);
        }
      },
    })
  );

  // Mutation para atualizar categoria
  builder.mutationField('updateCategory', (t: any) =>
    t.field({
      type: Category,
      args: {
        id: t.arg.int({ required: true }),
        input: t.arg({
          type: CategoryInput,
          required: true,
        }),
      },
      resolve: async (_root: any, { id, input }: any, ctx: any) => {
        try {
          // Ignore o id na entrada, use o id do argumento principal para a operação
          const { name, description, image } = input;
          
          logger.info(`Atualizando categoria: ${id}`);
          
          // Verificar se a categoria existe
          const existingCategory = await ctx.prisma.category.findUnique({
            where: { id },
          });
          
          if (!existingCategory) {
            throw new Error(`Categoria com ID ${id} não encontrada`);
          }
          
          // Converter a imagem de base64 para Buffer, se existir
          let imageBuffer = null;
          if (image) {
            imageBuffer = Buffer.from(image, 'base64');
          }
          
          // Atualizar a categoria no banco de dados
          const updatedCategory = await ctx.prisma.category.update({
            where: { id },
            data: {
              name,
              description,
              image: imageBuffer,
            },
          });
          
          logger.info(`Categoria atualizada com sucesso: ${id}`);
          return updatedCategory;
        } catch (error: any) {
          logger.error(`Erro ao atualizar categoria ${id}:`, error);
          throw new Error(`Erro ao atualizar a categoria: ${error.message}`);
        }
      },
    })
  );

  // Mutation para excluir categoria
  builder.mutationField('deleteCategory', (t: any) =>
    t.field({
      type: 'Boolean',
      args: {
        id: t.arg.int({ required: true }),
      },
      resolve: async (_root: any, { id }: any, ctx: any) => {
        try {
          logger.info(`Excluindo categoria: ${id}`);
          
          // Verificar se a categoria existe
          const existingCategory = await ctx.prisma.category.findUnique({
            where: { id },
          });
          
          if (!existingCategory) {
            throw new Error(`Categoria com ID ${id} não encontrada`);
          }
          
          // Verificar se existem componentes associados a esta categoria
          const componentsCount = await ctx.prisma.component.count({
            where: { categoryId: id },
          });
          
          if (componentsCount > 0) {
            throw new Error(`Não é possível excluir a categoria pois existem ${componentsCount} componentes associados a ela`);
          }
          
          // Excluir a categoria
          await ctx.prisma.category.delete({
            where: { id },
          });
          
          logger.info(`Categoria excluída com sucesso: ${id}`);
          return true;
        } catch (error: any) {
          logger.error(`Erro ao excluir categoria ${id}:`, error);
          throw new Error(`Erro ao excluir a categoria: ${error.message}`);
        }
      },
    })
  );
}; 