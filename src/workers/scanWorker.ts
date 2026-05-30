import { Worker, Job } from 'bullmq';
import { initializePrisma } from '@config/database';
import { initializeRedis, getRedisConnection } from '@config/redis';
import { ScanJobRepository } from '@repositories/ScanJobRepository';
import { LeadRepository } from '@repositories/LeadRepository';
import { GoogleMapsScraperService } from '@services/GoogleMapsScraperService';
import { WebsiteScraperService } from '@services/WebsiteScraperService';
import logger from '@utils/logger';
import { chromium } from 'playwright';
import { LeadType } from '@prisma/client';

const scanJobRepository = new ScanJobRepository();
const leadRepository = new LeadRepository();
const mapsScraperService = new GoogleMapsScraperService();
const websiteScraperService = new WebsiteScraperService();

/**
 * Process scan job
 */
async function processScanJob(job: Job): Promise<void> {
  const { jobId, query, reviewLimit, checkWhatsapp, scanMode } = job.data;

  logger.info(`Processing scan job: ${jobId}`);

  try {
    // Update status to RUNNING
    await scanJobRepository.update(jobId, { status: 'RUNNING' });

    // Initialize Playwright
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    // Search on Google Maps
    await mapsScraperService.initialize();
    const searchUrl = await mapsScraperService.searchBusinesses(query);

    // Collect businesses
    let businesses = await mapsScraperService.collectBusinesses();

    if (businesses.length === 0) {
      // Fallback: try to parse page manually
      await page.goto(searchUrl, { waitUntil: 'networkidle' });
      businesses = await mapsScraperService.collectBusinesses();
    }

    logger.info(`Found ${businesses.length} businesses for query: ${query}`);

    // Process each business
    const leads = [];
    for (let i = 0; i < businesses.length; i++) {
      try {
        const business = businesses[i];

        // Extract additional details
        const details = await mapsScraperService.openBusinessAndExtract(business.mapsUrl);

        // Extract reviews
        const reviews = await mapsScraperService.extractReviews(reviewLimit);
        const hasRecentOneStar = reviews.some((r) => r.rating === 1);

        // Extract website data
        let websiteData: any = {};
        if (details.website && (scanMode === 'website' || scanMode === 'both')) {
          try {
            websiteData = await websiteScraperService.extractContactInfo(page, details.website);
          } catch (error) {
            logger.warn(`Failed to scrape website: ${details.website}`, error);
          }
        }

        // Check WhatsApp
        let whatsappValid = false;
        if (checkWhatsapp && (websiteData.phone || details.phone)) {
          const phoneToCheck = websiteData.phone || details.phone;
          try {
            whatsappValid = await websiteScraperService.validateWhatsapp(page, phoneToCheck);
          } catch (error) {
            logger.warn(`Failed to validate WhatsApp`, error);
          }
        }

        // Classify lead
        let leadType: LeadType = 'NORMAL';
        let suggestion = '';

        if (hasRecentOneStar) {
          leadType = 'CATEGORY_A';
          suggestion = 'Reputation Management';
        } else if ((details.reviewCount || 0) < 20) {
          leadType = 'CATEGORY_B';
          suggestion = 'Review Growth Package';
        } else if (!details.website) {
          suggestion = 'Website Design Service';
        } else if ((details.rating || 5) < 4) {
          suggestion = 'Customer Experience Improvement';
        }

        // Create lead
        const lead = {
          scanJobId: jobId,
          businessName: business.name,
          category: details.category || business.category,
          address: details.address || business.address,
          phone: details.phone || websiteData.phone,
          email: websiteData.email,
          website: details.website,
          rating: business.rating || details.rating,
          reviewCount: business.reviewCount || details.reviewCount,
          whatsappNumber: websiteData.phone,
          whatsappValid,
          facebook: websiteData.facebook,
          instagram: websiteData.instagram,
          linkedin: websiteData.linkedin,
          youtube: websiteData.youtube,
          tiktok: websiteData.tiktok,
          mapsUrl: business.mapsUrl,
          lastReviewDate: reviews.length > 0 ? reviews[0].date : null,
          leadType,
          suggestion,
          hasRecentOneStar,
          leadQuality: calculateQuality({
            hasPhone: !!details.phone,
            hasEmail: !!websiteData.email,
            hasWebsite: !!details.website,
            hasSocial: !!(
              websiteData.facebook ||
              websiteData.instagram ||
              websiteData.linkedin
            ),
            rating: business.rating || 0,
            reviewCount: business.reviewCount || 0,
          }),
        };

        leads.push(lead);

        // Update progress
        const progress = Math.round((i / businesses.length) * 100);
        await scanJobRepository.updateProgress(jobId, progress, i + 1);
        await job.updateProgress(progress);

        logger.debug(`Processed business ${i + 1}/${businesses.length}`);
      } catch (error) {
        logger.warn(`Error processing business ${i}`, error);
        continue;
      }
    }

    // Save leads to database
    if (leads.length > 0) {
      await leadRepository.createMany(leads);
      logger.info(`Saved ${leads.length} leads to database`);
    }

    // Mark job as completed
    await scanJobRepository.markCompleted(jobId, businesses.length);

    // Close browser
    await mapsScraperService.close();
    await browser.close();

    logger.info(`Scan job completed: ${jobId}`);
  } catch (error) {
    logger.error(`Error processing scan job: ${jobId}`, error);

    // Mark job as failed
    await scanJobRepository.markFailed(
      jobId,
      error instanceof Error ? error.message : 'Unknown error',
    );
  }
}

/**
 * Calculate lead quality score
 */
function calculateQuality(data: {
  hasPhone: boolean;
  hasEmail: boolean;
  hasWebsite: boolean;
  hasSocial: boolean;
  rating: number;
  reviewCount: number;
}): number {
  let score = 50; // Base score

  if (data.hasPhone) score += 10;
  if (data.hasEmail) score += 10;
  if (data.hasWebsite) score += 10;
  if (data.hasSocial) score += 10;

  // Rating bonus
  if (data.rating >= 4) {
    score += 5;
  } else if (data.rating < 3) {
    score -= 5;
  }

  // Review count bonus
  if (data.reviewCount >= 50) {
    score += 5;
  }

  return Math.min(100, Math.max(0, score));
}

/**
 * Initialize worker
 */
async function initializeWorker(): Promise<void> {
  try {
    logger.info('Initializing scan worker');

    // Initialize database and Redis
    await initializePrisma();
    await initializeRedis();

    const connection = getRedisConnection();

    // Create worker
    const scanWorker = new Worker('scan-jobs', processScanJob, {
      connection,
      concurrency: 1,
    });

    scanWorker.on('completed', (job) => {
      logger.info(`Job ${job.id} completed`);
    });

    scanWorker.on('failed', (job, error) => {
      logger.error(`Job ${job?.id} failed: ${error.message}`);
    });

    scanWorker.on('error', (error) => {
      logger.error('Worker error:', error);
    });

    logger.info('Scan worker initialized and ready');

    // Handle graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('Shutdown signal received');
      await scanWorker.close();
      process.exit(0);
    });
  } catch (error) {
    logger.error('Failed to initialize worker', error);
    process.exit(1);
  }
}

// Start worker if this is the main module
if (require.main === module) {
  initializeWorker();
}

export { processScanJob, initializeWorker };

