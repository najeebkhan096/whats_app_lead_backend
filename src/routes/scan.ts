import { Router } from 'express';
import * as scanController from '@controllers/scanController';
import { authenticateToken } from '@middleware/auth';
import { validateRequest } from '@middleware/validation';
import { validationSchemas } from '@utils/validation';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Scans
 *   description: Google Maps business scraping
 */

/**
 * @swagger
 * /api/scan/start:
 *   post:
 *     summary: Start a new scan job
 *     tags: [Scans]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - query
 *             properties:
 *               query:
 *                 type: string
 *                 example: "restaurants in New York"
 *               reviewLimit:
 *                 type: number
 *                 default: 60
 *               checkWhatsapp:
 *                 type: boolean
 *                 default: true
 *               scanMode:
 *                 type: string
 *                 enum: [google_maps, website, both]
 *                 default: both
 *     responses:
 *       201:
 *         description: Scan job created
 */
router.post(
  '/start',
  authenticateToken,
  validateRequest({ body: validationSchemas.startScan }),
  scanController.startScan,
);

/**
 * @swagger
 * /api/scan/{jobId}/status:
 *   get:
 *     summary: Get scan job status
 *     tags: [Scans]
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
 *         description: Scan status retrieved
 */
router.get(
  '/:jobId/status',
  authenticateToken,
  scanController.getScanStatus,
);

/**
 * @swagger
 * /api/scan/{jobId}/results:
 *   get:
 *     summary: Get scan results
 *     tags: [Scans]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Scan results retrieved
 */
router.get(
  '/:jobId/results',
  authenticateToken,
  validateRequest({ query: validationSchemas.filterLeads }),
  scanController.getScanResults,
);

/**
 * @swagger
 * /api/scan/{jobId}:
 *   delete:
 *     summary: Cancel/Delete scan job
 *     tags: [Scans]
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
 *         description: Job cancelled/deleted
 */
router.delete(
  '/:jobId',
  authenticateToken,
  scanController.deleteScan,
);

/**
 * @swagger
 * /api/scan/user/jobs:
 *   get:
 *     summary: Get user's scan jobs
 *     tags: [Scans]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User jobs retrieved
 */
router.get(
  '/user/jobs',
  authenticateToken,
  validateRequest({ query: validationSchemas.pagination }),
  scanController.getUserScans,
);

export default router;
