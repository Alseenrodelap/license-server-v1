import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
	globalForPrisma.prisma ??
	new PrismaClient({
		log: [
			{ level: 'query', emit: 'event' },
			{ level: 'info', emit: 'event' },
			{ level: 'warn', emit: 'event' },
			{ level: 'error', emit: 'event' },
		],
	});

prisma.$on('query', (e) => {
	if (process.env.PRISMA_LOG_QUERIES === '1') {
		logger.info(`Prisma query: ${e.query} ${e.params} ${e.duration}ms`);
	}
});
prisma.$on('info', (e) => logger.info(`Prisma: ${e.message}`));
prisma.$on('warn', (e) => logger.warn(`Prisma: ${e.message}`));
prisma.$on('error', (e) => logger.error(`Prisma: ${e.message}`));

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
