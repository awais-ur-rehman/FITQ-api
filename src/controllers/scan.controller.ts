import { Request, Response } from 'express';
import asyncHandler from '../utils/asyncHandler';
import scanService from '../services/scan.service';
import { success } from '../utils/apiResponse';
import ApiError from '../utils/apiError';

export const createScan = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw new ApiError(400, 'Image file is required');
  const data = await scanService.createScan(req.user!.id, req.file);
  success(res, null, data);
});

export const getUserScans = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, favorite } = req.query as {
    page?: string;
    limit?: string;
    favorite?: string;
  };
  const data = await scanService.getUserScans(req.user!.id, {
    page: Number(page) || 1,
    limit: Number(limit) || 20,
    favoriteOnly: favorite === 'true',
  });
  success(res, null, data);
});

export const getScanById = asyncHandler(async (req: Request, res: Response) => {
  const scan = await scanService.getScanById(req.params['id'] as string, req.user!.id);
  success(res, null, { scan });
});

export const toggleFavorite = asyncHandler(async (req: Request, res: Response) => {
  const data = await scanService.toggleFavorite(req.params['id'] as string, req.user!.id);
  success(res, null, data);
});

export const deleteScan = asyncHandler(async (req: Request, res: Response) => {
  await scanService.deleteScan(req.params['id'] as string, req.user!.id);
  success(res, 'Scan deleted');
});
