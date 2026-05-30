import jwt from 'jsonwebtoken';
import config from '@config/env';
import logger from './logger';

export interface TokenPayload {
  id: string;
  email: string;
  role: string;
}

/**
 * Generate JWT access token
 */
export function generateAccessToken(payload: TokenPayload): string {
  try {
    const secret = config.JWT_SECRET;
    return jwt.sign({ ...payload }, secret, {
      expiresIn: config.JWT_EXPIRY as any,
    });
  } catch (error) {
    logger.error('Error generating access token', error);
    throw error;
  }
}

/**
 * Generate JWT refresh token
 */
export function generateRefreshToken(payload: TokenPayload): string {
  try {
    const secret = config.JWT_REFRESH_SECRET;
    return jwt.sign({ ...payload }, secret, {
      expiresIn: config.JWT_REFRESH_EXPIRY as any,
    });
  } catch (error) {
    logger.error('Error generating refresh token', error);
    throw error;
  }
}

/**
 * Verify access token
 */
export function verifyAccessToken(token: string): TokenPayload {
  try {
    return jwt.verify(token, config.JWT_SECRET) as TokenPayload;
  } catch (error) {
    logger.error('Invalid access token', error);
    throw error;
  }
}

/**
 * Verify refresh token
 */
export function verifyRefreshToken(token: string): TokenPayload {
  try {
    return jwt.verify(token, config.JWT_REFRESH_SECRET) as TokenPayload;
  } catch (error) {
    logger.error('Invalid refresh token', error);
    throw error;
  }
}

/**
 * Decode token without verification
 */
export function decodeToken(token: string): TokenPayload | null {
  try {
    return jwt.decode(token) as TokenPayload;
  } catch (error) {
    return null;
  }
}
