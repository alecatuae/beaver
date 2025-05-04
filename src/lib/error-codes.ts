/**
 * Sistema de Códigos de Erro Padronizados - Beaver v2.0
 * 
 * Formato: ERR-XXXX-YY-ZZ
 * XXXX: Módulo (1000-9999)
 * YY: Tipo de erro (01-99)
 * ZZ: Erro específico (01-99)
 */

// Módulos (1000-9999)
export enum ErrorModule {
  AUTH = 1000, // Autenticação e Autorização
  ADR = 2000, // Gerenciamento de ADRs
  IMPACT = 3000, // Análise de Impacto
  COMPONENT = 4000, // Gerenciamento de Componentes
  RELATIONSHIP = 5000, // Gerenciamento de Relacionamentos
  TRM = 6000, // TRM e Categorias
  GLOSSARY = 7000, // Glossário
  SYSTEM = 8000, // Sistema e Configuração
  INTEGRATION = 9000, // Integração e Comunicação
}

// Tipos de erro (01-99)
export enum ErrorType {
  VALIDATION = 1, // Validação de dados
  PERMISSION = 2, // Permissão negada
  NOT_FOUND = 3, // Recurso não encontrado
  CONFLICT = 4, // Conflito de dados
  COMMUNICATION = 5, // Erro de comunicação
  DATABASE = 6, // Erro de banco de dados
  INTERNAL = 7, // Erro interno
  INTEGRATION = 8, // Erro de integração
  INPUT = 9, // Entrada inválida
  SYNC = 10, // Erro de sincronização
  TIMEOUT = 11, // Tempo limite excedido
}

// Fontes de erro (01-99)
export enum ErrorSource {
  API = 1, // API GraphQL
  DATABASE = 2, // Banco de dados (MariaDB)
  NEO4J = 3, // Neo4j
  CLIENT = 4, // Cliente (navegador)
  AUTH = 5, // Sistema de autenticação
  EXTERNAL = 6, // Sistema externo
  PROCESS = 7, // Processo interno
  VALIDATION = 8, // Validação
  NETWORK = 9, // Rede
}

// Interface para o código de erro
export interface ErrorCode {
  code: string;
  message: string;
  solution?: string;
}

/**
 * Gera um código de erro no formato ERR-XXXX-YY-ZZ
 */
export function generateErrorCode(
  module: ErrorModule,
  type: ErrorType,
  source: ErrorSource
): string {
  const moduleStr = module.toString().padStart(4, '0');
  const typeStr = type.toString().padStart(2, '0');
  const sourceStr = source.toString().padStart(2, '0');
  
  return `ERR-${moduleStr}-${typeStr}-${sourceStr}`;
}

/**
 * Cria um objeto de erro completo com código, mensagem e solução
 */
export function createError(
  module: ErrorModule,
  type: ErrorType,
  source: ErrorSource,
  message: string,
  solution?: string
): ErrorCode {
  return {
    code: generateErrorCode(module, type, source),
    message,
    solution
  };
}

/**
 * Códigos de erro predefinidos para cenários comuns
 */
export const ErrorCodes = {
  // Erros de Autenticação (1000)
  AUTH_INVALID_CREDENTIALS: createError(
    ErrorModule.AUTH,
    ErrorType.VALIDATION,
    ErrorSource.AUTH,
    'Credenciais inválidas',
    'Verifique seu nome de usuário e senha e tente novamente'
  ),
  AUTH_SESSION_EXPIRED: createError(
    ErrorModule.AUTH,
    ErrorType.TIMEOUT,
    ErrorSource.AUTH,
    'Sessão expirada',
    'Faça login novamente para continuar'
  ),
  AUTH_PERMISSION_DENIED: createError(
    ErrorModule.AUTH,
    ErrorType.PERMISSION,
    ErrorSource.AUTH,
    'Permissão negada',
    'Você não tem permissão para realizar esta ação'
  ),

  // Erros de ADR (2000)
  ADR_NOT_FOUND: createError(
    ErrorModule.ADR,
    ErrorType.NOT_FOUND,
    ErrorSource.DATABASE,
    'ADR não encontrado',
    'Verifique se o ID está correto ou se o ADR ainda existe'
  ),
  ADR_MISSING_OWNER: createError(
    ErrorModule.ADR,
    ErrorType.VALIDATION,
    ErrorSource.VALIDATION,
    'ADR precisa ter pelo menos um owner',
    'Adicione um participante com papel de owner'
  ),
  ADR_DUPLICATE_TITLE: createError(
    ErrorModule.ADR,
    ErrorType.CONFLICT,
    ErrorSource.DATABASE,
    'Título de ADR já existe',
    'Escolha um título diferente para este ADR'
  ),

  // Erros de Componente (4000)
  COMPONENT_NOT_FOUND: createError(
    ErrorModule.COMPONENT,
    ErrorType.NOT_FOUND,
    ErrorSource.DATABASE,
    'Componente não encontrado',
    'Verifique se o ID está correto ou se o componente ainda existe'
  ),
  COMPONENT_INSTANCE_CONFLICT: createError(
    ErrorModule.COMPONENT,
    ErrorType.CONFLICT,
    ErrorSource.DATABASE,
    'Já existe uma instância deste componente neste ambiente',
    'Atualize a instância existente ou escolha outro ambiente'
  ),
  COMPONENT_DUPLICATE_NAME: createError(
    ErrorModule.COMPONENT,
    ErrorType.CONFLICT,
    ErrorSource.DATABASE,
    'Nome de componente já existe',
    'Escolha um nome diferente para este componente'
  ),

  // Erros de Sincronização (5000)
  SYNC_NEO4J_FAILED: createError(
    ErrorModule.RELATIONSHIP,
    ErrorType.SYNC,
    ErrorSource.NEO4J,
    'Falha na sincronização com Neo4j',
    'A operação no MariaDB foi concluída, mas a sincronização com Neo4j falhou'
  ),

  // Erros de Sistema (8000)
  SYSTEM_INTERNAL_ERROR: createError(
    ErrorModule.SYSTEM,
    ErrorType.INTERNAL,
    ErrorSource.PROCESS,
    'Erro interno do sistema',
    'Entre em contato com o suporte técnico se o problema persistir'
  ),
  SYSTEM_DATABASE_ERROR: createError(
    ErrorModule.SYSTEM,
    ErrorType.DATABASE,
    ErrorSource.DATABASE,
    'Erro de banco de dados',
    'Tente novamente mais tarde. Se o problema persistir, contate o suporte técnico'
  ),
};

/**
 * Função auxiliar para customizar uma mensagem de erro
 */
export function customizeError(
  baseError: ErrorCode,
  customMessage?: string,
  customSolution?: string
): ErrorCode {
  return {
    code: baseError.code,
    message: customMessage || baseError.message,
    solution: customSolution || baseError.solution
  };
} 