import { User_role } from '@prisma/client';
import { hashPassword, verifyPassword, generateToken, generateRefreshToken } from '../utils/auth';
import { logger } from '../utils/logger';
import { builder } from '../schema';
import { prisma } from '../prisma';

export const userResolvers = (builder: any) => {
  // Definine o enumerador Role
  const RoleEnum = builder.enumType('Role', {
    values: Object.values(User_role) as [string, ...string[]],
  });

  // Define o tipo User
  const User = builder.prismaObject('User', {
    fields: (t: any) => ({
      id: t.exposeID('id'),
      name: t.exposeString('name'),
      email: t.exposeString('email'),
      role: t.expose('role', { type: RoleEnum }),
      active: t.exposeBoolean('active'),
      createdAt: t.expose('createdAt', { type: 'Date' }),
      
      // Relações
      teamMemberships: t.relation('teamMemberships'),
      adrParticipations: t.relation('adrParticipations'),
    }),
  });

  // Input para login
  const LoginInput = builder.inputType('LoginInput', {
    fields: (t: any) => ({
      username: t.string({ required: true }),
      password: t.string({ required: true }),
    }),
  });

  // Response para o login
  const AuthPayload = builder.objectType('AuthPayload', {
    fields: (t: any) => ({
      user: t.field({ type: User }),
      token: t.string(),
      refreshToken: t.string(),
    }),
  });

  // Input para criação de usuário
  const CreateUserInput = builder.inputType('CreateUserInput', {
    fields: (t: any) => ({
      name: t.string({ required: true }),
      email: t.string({ required: true }),
      password: t.string({ required: true }),
      role: t.field({ required: false, type: RoleEnum }),
      active: t.boolean({ required: false }),
    }),
  });

  // Query para listar usuários
  builder.queryField('users', (t: any) =>
    t.prismaField({
      type: ['User'],
      args: {
        role: t.arg({ type: 'UserRole' }),
        search: t.arg.string(),
        active: t.arg.boolean(),
      },
      resolve: async (query: any, _root: any, args: any) => {
        const { role, search, active } = args;
        
        const filters: any = {};
        
        if (role) filters.role = role;
        if (active !== undefined) filters.active = active;
        
        if (search) {
          filters.OR = [
            { name: { contains: search } },
            { email: { contains: search } },
          ];
        }
        
        return prisma.user.findMany({
          ...query,
          where: filters,
          orderBy: { name: 'asc' },
        });
      },
    })
  );

  // Query para buscar usuário por ID
  builder.queryField('user', (t: any) =>
    t.prismaField({
      type: User,
      nullable: true,
      args: {
        id: t.arg.int({ required: true }),
      },
      resolve: async (query: any, _root: any, args: any) => {
        return prisma.user.findUnique({
          ...query,
          where: { id: args.id },
        });
      },
    })
  );

  // Mutation para login
  builder.mutationField('login', (t: any) =>
    t.field({
      type: AuthPayload,
      args: {
        input: t.arg({ type: LoginInput, required: true }),
      },
      resolve: async (_root: any, args: any, ctx: any) => {
        const { username, password } = args.input;
        
        // Busca o usuário pelo username
        const user = await ctx.prisma.user.findUnique({
          where: { username },
        });
        
        if (!user) {
          throw new Error('Credenciais inválidas');
        }
        
        // Verifica a senha
        const valid = await verifyPassword(password, user.passwordHash);
        
        if (!valid) {
          throw new Error('Credenciais inválidas');
        }
        
        // Gera tokens
        const token = generateToken({ userId: user.id, role: user.role });
        const refreshToken = generateRefreshToken({ userId: user.id, role: user.role });
        
        logger.info(`Usuário ${user.name} fez login`);
        
        return {
          user,
          token,
          refreshToken,
        };
      },
    })
  );

  // Mutation para criar usuário
  builder.mutationField('createUser', (t: any) =>
    t.prismaField({
      type: User,
      args: {
        input: t.arg({ type: CreateUserInput, required: true }),
      },
      resolve: async (query: any, _root: any, args: any, ctx: any) => {
        const { name, email, password, role, active } = args.input;
        
        // Verifica se já existe usuário com o mesmo email
        const existingUser = await ctx.prisma.user.findFirst({
          where: { email },
        });
        
        if (existingUser) {
          throw new Error('Usuário ou email já existe');
        }
        
        // Hash da senha
        const passwordHash = await hashPassword(password);
        
        // Cria o usuário
        const user = await ctx.prisma.user.create({
          ...query,
          data: {
            name,
            email,
            passwordHash,
            role: role || User_role.USER,
            active: active === undefined ? true : active,
          },
        });
        
        logger.info(`Novo usuário criado: ${name}`);
        
        return user;
      },
    })
  );

  // Mutation para atualizar usuário
  builder.mutationField('updateUser', (t: any) =>
    t.prismaField({
      type: User,
      args: {
        id: t.arg.int({ required: true }),
        name: t.arg.string(),
        email: t.arg.string(),
        password: t.arg.string(),
        role: t.arg({ type: 'UserRole' }),
        active: t.arg.boolean(),
      },
      resolve: async (query: any, _root: any, args: any, ctx: any) => {
        const { id, name, email, password, role, active } = args;
        
        // Verifica se o usuário existe
        const user = await ctx.prisma.user.findUnique({
          where: { id },
        });
        
        if (!user) {
          throw new Error(`Usuário com ID ${id} não encontrado`);
        }
        
        // Verifica se o email já existe para outro usuário
        if (email && email !== user.email) {
          const existingUser = await ctx.prisma.user.findFirst({
            where: {
              email,
              id: { not: id },
            },
          });
          
          if (existingUser) {
            throw new Error(`Já existe um usuário com o email "${email}"`);
          }
        }
        
        // Prepara os dados a serem atualizados
        const data: any = {};
        if (name) data.name = name;
        if (email) data.email = email;
        if (password) data.passwordHash = await hashPassword(password);
        if (role) data.role = role;
        if (active !== undefined) data.active = active;
        
        // Atualiza o usuário
        const updatedUser = await ctx.prisma.user.update({
          ...query,
          where: { id },
          data,
        });
        
        logger.info(`Usuário ${name} atualizado`);
        
        return updatedUser;
      },
    })
  );

  // Mutation para excluir usuário
  builder.mutationField('deleteUser', (t: any) =>
    t.boolean({
      args: {
        id: t.arg.int({ required: true }),
      },
      resolve: async (_root: any, args: any, ctx: any) => {
        const { id } = args;
        
        // Verifica se o usuário existe
        const user = await ctx.prisma.user.findUnique({
          where: { id },
          include: {
            _count: {
              select: {
                teamMemberships: true,
                adrParticipations: true,
                logs: true,
              },
            },
          },
        });
        
        if (!user) {
          throw new Error(`Usuário com ID ${id} não encontrado`);
        }
        
        // Verifica se o usuário tem relações
        if (
          user._count.teamMemberships > 0 ||
          user._count.adrParticipations > 0 ||
          user._count.logs > 0
        ) {
          throw new Error(
            `Não é possível excluir o usuário pois ele possui relações com times, ADRs ou logs`
          );
        }
        
        // Exclui o usuário
        await ctx.prisma.user.delete({
          where: { id },
        });
        
        logger.info(`Usuário excluído: ${user.name}`);
        
        return true;
      },
    })
  );
}; 