import { Response } from 'express';
import { AuthRequest } from '@middleware/auth';
import { ExportService } from '@services/ExportService';
import { asyncHandler } from '@middleware/errorHandler';
import logger from '@utils/logger';

const exportService = new ExportService();

/**
 * Export scan results to Excel
 */
export const exportToExcel = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { jobId } = req.params;

  const buffer = await exportService.exportToExcel(jobId);

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="leads-${jobId}.xlsx"`);

  logger.info(`Exported scan ${jobId} to Excel`);
  return res.send(buffer);
});

/**
 * Export scan results to CSV
 */
export const exportToCsv = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { jobId } = req.params;

  const csv = await exportService.exportToCsv(jobId);

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="leads-${jobId}.csv"`);

  logger.info(`Exported scan ${jobId} to CSV`);
  return res.send(csv);
});
