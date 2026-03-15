import { Router } from 'express';
import { Request } from 'express';
import { auth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createRateLimiter } from '../middleware/rateLimiter';
import {
  signupValidator,
  verifyOtpValidator,
  resendOtpValidator,
  loginValidator,
  refreshValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
} from '../validators/auth.validator';
import {
  signup,
  verifyOtp,
  resendOtp,
  login,
  refresh,
  forgotPassword,
  resetPassword,
  getMe,
  logout,
} from '../controllers/auth.controller';

const router = Router();

const signupLimiter = createRateLimiter({
  maxRequests: 5,
  windowMinutes: 15,
  message: 'Too many signup attempts. Please try again later.',
});

const loginLimiter = createRateLimiter({
  maxRequests: 10,
  windowMinutes: 15,
  message: 'Too many login attempts. Please try again later.',
});

const resendOtpLimiter = createRateLimiter({
  maxRequests: 3,
  windowMinutes: 15,
  message: 'Too many OTP requests. Please try again later.',
  keyGenerator: (req: Request): string => {
    const email = req.body?.email as string | undefined;
    return email?.toLowerCase().trim() ?? req.ip ?? 'unknown';
  },
});

const forgotPasswordLimiter = createRateLimiter({
  maxRequests: 3,
  windowMinutes: 15,
  message: 'Too many password reset attempts. Please try again later.',
});

router.post('/signup', signupLimiter, signupValidator, validate, signup);
router.post('/verify-otp', verifyOtpValidator, validate, verifyOtp);
router.post('/resend-otp', resendOtpLimiter, resendOtpValidator, validate, resendOtp);
router.post('/login', loginLimiter, loginValidator, validate, login);
router.post('/refresh', refreshValidator, validate, refresh);
router.post('/forgot-password', forgotPasswordLimiter, forgotPasswordValidator, validate, forgotPassword);
router.post('/reset-password', resetPasswordValidator, validate, resetPassword);
router.get('/me', auth, getMe);
router.post('/logout', auth, logout);

export default router;
