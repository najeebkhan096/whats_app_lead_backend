import { Router } from 'express';
import * as exportController from '@controllers/exportController';
import { authenticateToken } from '@middleware/auth';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Export
 *   description: Export leads data
 */

/**
 * @swagger
 * /api/export/excel/{jobId}:
 *   get:
 *     summary: Export scan results to Excel
 *     tags: [Export]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Excel file download
 */
router.get(
  '/excel/:jobId',
  authenticateToken,
  exportController.exportToExcel,
);

/**
 * @swagger
 * /api/export/csv/{jobId}:
 *   get:
 *     summary: Export scan results to CSV
 *     tags: [Export]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: CSV file download
 */
router.get(
  '/csv/:jobId',
  authenticateToken,
  exportController.exportToCsv,
);

export default router;
