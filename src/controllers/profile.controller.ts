import { Request, Response } from 'express';
import asyncHandler from '../utils/asyncHandler';
import profileService from '../services/profile.service';
import { success } from '../utils/apiResponse';
import ApiError from '../utils/apiError';

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const { name, username, gender, dateOfBirth, stylePreference, bio } = req.body as {
    name?: string;
    username?: string;
    gender?: string;
    dateOfBirth?: string;
    stylePreference?: string;
    bio?: string;
  };
  const user = await profileService.updateProfile(req.user!.id, {
    name, username,
    gender: gender as import('../models/User').GenderType | undefined,
    dateOfBirth,
    stylePreference: stylePreference as import('../models/User').StyleType | undefined,
    bio,
  });
  success(res, null, { user });
});

export const uploadAvatar = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw new ApiError(400, 'Image file is required');
  const user = await profileService.uploadAvatar(req.user!.id, req.file.buffer);
  success(res, null, { user });
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body as {
    currentPassword: string;
    newPassword: string;
  };
  await profileService.changePassword(req.user!.id, currentPassword, newPassword);
  success(res, 'Password changed. Please login again on other devices.');
});

export const getStats = asyncHandler(async (req: Request, res: Response) => {
  const data = await profileService.getDetailedStats(req.user!.id);
  success(res, null, data);
});

export const deleteAccount = asyncHandler(async (req: Request, res: Response) => {
  const { password } = req.body as { password: string };
  await profileService.deleteAccount(req.user!.id, password);
  success(res, 'Account deleted permanently');
});
