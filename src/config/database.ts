import { PrismaClient } from '@prisma/client';
import logger from '@utils/logger';
import config from './env';

let prisma: PrismaClient | null = null;

export function getPrismaClient(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: config.DATABASE_URL,
        },
      },
    });
  }
  return prisma;
}

export async function initializePrisma(): Promise<PrismaClient> {
  if (prisma) {
    return prisma;
  }

  prisma = new PrismaClient({
    datasources: {
      db: {
        url: config.DATABASE_URL,
      },
    },
  });

  try {
    await prisma.$connect();
    logger.info('Prisma Client connected to database');
  } catch (error) {
    logger.error('Failed to connect to database', error);
    throw error;
  }

  return prisma;
}

export async function closePrisma(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
}
