import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import ApiError from '../utils/apiError';

export const validate = (req: Request, _res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const message =
      (errors.array()[0]?.msg as string | undefined) ?? 'Validation failed';
    next(new ApiError(400, message));
    return;
  }
  next();
};
