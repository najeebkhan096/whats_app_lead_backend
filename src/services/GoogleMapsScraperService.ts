import { chromium, Page, Browser, BrowserContext } from 'playwright';
import logger from '@utils/logger';
import config from '@config/env';

export interface BusinessData {
  name: string;
  rating?: number;
  reviewCount?: number;
  address?: string;
  phone?: string;
  website?: string;
  mapsUrl: string;
  category?: string;
}

export interface ReviewData {
  text: string;
  rating: number;
  date: string;
  author: string;
}

export class GoogleMapsScraperService {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;

  // Optimized Selectors (Google Maps internal classes)
  private readonly SELECTORS = {
    resultsContainer: 'div[role="feed"]',
    anyResultItem: 'a.hfpxzc', // The clickable link for businesses in the sidebar
    businessTitle: 'h1.DUwDvf',
    rating: 'span.ce9Y7c',
    reviewCount: 'button.HHrUfc',
    address: 'button[data-item-id="address"]',
    phone: 'button[data-item-id^="phone:tel:"]',
    website: 'a[data-item-id="authority"]',
    category: 'button[data-item-id="address"]', // Fallback or logic to be refined
  };

  /**
   * Initialize browser with anti-detection and stability flags
   */
  async initialize(): Promise<void> {
    try {
      this.browser = await chromium.launch({
        headless: config.PLAYWRIGHT_HEADLESS,
        args: [
          '--disable-blink-features=AutomationControlled', // Hide automation flag
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage', // Useful for VPS/Docker
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
        ],
      });

      this.context = await this.browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1280, height: 800 },
      });

      this.page = await this.context.newPage();

      // Resource Blocking to speed up load and prevent timeouts
      await this.page.route('**/*', (route) => {
        const type = route.request().resourceType();
        if (['image', 'font', 'media'].includes(type) || route.request().url().includes('google-analytics')) {
          route.abort();
        } else {
          route.continue();
        }
      });

      logger.info('Playwright initialized with optimized settings');
    } catch (error) {
      logger.error('Failed to initialize Playwright', error);
      throw error;
    }
  }

  /**
   * Robust search with retry logic and duration logging
   */
  async searchBusinesses(query: string, retries = 3): Promise<string> {
    if (!this.page) throw new Error('Page not initialized');

    const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(query)}`;
    const startTime = Date.now();

    for (let i = 1; i <= retries; i++) {
      try {
        logger.info(`Navigation attempt ${i} for: ${query}`);

        // Strategy: Wait for DOM, then wait for the specific result container
        await this.page.goto(searchUrl, {
          waitUntil: 'domcontentloaded',
          timeout: 45000 // Slightly longer for Maps
        });

        // Wait for at least one business result to appear
        await this.page.waitForSelector(this.SELECTORS.anyResultItem, {
          timeout: 15000
        });

        const duration = (Date.now() - startTime) / 1000;
        logger.info(`Navigation successful in ${duration}s`);
        return searchUrl;
      } catch (error) {
        const isLastAttempt = i === retries;
        logger.warn(`Attempt ${i} failed. Reason: ${error instanceof Error ? error.message : 'Unknown'}`);

        if (isLastAttempt) {
          logger.error(`Max retries reached for search: ${query}`);
          throw error;
        }

        // Exponential backoff
        await new Promise(res => setTimeout(res, 2000 * i));
      }
    }
    return searchUrl;
  }

  /**
   * Collect businesses using scroll-wait cycle
   */
  async collectBusinesses(): Promise<BusinessData[]> {
    if (!this.page) throw new Error('Page not initialized');

    const businesses: BusinessData[] = [];
    try {
      const scrollSelector = 'div[role="feed"]';

      let previousCount = 0;
      let scrollAttempts = 0;

      // Scroll to load results
      while (scrollAttempts < 10) {
        const currentResults = await this.page.locator(this.SELECTORS.anyResultItem).count();

        if (currentResults === previousCount) {
          scrollAttempts++;
        } else {
          scrollAttempts = 0; // Reset if we found new items
        }

        // Limit to 100 for testing/safety
        if (currentResults >= 100) break;

        previousCount = currentResults;

        // Optimized scroll logic for sidebar
        await this.page.evaluate((sel) => {
          const el = document.querySelector(sel);
          if (el) el.scrollTop += 3000;
          else window.scrollBy(0, 2000);
        }, scrollSelector);

        await this.page.waitForTimeout(2000);
      }

      // Extract data
      const items = await this.page.locator(this.SELECTORS.anyResultItem).all();
      for (const item of items) {
        const name = await item.getAttribute('aria-label');
        const url = await item.getAttribute('href');

        if (name && url) {
          businesses.push({ name, mapsUrl: url });
        }
      }

      logger.info(`Successfully collected ${businesses.length} business URLs`);
      return businesses;
    } catch (error) {
      logger.error('Error during business collection', error);
      return businesses;
    }
  }

  /**
   * Extract details from a specific business page
   */
  async openBusinessAndExtract(mapsUrl: string): Promise<Partial<BusinessData>> {
    if (!this.page) throw new Error('Page not initialized');

    try {
      await this.page.goto(mapsUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      // Wait for title
      await this.page.waitForSelector(this.SELECTORS.businessTitle, { timeout: 10000 });

      const details = await this.page.evaluate((selectors) => {
        const getVal = (sel: string) => document.querySelector(sel)?.textContent?.trim();

        return {
          name: getVal(selectors.businessTitle),
          rating: parseFloat(document.querySelector(selectors.rating)?.textContent?.replace(',', '.') || '0'),
          reviewCount: parseInt(document.querySelector(selectors.reviewCount)?.textContent?.replace(/\D/g, '') || '0'),
          address: getVal(selectors.address),
          phone: getVal(selectors.phone),
          website: document.querySelector(selectors.website)?.getAttribute('href') || undefined,
        };
      }, this.SELECTORS);

      return { ...details, mapsUrl };
    } catch (error) {
      logger.warn(`Failed to extract details for ${mapsUrl}`);
      return { mapsUrl };
    }
  }

  /**
   * Extract reviews (Simplified for reliability)
   */
  async extractReviews(_limit: number = 20): Promise<ReviewData[]> {
    if (!this.page) throw new Error('Page not initialized');

    // Stub or implementation depends on business-specific UI state
    // Maps often changes this, usually requires clicking the "Reviews" tab first
    return [];
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      logger.info('Browser closed');
    }
  }
}
