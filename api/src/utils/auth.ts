import jwt from 'jsonwebtoken';
import argon2 from 'argon2';
import { logger } from './logger';

// Interface para o payload do token JWT
export interface TokenPayload {
  userId: number;
  role: string;
}

// Opções para o JWT sign
interface JwtOptions {
  expiresIn: string;
}

/**
 * Gera um hash seguro para a senha
 * @param password Senha a ser hasheada
 */
export const hashPassword = async (password: string): Promise<string> => {
  try {
    return await argon2.hash(password);
  } catch (error) {
    logger.error(`Erro ao hash senha: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    throw new Error('Falha ao processar senha');
  }
};

/**
 * Verifica se a senha fornecida corresponde ao hash armazenado
 * @param password Senha fornecida
 * @param hash Hash armazenado
 */
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  try {
    return await argon2.verify(hash, password);
  } catch (error) {
    logger.error(`Erro ao verificar senha: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    return false;
  }
};

/**
 * Gera um token JWT para o usuário
 * @param payload Dados do usuário para o payload do token
 */
export const generateToken = (payload: TokenPayload): string => {
  const secret = process.env.JWT_SECRET || 'segredo_temporario_para_desenvolvimento';
  const expiresIn = process.env.JWT_EXPIRES_IN || '30m';
  
  const options: JwtOptions = { expiresIn };
  
  return jwt.sign(
    payload,
    secret,
    options as any
  );
};

/**
 * Gera um token de atualização para o usuário
 * @param payload Dados do usuário para o payload do token
 */
export const generateRefreshToken = (payload: TokenPayload): string => {
  const secret = process.env.JWT_SECRET || 'segredo_temporario_para_desenvolvimento';
  const expiresIn = process.env.REFRESH_TOKEN_EXPIRES_IN || '8h';
  
  const options: JwtOptions = { expiresIn };
  
  return jwt.sign(
    payload,
    secret,
    options as any
  );
};

/**
 * Verifica e decodifica um token JWT
 * @param token Token JWT a ser verificado
 */
export const verifyToken = (token: string): TokenPayload => {
  const secret = process.env.JWT_SECRET || 'segredo_temporario_para_desenvolvimento';
  
  try {
    const decoded = jwt.verify(token, secret);
    return decoded as TokenPayload;
  } catch (error) {
    logger.warn(`Token inválido: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    throw new Error('Token inválido ou expirado');
  }
}; 