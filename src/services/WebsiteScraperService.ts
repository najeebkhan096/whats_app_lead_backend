import { Page } from 'playwright';
import logger from '@utils/logger';

export interface WebsiteData {
  email?: string;
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  youtube?: string;
  tiktok?: string;
  phone?: string;
}

export class WebsiteScraperService {
  /**
   * Extract social media links and contact info from website
   */
  async extractContactInfo(page: Page, websiteUrl: string): Promise<WebsiteData> {
    const data: WebsiteData = {};

    try {
      // Navigate to website
      await page.goto(websiteUrl, { waitUntil: 'domcontentloaded' }).catch(() => null);
      await page.waitForTimeout(2000);

      // Get page content
      const content = await page.content();

      // Extract email using regex
      const emailMatch = content.match(
        /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi,
      );
      if (emailMatch) {
        data.email = emailMatch[0];
      }

      // Extract social links from page
      const links = await page.locator('a').all();

      for (const link of links) {
        try {
          const href = await link.getAttribute('href');

          if (!href) continue;

          const lowerHref = href.toLowerCase();

          if (lowerHref.includes('facebook.com')) {
            data.facebook = href;
          } else if (lowerHref.includes('instagram.com')) {
            data.instagram = href;
          } else if (lowerHref.includes('linkedin.com')) {
            data.linkedin = href;
          } else if (lowerHref.includes('youtube.com')) {
            data.youtube = href;
          } else if (lowerHref.includes('tiktok.com')) {
            data.tiktok = href;
          } else if (lowerHref.includes('whatsapp')) {
            // Extract WhatsApp number
            const numberMatch = href.match(/[\d+\-\s()]{10,}/);
            if (numberMatch) {
              data.phone = numberMatch[0];
            }
          }
        } catch (error) {
          logger.warn('Failed to extract link data', error);
        }
      }

      return data;
    } catch (error) {
      logger.warn(`Failed to extract contact info from ${websiteUrl}`, error);
      return data;
    }
  }

  /**
   * Check if WhatsApp number is valid
   */
  async validateWhatsapp(page: Page, phoneNumber: string): Promise<boolean> {
    try {
      // Format phone number
      const cleanNumber = phoneNumber.replace(/\D/g, '');

      // Try to open WhatsApp with the number
      const whatsappUrl = `https://wa.me/${cleanNumber}`;
      const response = await page.goto(whatsappUrl, { waitUntil: 'domcontentloaded' }).catch(() => null);

      // If we can reach the WhatsApp page, number is likely valid
      return response?.ok() || false;
    } catch (error) {
      logger.warn('Failed to validate WhatsApp number', error);
      return false;
    }
  }

  /**
   * Extract contact info from business details page
   */
  async extractFromBusinessPage(page: Page): Promise<WebsiteData> {
    const data: WebsiteData = {};

    try {
      const content = await page.content();

      // Email extraction
      const emailMatch = content.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
      if (emailMatch) {
        data.email = emailMatch[1];
      }

      // Phone extraction
      const phoneMatch = content.match(/(\+\d{1,3}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/);
      if (phoneMatch) {
        data.phone = phoneMatch[0];
      }

      return data;
    } catch (error) {
      logger.warn('Failed to extract from business page', error);
      return data;
    }
  }
}
