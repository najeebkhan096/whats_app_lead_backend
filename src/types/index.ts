/**
 * Type definitions for Lead Finder application
 */

// User types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'USER';
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'USER';
  createdAt: Date;
}

export interface AuthResponse {
  user: UserProfile;
  accessToken: string;
  refreshToken: string;
}

// Scan Job types
export interface ScanJob {
  id: string;
  userId: string;
  query: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  progress: number;
  totalBusinesses: number;
  processedBusinesses: number;
  reviewLimit: number;
  checkWhatsapp: boolean;
  scanMode: string;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface ScanJobStatus {
  id: string;
  status: string;
  progress: number;
  processed: number;
  total: number;
  query: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface StartScanRequest {
  query: string;
  reviewLimit?: number;
  checkWhatsapp?: boolean;
  scanMode?: 'google_maps' | 'website' | 'both';
}

export interface StartScanResponse {
  jobId: string;
  status: string;
  query: string;
}

// Lead types
export interface Lead {
  id: string;
  scanJobId: string;
  businessName: string;
  category?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  rating?: number;
  reviewCount?: number;
  whatsappNumber?: string;
  whatsappValid: boolean;
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  youtube?: string;
  tiktok?: string;
  mapsUrl?: string;
  lastReviewDate?: string;
  leadType: 'CATEGORY_A' | 'CATEGORY_B' | 'NORMAL';
  suggestion?: string;
  hasRecentOneStar: boolean;
  leadQuality: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface LeadFilter {
  scanJobId: string;
  page?: number;
  limit?: number;
  hasPhone?: boolean;
  hasEmail?: boolean;
  hasWebsite?: boolean;
  hasSocialMedia?: boolean;
  leadType?: 'CATEGORY_A' | 'CATEGORY_B' | 'NORMAL';
  minRating?: number;
  sortBy?: 'rating' | 'reviewCount' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface LeadStatistics {
  total: number;
  withPhone: number;
  withEmail: number;
  withWebsite: number;
  categoryA: number;
  categoryB: number;
}

export interface ScanResults {
  scanJob: {
    id: string;
    query: string;
    status: string;
    progress: number;
    totalBusinesses: number;
  };
  leads: Lead[];
  statistics: LeadStatistics;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Pagination types
export interface PaginationQuery {
  page: number;
  limit: number;
}

export interface PaginationResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: any;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  error?: any;
  statusCode: number;
}

// Job types
export interface ScanJobData {
  jobId: string;
  userId: string;
  query: string;
  reviewLimit: number;
  checkWhatsapp: boolean;
  scanMode: string;
}

// Export types
export interface ExportOptions {
  scanJobId: string;
  format: 'excel' | 'csv';
  includeStats?: boolean;
}
