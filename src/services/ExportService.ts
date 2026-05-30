import { LeadRepository } from '@repositories/LeadRepository';
import { ScanJobRepository } from '@repositories/ScanJobRepository';
import { NotFoundError } from '@utils/errors';
import logger from '@utils/logger';
import xlsx from 'xlsx';

export class ExportService {
  private leadRepository = new LeadRepository();
  private scanJobRepository = new ScanJobRepository();

  /**
   * Export leads to XLSX
   */
  async exportToExcel(jobId: string): Promise<Buffer> {
    try {
      const scanJob = await this.scanJobRepository.findById(jobId);
      if (!scanJob) {
        throw new NotFoundError('Scan job not found');
      }

      // Get all leads for this scan
      let allLeads: any[] = [];
      let page = 1;
      const limit = 100;

      while (true) {
        const { leads, total } = await this.leadRepository.findByScanJobId(jobId, page, limit);
        allLeads = allLeads.concat(leads);

        if (page * limit >= total) {
          break;
        }
        page++;
      }

      // Create workbook
      const wb = xlsx.utils.book_new();

      // Sheet 1: Leads
      const wsLeads = xlsx.utils.json_to_sheet(
        allLeads.map((lead) => ({
          'Business Name': lead.businessName,
          Category: lead.category,
          Address: lead.address,
          Phone: lead.phone,
          Email: lead.email,
          Website: lead.website,
          Rating: lead.rating,
          'Review Count': lead.reviewCount,
          'WhatsApp Number': lead.whatsappNumber,
          'WhatsApp Valid': lead.whatsappValid ? 'Yes' : 'No',
          Facebook: lead.facebook,
          Instagram: lead.instagram,
          LinkedIn: lead.linkedin,
          YouTube: lead.youtube,
          TikTok: lead.tiktok,
          'Maps URL': lead.mapsUrl,
          'Lead Type': lead.leadType,
          Suggestion: lead.suggestion,
          'Created At': lead.createdAt,
        })),
      );

      xlsx.utils.book_append_sheet(wb, wsLeads, 'Leads');

      // Sheet 2: Summary
      const stats = await this.leadRepository.getStatistics(jobId);
      const wsSummary = xlsx.utils.json_to_sheet([
        {
          'Total Leads': stats.total,
          'With Phone': stats.withPhone,
          'With Email': stats.withEmail,
          'With Website': stats.withWebsite,
          'Category A': stats.categoryA,
          'Category B': stats.categoryB,
        },
      ]);

      xlsx.utils.book_append_sheet(wb, wsSummary, 'Summary');

      // Convert to buffer
      const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
      logger.info(`Exported ${allLeads.length} leads to XLSX`);

      return buffer;
    } catch (error) {
      logger.error('Failed to export to Excel', error);
      throw error;
    }
  }

  /**
   * Export leads to CSV
   */
  async exportToCsv(jobId: string): Promise<string> {
    try {
      const scanJob = await this.scanJobRepository.findById(jobId);
      if (!scanJob) {
        throw new NotFoundError('Scan job not found');
      }

      // Get all leads for this scan
      let allLeads: any[] = [];
      let page = 1;
      const limit = 100;

      while (true) {
        const { leads, total } = await this.leadRepository.findByScanJobId(jobId, page, limit);
        allLeads = allLeads.concat(leads);

        if (page * limit >= total) {
          break;
        }
        page++;
      }

      // Format data for CSV
      const csvData = allLeads.map((lead) => ({
        'Business Name': lead.businessName,
        Category: lead.category || '',
        Address: lead.address || '',
        Phone: lead.phone || '',
        Email: lead.email || '',
        Website: lead.website || '',
        Rating: lead.rating || '',
        'Review Count': lead.reviewCount || '',
        'WhatsApp Number': lead.whatsappNumber || '',
        'WhatsApp Valid': lead.whatsappValid ? 'Yes' : 'No',
        Facebook: lead.facebook || '',
        Instagram: lead.instagram || '',
        LinkedIn: lead.linkedin || '',
        YouTube: lead.youtube || '',
        TikTok: lead.tiktok || '',
        'Maps URL': lead.mapsUrl || '',
        'Lead Type': lead.leadType,
        Suggestion: lead.suggestion || '',
        'Created At': lead.createdAt,
      }));

      // Convert to CSV (simple implementation)
      const headers = Object.keys(csvData[0]);
      const rows = csvData.map((row) => headers.map((h) => `"${row[h as keyof typeof row]}"`).join(','));
      const csv = [headers.join(','), ...rows].join('\n');

      logger.info(`Exported ${allLeads.length} leads to CSV`);
      return csv;
    } catch (error) {
      logger.error('Failed to export to CSV', error);
      throw error;
    }
  }
}
