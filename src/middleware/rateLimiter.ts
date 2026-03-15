import rateLimit from 'express-rate-limit';
import { Request } from 'express';

interface RateLimiterConfig {
  maxRequests: number;
  windowMinutes: number;
  message: string;
  keyGenerator?: (req: Request) => string;
}

export const createRateLimiter = ({
  maxRequests,
  windowMinutes,
  message,
  keyGenerator,
}: RateLimiterConfig) =>
  rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    max: maxRequests,
    message: { success: false, message },
    standardHeaders: true,
    legacyHeaders: false,
    ...(keyGenerator && { keyGenerator }),
  });
