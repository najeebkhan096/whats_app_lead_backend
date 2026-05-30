import { Queue } from 'bullmq';
import { getRedisConnection } from '@config/redis';
import { ScanJobRepository } from '@repositories/ScanJobRepository';
import { LeadRepository } from '@repositories/LeadRepository';
import { NotFoundError } from '@utils/errors';
import logger from '@utils/logger';

export class ScanService {
  private scanJobRepository = new ScanJobRepository();
  private leadRepository = new LeadRepository();
  private scanQueue: Queue | null = null;

  /**
   * Get or initialize scan queue
   */
  private async getQueue(): Promise<Queue> {
    if (this.scanQueue) {
      return this.scanQueue;
    }
    const connection = getRedisConnection();
    this.scanQueue = new Queue('scan-jobs', { connection });
    return this.scanQueue;
  }

  /**
   * Initialize scan queue (for external calls)
   */
  async initializeQueue(): Promise<void> {
    await this.getQueue();
    logger.info('Scan queue initialized');
  }

  /**
   * Start a new scan job
   */
  async startScan(userId: string, query: string, options: any) {
    try {
      // Create scan job in database
      const scanJob = await this.scanJobRepository.create({
        userId,
        query,
        reviewLimit: options.reviewLimit || 60,
        checkWhatsapp: options.checkWhatsapp !== false,
        scanMode: options.scanMode || 'both',
      });

      // Add to queue
      const queue = await this.getQueue();
      await queue.add('scan', {
        jobId: scanJob.id,
        userId,
        query,
        ...options,
      });

      logger.info(`Scan job created and queued: ${scanJob.id}`);
      return scanJob;
    } catch (error) {
      logger.error('Failed to start scan', error);
      throw error;
    }
  }

  /**
   * Get scan job status
   */
  async getScanStatus(jobId: string) {
    try {
      const scanJob = await this.scanJobRepository.findById(jobId);
      if (!scanJob) {
        throw new NotFoundError('Scan job not found');
      }

      return {
        id: scanJob.id,
        status: scanJob.status,
        progress: scanJob.progress,
        processed: scanJob.processedBusinesses,
        total: scanJob.totalBusinesses,
        query: scanJob.query,
        createdAt: scanJob.createdAt,
        completedAt: scanJob.completedAt,
      };
    } catch (error) {
      logger.error('Failed to get scan status', error);
      throw error;
    }
  }

  /**
   * Get scan results with pagination and filtering
   */
  async getScanResults(jobId: string, options: any = {}) {
    try {
      const scanJob = await this.scanJobRepository.findById(jobId);
      if (!scanJob) {
        throw new NotFoundError('Scan job not found');
      }

      const page = options.page || 1;
      const limit = options.limit || 10;

      const filter = {
        scanJobId: jobId,
        hasPhone: options.hasPhone,
        hasEmail: options.hasEmail,
        hasWebsite: options.hasWebsite,
        hasSocialMedia: options.hasSocialMedia,
        leadType: options.leadType,
        minRating: options.minRating,
        sortBy: options.sortBy || 'createdAt',
        sortOrder: options.sortOrder || 'desc',
      };

      const { leads, total } = await this.leadRepository.findWithFilters(
        filter,
        page,
        limit,
      );

      const stats = await this.leadRepository.getStatistics(jobId);

      return {
        scanJob: {
          id: scanJob.id,
          query: scanJob.query,
          status: scanJob.status,
          progress: scanJob.progress,
          totalBusinesses: scanJob.totalBusinesses,
        },
        leads,
        statistics: stats,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Failed to get scan results', error);
      throw error;
    }
  }

  /**
   * Cancel scan job
   */
  async cancelScan(jobId: string) {
    try {
      const scanJob = await this.scanJobRepository.findById(jobId);
      if (!scanJob) {
        throw new NotFoundError('Scan job not found');
      }

      // Cancel job in queue
      const queue = await this.getQueue();
      const job = await queue.getJob(jobId);
      if (job) {
        await job.remove();
      }

      // Mark as cancelled in database
      await this.scanJobRepository.cancel(jobId);
      logger.info(`Scan job cancelled: ${jobId}`);

      return { message: 'Scan job cancelled successfully' };
    } catch (error) {
      logger.error('Failed to cancel scan', error);
      throw error;
    }
  }

  /**
   * Delete scan job
   */
  async deleteScan(jobId: string) {
    try {
      const scanJob = await this.scanJobRepository.findById(jobId);
      if (!scanJob) {
        throw new NotFoundError('Scan job not found');
      }

      // Delete leads
      await this.leadRepository.deleteByScanJobId(jobId);

      // Delete scan job
      await this.scanJobRepository.delete(jobId);
      logger.info(`Scan job deleted: ${jobId}`);

      return { message: 'Scan job deleted successfully' };
    } catch (error) {
      logger.error('Failed to delete scan', error);
      throw error;
    }
  }

  /**
   * Get user scan jobs
   */
  async getUserScans(userId: string, page: number = 1, limit: number = 10) {
    try {
      const { scanJobs, total } = await this.scanJobRepository.findByUserId(userId, page, limit);

      return {
        scanJobs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Failed to get user scans', error);
      throw error;
    }
  }
}
