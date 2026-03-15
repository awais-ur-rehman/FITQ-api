import { Request, Response, NextFunction } from 'express';
import tokenService from '../services/token.service';
import ApiError from '../utils/apiError';

export const auth = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      next(new ApiError(401, 'No token provided'));
      return;
    }

    const token = authHeader.slice(7);
    const payload = tokenService.verifyAccessToken(token);
    req.user = { id: payload.userId, email: payload.email };
    next();
  } catch {
    next(new ApiError(401, 'Invalid or expired token'));
  }
};
