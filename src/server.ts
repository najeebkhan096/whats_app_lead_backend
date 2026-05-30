import config from '@config/env';
import { initializePrisma, closePrisma } from '@config/database';
import { initializeRedis, closeRedis } from '@config/redis';
import { createApp } from './app';
import logger from '@utils/logger';
import { ScanService } from '@services/ScanService';

let server: any;

async function startServer(): Promise<void> {
  try {
    logger.info(`Starting server in ${config.NODE_ENV} mode`);

    // Initialize database
    await initializePrisma();
    logger.info('Database connected');

    // Initialize Redis
    await initializeRedis();
    logger.info('Redis connected');

    // Initialize scan service queue
    const scanService = new ScanService();
    await scanService.initializeQueue();
    logger.info('Scan queue initialized');

    // Create and start Express app
    const app = createApp();

    server = app.listen(config.PORT, () => {
      logger.info(`Server running on port ${config.PORT}`);
      logger.info(`API Documentation: http://localhost:${config.PORT}/api-docs`);
    });

    // Graceful shutdown
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
}

async function shutdown(): Promise<void> {
  logger.info('Shutdown signal received');

  try {
    if (server) {
      server.close(() => {
        logger.info('Server closed');
      });
    }

    await closeRedis();
    logger.info('Redis connection closed');

    await closePrisma();
    logger.info('Database connection closed');

    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown', error);
    process.exit(1);
  }
}

// Start server if this is the main module
if (require.main === module) {
  startServer();
}

export { startServer, shutdown };
