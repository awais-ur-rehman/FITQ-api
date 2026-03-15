import { Request, Response } from 'express';
import asyncHandler from '../utils/asyncHandler';
import authService from '../services/auth.service';
import { success } from '../utils/apiResponse';

export const signup = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, name, username } = req.body as {
    email: string;
    password: string;
    name: string;
    username: string;
  };
  const data = await authService.signup(email, password, name, username);
  success(res, 'OTP sent to your email', data);
});

export const verifyOtp = asyncHandler(async (req: Request, res: Response) => {
  const { email, otp } = req.body as { email: string; otp: string };
  const data = await authService.verifyOtp(email, otp);
  success(res, 'Account created successfully', data);
});

export const resendOtp = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body as { email: string };
  const data = await authService.resendOtp(email);
  success(res, 'OTP resent to your email', data);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body as { email: string; password: string };
  const data = await authService.login(email, password);
  success(res, null, data);
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body as { refreshToken: string };
  const data = await authService.refresh(refreshToken);
  success(res, null, data);
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body as { email: string };
  await authService.forgotPassword(email);
  success(res, 'If this email exists, you will receive a reset code');
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email, otp, newPassword } = req.body as {
    email: string;
    otp: string;
    newPassword: string;
  };
  await authService.resetPassword(email, otp, newPassword);
  success(res, 'Password reset successful. Please login with your new password.');
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.getMe(req.user!.id);
  success(res, null, { user });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  await authService.logout(req.user!.id);
  success(res, 'Logged out successfully');
});
