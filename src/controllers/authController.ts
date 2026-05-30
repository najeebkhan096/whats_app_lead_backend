import { Response } from 'express';
import { AuthRequest } from '@middleware/auth';
import { AuthService } from '@services/AuthService';
import { asyncHandler } from '@middleware/errorHandler';
import logger from '@utils/logger';

const authService = new AuthService();

/**
 * Register new user
 */
export const register = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email, name, password } = req.body;

  const result = await authService.register(email, name, password);

  logger.info(`User registered: ${email}`);

  return res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: result,
  });
});

/**
 * Login user
 */
export const login = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email, password } = req.body;

  const result = await authService.login(email, password);

  logger.info(`User logged in: ${email}`);

  return res.status(200).json({
    success: true,
    message: 'Login successful',
    data: result,
  });
});

/**
 * Get user profile
 */
export const getProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized',
    });
  }

  const profile = await authService.getProfile(req.user.id);

  return res.status(200).json({
    success: true,
    message: 'Profile retrieved successfully',
    data: profile,
  });
});

/**
 * Refresh access token
 */
export const refreshToken = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized',
    });
  }

  const result = await authService.refreshAccessToken(req.user.id);

  return res.status(200).json({
    success: true,
    message: 'Token refreshed successfully',
    data: result,
  });
});
