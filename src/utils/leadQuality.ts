/**
 * Lead quality scoring algorithm
 */

export interface LeadQualityFactors {
  hasPhone: boolean;
  hasEmail: boolean;
  hasWebsite: boolean;
  hasFacebook: boolean;
  hasInstagram: boolean;
  hasLinkedin: boolean;
  hasYoutube: boolean;
  hasTiktok: boolean;
  rating: number;
  reviewCount: number;
  hasRecentReviews: boolean;
  hasRecentNegativeReview: boolean;
}

/**
 * Calculate overall lead quality score (0-100)
 */
export function calculateLeadQuality(factors: LeadQualityFactors): number {
  let score = 30; // Base score

  // Contact information (20 points)
  if (factors.hasPhone) score += 7;
  if (factors.hasEmail) score += 7;
  if (factors.hasWebsite) score += 6;

  // Social media presence (15 points)
  let socialCount = 0;
  if (factors.hasFacebook) socialCount++;
  if (factors.hasInstagram) socialCount++;
  if (factors.hasLinkedin) socialCount++;
  if (factors.hasYoutube) socialCount++;
  if (factors.hasTiktok) socialCount++;

  if (socialCount >= 3) {
    score += 15;
  } else if (socialCount === 2) {
    score += 10;
  } else if (socialCount === 1) {
    score += 5;
  }

  // Rating (15 points)
  if (factors.rating >= 4.5) {
    score += 15;
  } else if (factors.rating >= 4) {
    score += 12;
  } else if (factors.rating >= 3.5) {
    score += 8;
  } else if (factors.rating >= 3) {
    score += 4;
  } else if (factors.rating > 0) {
    score -= 5;
  }

  // Review count (10 points)
  if (factors.reviewCount >= 100) {
    score += 10;
  } else if (factors.reviewCount >= 50) {
    score += 8;
  } else if (factors.reviewCount >= 20) {
    score += 5;
  } else if (factors.reviewCount >= 5) {
    score += 2;
  }

  // Recent activity (5 points)
  if (factors.hasRecentReviews) {
    score += 5;
  }

  // Negative signal (-5 points)
  if (factors.hasRecentNegativeReview) {
    score -= 5;
  }

  return Math.min(100, Math.max(0, score));
}

/**
 * Classify lead based on criteria
 */
export function classifyLead(
  factors: LeadQualityFactors,
): 'CATEGORY_A' | 'CATEGORY_B' | 'NORMAL' {
  // Category A: Recent negative reviews (reputation issue)
  if (factors.hasRecentNegativeReview) {
    return 'CATEGORY_A';
  }

  // Category B: Low review count (low visibility)
  if (factors.reviewCount < 20 && factors.rating > 0) {
    return 'CATEGORY_B';
  }

  return 'NORMAL';
}

/**
 * Generate suggestion based on lead characteristics
 */
export function generateSuggestion(factors: LeadQualityFactors): string | null {
  if (factors.hasRecentNegativeReview) {
    return 'Reputation Management - Address recent negative reviews';
  }

  if (factors.reviewCount < 20 && factors.rating > 0) {
    return 'Review Growth Package - Increase review count';
  }

  if (!factors.hasWebsite) {
    return 'Website Design Service - Create professional website';
  }

  if (factors.rating < 3.5) {
    return 'Customer Experience Improvement - Enhance service quality';
  }

  if (factors.rating >= 4.5 && factors.reviewCount >= 50 && factors.hasPhone && factors.hasEmail) {
    return 'Premium Lead - High quality business';
  }

  if (!factors.hasFacebook && !factors.hasInstagram && !factors.hasLinkedin) {
    return 'Social Media Strategy - Build online presence';
  }

  return null;
}

/**
 * Calculate lead tier (Premium, Standard, Basic)
 */
export function calculateLeadTier(
  quality: number,
  factors: LeadQualityFactors,
): 'PREMIUM' | 'STANDARD' | 'BASIC' {
  if (quality >= 80 && factors.reviewCount >= 50 && factors.rating >= 4) {
    return 'PREMIUM';
  }

  if (quality >= 60) {
    return 'STANDARD';
  }

  return 'BASIC';
}
