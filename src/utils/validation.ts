import Joi from 'joi';

/**
 * Validation schemas
 */
export const validationSchemas = {
  // Auth schemas
  register: Joi.object({
    email: Joi.string().email().required(),
    name: Joi.string().min(2).max(100).required(),
    password: Joi.string().min(6).required(),
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  refresh: Joi.object({
    refreshToken: Joi.string().required(),
  }),

  // Scan schemas
  startScan: Joi.object({
    query: Joi.string().required().min(2).max(200),
    reviewLimit: Joi.number().default(60).min(10).max(500),
    checkWhatsapp: Joi.boolean().default(true),
    scanMode: Joi.string().valid('google_maps', 'website', 'both').default('both'),
  }),

  // Pagination schemas
  pagination: Joi.object({
    page: Joi.number().default(1).min(1),
    limit: Joi.number().default(10).min(1).max(100),
  }),

  // Filter schemas
  filterLeads: Joi.object({
    page: Joi.number().default(1).min(1),
    limit: Joi.number().default(10).min(1).max(100),
    hasPhone: Joi.boolean(),
    hasEmail: Joi.boolean(),
    hasWebsite: Joi.boolean(),
    hasSocialMedia: Joi.boolean(),
    leadType: Joi.string().valid('CATEGORY_A', 'CATEGORY_B', 'NORMAL'),
    minRating: Joi.number().min(0).max(5),
    sortBy: Joi.string().valid('rating', 'reviewCount', 'createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc'),
  }),
};

/**
 * Validate data against schema
 */
export function validate<T>(data: T, schema: Joi.ObjectSchema): { error?: string; value?: T } {
  const { error, value } = schema.validate(data, { abortEarly: false });

  if (error) {
    return {
      error: error.details.map((detail) => detail.message).join(', '),
    };
  }

  return { value };
}

/**
 * Validate with throw
 */
export function validateOrThrow<T>(data: T, schema: Joi.ObjectSchema): T {
  const { error, value } = schema.validate(data, { abortEarly: false });

  if (error) {
    throw new Error(error.details.map((detail) => detail.message).join(', '));
  }

  return value as T;
}
