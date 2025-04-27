import pino from 'pino';

// Cria uma instância do logger com o nível baseado no ambiente
export const logger = pino({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  transport: process.env.NODE_ENV !== 'production'
    ? { target: 'pino-pretty' }
    : undefined,
  timestamp: pino.stdTimeFunctions.isoTime,
});

// Exporta funções de log específicas para uso nos serviços
export const logError = (message: string, error?: Error, context?: Record<string, any>) => {
  logger.error(
    {
      err: error,
      ...context,
    },
    message
  );
};

export const logInfo = (message: string, context?: Record<string, any>) => {
  logger.info(context, message);
};

export const logWarning = (message: string, context?: Record<string, any>) => {
  logger.warn(context, message);
};

export const logDebug = (message: string, context?: Record<string, any>) => {
  logger.debug(context, message);
}; 