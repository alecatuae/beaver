/**
 * Sistema padronizado de códigos de erro para a aplicação Beaver v2.0
 * Formato: ERR-XXXX-YY-ZZ
 * - XXXX: Código do módulo
 * - YY: Tipo de erro
 * - ZZ: Origem
 */

// Módulos da aplicação (XXXX)
export enum ErrorModule {
  // 1000-1999: Core e Autenticação
  AUTH = '1000',
  USER = '1001',
  CONFIG = '1099',

  // 2000-2999: Gestão de dados principais
  GLOSSARY = '2000',
  ENVIRONMENT = '2100',
  TEAM = '2200',
  TAG = '2300',
  
  // 3000-3999: Arquitetura modular
  TRM = '3000',
  CATEGORY = '3100',
  
  // 4000-4999: Componentes
  COMPONENT = '4000',
  COMPONENT_INSTANCE = '4100',
  RELATION = '4200',
  
  // 5000-5999: Documentação
  ADR = '5000',
  ROADMAP = '5100',
  
  // 9000-9999: Outros
  SYSTEM = '9000',
  GRAPH = '9100',
  API = '9500'
}

// Tipos de erro (YY)
export enum ErrorType {
  VALIDATION = '01',
  PERMISSION = '02',
  NOT_FOUND = '03',
  DUPLICATE = '04',
  OPERATION = '05',
  DEPENDENCY = '06',
  CONNECTION = '07',
  TIMEOUT = '08',
  CONFLICT = '09',
  INPUT = '10',
  UNKNOWN = '99'
}

// Origem do erro (ZZ)
export enum ErrorSource {
  UI = 'UI',
  API = 'API',
  DB = 'DB'
}

// Interface para detalhes do erro
export interface ErrorDetails {
  title: string;
  description: string;
  solution?: string;
  errorCode: string;
  context?: Record<string, any>;
  statusCode?: number;
}

// Função para gerar códigos de erro no formato padronizado
export function generateErrorCode(
  module: ErrorModule,
  type: ErrorType,
  source: ErrorSource
): string {
  return `ERR-${module}-${type}-${source}`;
}

// Erros comuns predefinidos
export const CommonErrors = {
  // Erros de autenticação
  UNAUTHORIZED: {
    errorCode: generateErrorCode(ErrorModule.AUTH, ErrorType.PERMISSION, ErrorSource.API),
    title: 'Erro: Acesso não autorizado',
    description: 'Você não tem permissão para acessar este recurso.',
    solution: 'Faça login novamente ou contate o administrador para obter acesso.',
    statusCode: 401
  },
  
  // Erros de validação
  VALIDATION_FAILED: {
    errorCode: generateErrorCode(ErrorModule.SYSTEM, ErrorType.VALIDATION, ErrorSource.UI),
    title: 'Erro: Validação falhou',
    description: 'Os dados fornecidos não são válidos.',
    solution: 'Verifique os campos marcados e corrija os erros indicados.',
    statusCode: 400
  },
  
  // Erros de conexão
  CONNECTION_FAILED: {
    errorCode: generateErrorCode(ErrorModule.API, ErrorType.CONNECTION, ErrorSource.API),
    title: 'Erro: Falha de conexão',
    description: 'Não foi possível conectar ao servidor.',
    solution: 'Verifique sua conexão com a internet e tente novamente em alguns instantes.',
    statusCode: 503
  },
  
  // Erros de operação
  OPERATION_FAILED: {
    errorCode: generateErrorCode(ErrorModule.SYSTEM, ErrorType.OPERATION, ErrorSource.API),
    title: 'Erro: Operação falhou',
    description: 'Não foi possível completar a operação solicitada.',
    solution: 'Tente novamente ou contate o suporte se o problema persistir.',
    statusCode: 500
  },
  
  // Recurso não encontrado
  NOT_FOUND: {
    errorCode: generateErrorCode(ErrorModule.SYSTEM, ErrorType.NOT_FOUND, ErrorSource.API),
    title: 'Erro: Recurso não encontrado',
    description: 'O item solicitado não foi encontrado.',
    solution: 'Verifique se o ID ou referência está correto e tente novamente.',
    statusCode: 404
  }
};

// Erros específicos por módulo
export const ComponentErrors = {
  // Componente não encontrado
  COMPONENT_NOT_FOUND: {
    errorCode: generateErrorCode(ErrorModule.COMPONENT, ErrorType.NOT_FOUND, ErrorSource.API),
    title: 'Erro: Componente não encontrado',
    description: 'O componente solicitado não existe ou foi removido.',
    solution: 'Verifique o ID do componente ou retorne à lista de componentes.',
    statusCode: 404
  },
  
  // Erro ao criar componente com nome duplicado
  DUPLICATE_NAME: {
    errorCode: generateErrorCode(ErrorModule.COMPONENT, ErrorType.DUPLICATE, ErrorSource.API),
    title: 'Erro: Nome de componente duplicado',
    description: 'Já existe um componente com este nome no sistema.',
    solution: 'Escolha um nome diferente para o componente.',
    statusCode: 409
  },
  
  // Erro ao tentar excluir um componente com dependências
  HAS_DEPENDENCIES: {
    errorCode: generateErrorCode(ErrorModule.COMPONENT, ErrorType.DEPENDENCY, ErrorSource.API),
    title: 'Erro: Componente possui dependências',
    description: 'Este componente não pode ser excluído porque possui relações ou instâncias.',
    solution: 'Remova todas as relações e instâncias primeiro.',
    statusCode: 409
  }
};

export const EnvironmentErrors = {
  ENVIRONMENT_NOT_FOUND: {
    errorCode: generateErrorCode(ErrorModule.ENVIRONMENT, ErrorType.NOT_FOUND, ErrorSource.API),
    title: 'Erro: Ambiente não encontrado',
    description: 'O ambiente solicitado não existe ou foi removido.',
    solution: 'Verifique o ID do ambiente ou retorne à lista de ambientes.',
    statusCode: 404
  }
};

export const ADRErrors = {
  ADR_NOT_FOUND: {
    errorCode: generateErrorCode(ErrorModule.ADR, ErrorType.NOT_FOUND, ErrorSource.API),
    title: 'Erro: ADR não encontrado',
    description: 'O ADR solicitado não existe ou foi removido.',
    solution: 'Verifique o ID do ADR ou retorne à lista de ADRs.',
    statusCode: 404
  },
  
  INVALID_PARTICIPANTS: {
    errorCode: generateErrorCode(ErrorModule.ADR, ErrorType.VALIDATION, ErrorSource.UI),
    title: 'Erro: Participantes inválidos',
    description: 'A configuração de participantes é inválida.',
    solution: 'Um ADR deve ter pelo menos um proprietário (owner).',
    statusCode: 400
  }
};

// Função para criar um erro personalizado com base nos templates
export function createCustomError(
  baseError: ErrorDetails,
  overrides?: Partial<ErrorDetails>
): ErrorDetails {
  return {
    ...baseError,
    ...overrides
  };
} 