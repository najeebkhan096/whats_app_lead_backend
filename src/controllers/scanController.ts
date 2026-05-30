import { Response } from 'express';
import { AuthRequest } from '@middleware/auth';
import { ScanService } from '@services/ScanService';
import { asyncHandler } from '@middleware/errorHandler';
import logger from '@utils/logger';

const scanService = new ScanService();

/**
 * Start a new scan
 */
export const startScan = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized',
    });
  }

  const { query, reviewLimit, checkWhatsapp, scanMode } = req.body;

  const scanJob = await scanService.startScan(req.user.id, query, {
    reviewLimit,
    checkWhatsapp,
    scanMode,
  });

  logger.info(`Scan started for user ${req.user.id}: ${scanJob.id}`);

  return res.status(201).json({
    success: true,
    message: 'Scan job created successfully',
    data: {
      jobId: scanJob.id,
      status: scanJob.status,
      query: scanJob.query,
    },
  });
});

/**
 * Get scan job status
 */
export const getScanStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { jobId } = req.params;

  const status = await scanService.getScanStatus(jobId);

  return res.status(200).json({
    success: true,
    message: 'Scan status retrieved',
    data: status,
  });
});

/**
 * Get scan results
 */
export const getScanResults = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { jobId } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  const results = await scanService.getScanResults(jobId, {
    page,
    limit,
    hasPhone: req.query.hasPhone === 'true',
    hasEmail: req.query.hasEmail === 'true',
    hasWebsite: req.query.hasWebsite === 'true',
    hasSocialMedia: req.query.hasSocialMedia === 'true',
    leadType: req.query.leadType,
    minRating: req.query.minRating ? parseFloat(req.query.minRating as string) : undefined,
    sortBy: req.query.sortBy || 'createdAt',
    sortOrder: req.query.sortOrder || 'desc',
  });

  return res.status(200).json({
    success: true,
    message: 'Scan results retrieved',
    data: results,
  });
});

/**
 * Cancel scan job
 */
export const cancelScan = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { jobId } = req.params;

  const result = await scanService.cancelScan(jobId);

  logger.info(`Scan cancelled: ${jobId}`);

  return res.status(200).json({
    success: true,
    message: result.message,
  });
});

/**
 * Delete scan job
 */
export const deleteScan = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { jobId } = req.params;

  const result = await scanService.deleteScan(jobId);

  logger.info(`Scan deleted: ${jobId}`);

  return res.status(200).json({
    success: true,
    message: result.message,
  });
});

/**
 * Get user's scan jobs
 */
export const getUserScans = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized',
    });
  }

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  const result = await scanService.getUserScans(req.user.id, page, limit);

  return res.status(200).json({
    success: true,
    message: 'User scans retrieved',
    data: result,
  });
});
