import { getPrismaClient } from '@config/database';
import { Lead, LeadType } from '@prisma/client';
import { buildPaginationQuery } from '@utils/pagination';

export interface LeadFilter {
  scanJobId: string;
  hasPhone?: boolean;
  hasEmail?: boolean;
  hasWebsite?: boolean;
  hasSocialMedia?: boolean;
  leadType?: LeadType;
  minRating?: number;
  sortBy?: 'rating' | 'reviewCount' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export class LeadRepository {
  private prisma = getPrismaClient();

  /**
   * Create a new lead
   */
  async create(data: Partial<Lead>): Promise<Lead> {
    return this.prisma.lead.create({
      data: {
        scanJobId: data.scanJobId!,
        businessName: data.businessName || 'Unknown',
        category: data.category,
        address: data.address,
        phone: data.phone,
        email: data.email,
        website: data.website,
        rating: data.rating,
        reviewCount: data.reviewCount,
        whatsappNumber: data.whatsappNumber,
        whatsappValid: data.whatsappValid || false,
        facebook: data.facebook,
        instagram: data.instagram,
        linkedin: data.linkedin,
        youtube: data.youtube,
        tiktok: data.tiktok,
        mapsUrl: data.mapsUrl,
        lastReviewDate: data.lastReviewDate,
        leadType: data.leadType || 'NORMAL',
        suggestion: data.suggestion,
        hasRecentOneStar: data.hasRecentOneStar || false,
        leadQuality: data.leadQuality || 50,
      },
    });
  }

  /**
   * Create multiple leads
   */
  async createMany(data: Partial<Lead>[]): Promise<number> {
    const result = await this.prisma.lead.createMany({
      data: data.map((lead) => ({
        scanJobId: lead.scanJobId!,
        businessName: lead.businessName || 'Unknown',
        category: lead.category,
        address: lead.address,
        phone: lead.phone,
        email: lead.email,
        website: lead.website,
        rating: lead.rating,
        reviewCount: lead.reviewCount,
        whatsappNumber: lead.whatsappNumber,
        whatsappValid: lead.whatsappValid || false,
        facebook: lead.facebook,
        instagram: lead.instagram,
        linkedin: lead.linkedin,
        youtube: lead.youtube,
        tiktok: lead.tiktok,
        mapsUrl: lead.mapsUrl,
        lastReviewDate: lead.lastReviewDate,
        leadType: lead.leadType || 'NORMAL',
        suggestion: lead.suggestion,
        hasRecentOneStar: lead.hasRecentOneStar || false,
        leadQuality: lead.leadQuality || 50,
      })),
    });
    return result.count;
  }

  /**
   * Find leads with filters
   */
  async findWithFilters(filter: LeadFilter, page: number = 1, limit: number = 10) {
    const { skip, take } = buildPaginationQuery(page, limit);

    const where: any = { scanJobId: filter.scanJobId };

    if (filter.hasPhone) {
      where.phone = { not: null };
    }
    if (filter.hasEmail) {
      where.email = { not: null };
    }
    if (filter.hasWebsite) {
      where.website = { not: null };
    }
    if (filter.hasSocialMedia) {
      where.OR = [
        { facebook: { not: null } },
        { instagram: { not: null } },
        { linkedin: { not: null } },
        { youtube: { not: null } },
        { tiktok: { not: null } },
      ];
    }
    if (filter.leadType) {
      where.leadType = filter.leadType;
    }
    if (filter.minRating !== undefined) {
      where.rating = { gte: filter.minRating };
    }

    const orderBy: any = {};
    const sortBy = filter.sortBy || 'createdAt';
    const sortOrder = filter.sortOrder || 'desc';
    orderBy[sortBy] = sortOrder;

    const [leads, total] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        skip,
        take,
        orderBy,
      }),
      this.prisma.lead.count({ where }),
    ]);

    return { leads, total };
  }

  /**
   * Find leads by scan job ID
   */
  async findByScanJobId(scanJobId: string, page: number = 1, limit: number = 10) {
    const { skip, take } = buildPaginationQuery(page, limit);

    const [leads, total] = await Promise.all([
      this.prisma.lead.findMany({
        where: { scanJobId },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.lead.count({ where: { scanJobId } }),
    ]);

    return { leads, total };
  }

  /**
   * Find lead by ID
   */
  async findById(id: string): Promise<Lead | null> {
    return this.prisma.lead.findUnique({
      where: { id },
    });
  }

  /**
   * Update lead
   */
  async update(id: string, data: Partial<Lead>): Promise<Lead> {
    return this.prisma.lead.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete leads by scan job ID
   */
  async deleteByScanJobId(scanJobId: string): Promise<number> {
    const result = await this.prisma.lead.deleteMany({
      where: { scanJobId },
    });
    return result.count;
  }

  /**
   * Get leads statistics
   */
  async getStatistics(scanJobId: string) {
    const [total, withPhone, withEmail, withWebsite, categoryA, categoryB] = await Promise.all([
      this.prisma.lead.count({ where: { scanJobId } }),
      this.prisma.lead.count({ where: { scanJobId, phone: { not: null } } }),
      this.prisma.lead.count({ where: { scanJobId, email: { not: null } } }),
      this.prisma.lead.count({ where: { scanJobId, website: { not: null } } }),
      this.prisma.lead.count({ where: { scanJobId, leadType: 'CATEGORY_A' } }),
      this.prisma.lead.count({ where: { scanJobId, leadType: 'CATEGORY_B' } }),
    ]);

    return {
      total,
      withPhone,
      withEmail,
      withWebsite,
      categoryA,
      categoryB,
    };
  }
}
