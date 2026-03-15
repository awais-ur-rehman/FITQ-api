import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import type { StringValue } from 'ms';

export interface AccessTokenPayload {
  userId: string;
  email: string;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenVersion: number;
}

class TokenService {
  generateAccessToken(userId: string, email: string): string {
    return jwt.sign(
      { userId, email },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: process.env.JWT_ACCESS_EXPIRY as StringValue },
    );
  }

  generateRefreshToken(userId: string): string {
    return jwt.sign(
      { userId, tokenVersion: 1 },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRY as StringValue },
    );
  }

  verifyAccessToken(token: string): AccessTokenPayload {
    return jwt.verify(token, process.env.JWT_ACCESS_SECRET) as AccessTokenPayload;
  }

  verifyRefreshToken(token: string): RefreshTokenPayload {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
  }

  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}

export default new TokenService();
