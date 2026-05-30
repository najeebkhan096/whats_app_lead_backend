import { getPrismaClient } from '@config/database';
import { ScanJob, ScanJobStatus } from '@prisma/client';
import { buildPaginationQuery } from '@utils/pagination';

export class ScanJobRepository {
  private prisma = getPrismaClient();

  /**
   * Create a new scan job
   */
  async create(data: {
    userId: string;
    query: string;
    reviewLimit?: number;
    checkWhatsapp?: boolean;
    scanMode?: string;
  }): Promise<ScanJob> {
    return this.prisma.scanJob.create({
      data: {
        userId: data.userId,
        query: data.query,
        reviewLimit: data.reviewLimit || 60,
        checkWhatsapp: data.checkWhatsapp !== false,
        scanMode: data.scanMode || 'both',
        status: 'PENDING',
      },
    });
  }

  /**
   * Find scan job by ID
   */
  async findById(id: string): Promise<ScanJob | null> {
    return this.prisma.scanJob.findUnique({
      where: { id },
    });
  }

  /**
   * Find scan jobs by user ID
   */
  async findByUserId(userId: string, page: number = 1, limit: number = 10) {
    const { skip, take } = buildPaginationQuery(page, limit);

    const [scanJobs, total] = await Promise.all([
      this.prisma.scanJob.findMany({
        where: { userId },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.scanJob.count({ where: { userId } }),
    ]);

    return { scanJobs, total };
  }

  /**
   * Update scan job
   */
  async update(
    id: string,
    data: Partial<ScanJob>,
  ): Promise<ScanJob> {
    return this.prisma.scanJob.update({
      where: { id },
      data,
    });
  }

  /**
   * Update progress
   */
  async updateProgress(
    id: string,
    progress: number,
    processedBusinesses: number,
  ): Promise<ScanJob> {
    return this.prisma.scanJob.update({
      where: { id },
      data: {
        progress,
        processedBusinesses,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Mark as completed
   */
  async markCompleted(id: string, totalBusinesses: number): Promise<ScanJob> {
    return this.prisma.scanJob.update({
      where: { id },
      data: {
        status: 'COMPLETED' as ScanJobStatus,
        completedAt: new Date(),
        totalBusinesses,
        progress: 100,
      },
    });
  }

  /**
   * Mark as failed
   */
  async markFailed(id: string, errorMessage: string): Promise<ScanJob> {
    return this.prisma.scanJob.update({
      where: { id },
      data: {
        status: 'FAILED' as ScanJobStatus,
        errorMessage,
        completedAt: new Date(),
      },
    });
  }

  /**
   * Cancel scan job
   */
  async cancel(id: string): Promise<ScanJob> {
    return this.prisma.scanJob.update({
      where: { id },
      data: {
        status: 'CANCELLED' as ScanJobStatus,
        completedAt: new Date(),
      },
    });
  }

  /**
   * Delete scan job and associated leads
   */
  async delete(id: string): Promise<void> {
    await this.prisma.scanJob.delete({
      where: { id },
    });
  }

  /**
   * Find pending scan jobs
   */
  async findPending(): Promise<ScanJob[]> {
    return this.prisma.scanJob.findMany({
      where: { status: 'PENDING' as ScanJobStatus },
      orderBy: { createdAt: 'asc' },
    });
  }
}
