import { Response } from 'express';

export const success = <T>(
  res: Response,
  message: string | null,
  data?: T,
): Response =>
  res.status(200).json({
    success: true,
    ...(message && { message }),
    ...(data !== undefined && { data }),
  });

export const created = <T>(
  res: Response,
  message: string | null,
  data?: T,
): Response =>
  res.status(201).json({
    success: true,
    ...(message && { message }),
    ...(data !== undefined && { data }),
  });
