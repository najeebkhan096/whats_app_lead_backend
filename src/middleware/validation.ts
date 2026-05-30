import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

export interface ValidationOptions {
  body?: Joi.ObjectSchema;
  query?: Joi.ObjectSchema;
  params?: Joi.ObjectSchema;
}

/**
 * Validation middleware factory
 */
export function validateRequest(options: ValidationOptions) {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: Record<string, string> = {};

    // Validate body
    if (options.body) {
      const { error, value } = options.body.validate(req.body, { abortEarly: false });
      if (error) {
        errors.body = error.details.map((d) => d.message).join(', ');
      } else {
        req.body = value;
      }
    }

    // Validate query
    if (options.query) {
      const { error, value } = options.query.validate(req.query, { abortEarly: false });
      if (error) {
        errors.query = error.details.map((d) => d.message).join(', ');
      } else {
        req.query = value as any;
      }
    }

    // Validate params
    if (options.params) {
      const { error, value } = options.params.validate(req.params, { abortEarly: false });
      if (error) {
        errors.params = error.details.map((d) => d.message).join(', ');
      } else {
        req.params = value as any;
      }
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
    }

    return next();
  };
}
