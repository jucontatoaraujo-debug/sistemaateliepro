import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

prisma.$connect()
  .then(() => logger.info('Banco de dados conectado'))
  .catch((err) => {
    logger.error('Erro ao conectar banco de dados:', err);
    process.exit(1);
  });

export default prisma;
