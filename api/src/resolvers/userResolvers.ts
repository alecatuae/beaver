import { Role } from '@prisma/client';
import { hashPassword, verifyPassword, generateToken, generateRefreshToken } from '../utils/auth';
import { logger } from '../utils/logger';

export const userResolvers = (builder: any) => {
  // Definine o enumerador Role
  const RoleEnum = builder.enumType('Role', {
    values: Object.values(Role) as [string, ...string[]],
  });

  // Define o tipo User
  const User = builder.prismaObject('User', {
    fields: (t: any) => ({
      id: t.exposeID('id'),
      username: t.exposeString('username'),
      email: t.exposeString('email'),
      role: t.expose('role', { type: RoleEnum }),
      createdAt: t.expose('createdAt', { type: 'Date' }),
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
      username: t.string({ required: true }),
      password: t.string({ required: true }),
      email: t.string({ required: true }),
      role: t.field({ required: false, type: RoleEnum }),
    }),
  });

  // Query para listar usuários
  builder.queryField('users', (t: any) =>
    t.prismaField({
      type: [User],
      resolve: async (query: any, _root: any, _args: any, ctx: any) => {
        // Verificação de autenticação
        if (!ctx.userId) {
          throw new Error('Não autorizado');
        }
        
        return ctx.prisma.user.findMany({ ...query });
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
      resolve: async (query: any, _root: any, args: any, ctx: any) => {
        // Verificação de autenticação
        if (!ctx.userId) {
          throw new Error('Não autorizado');
        }
        
        return ctx.prisma.user.findUnique({
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
        
        logger.info(`Usuário ${user.username} fez login`);
        
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
        const { username, password, email, role } = args.input;
        
        // Verifica se já existe usuário com o mesmo username ou email
        const existingUser = await ctx.prisma.user.findFirst({
          where: {
            OR: [{ username }, { email }],
          },
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
            username,
            passwordHash,
            email,
            role: role || Role.USER,
          },
        });
        
        logger.info(`Novo usuário criado: ${username}`);
        
        return user;
      },
    })
  );
}; 