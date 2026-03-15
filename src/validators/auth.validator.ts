import { body } from 'express-validator';

export const signupValidator = [
  body('email')
    .isEmail().withMessage('Valid email is required')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number'),
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ max: 50 }).withMessage('Name must be at most 50 characters'),
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters')
    .matches(/^[a-z0-9._]+$/).withMessage('Username can only contain lowercase letters, numbers, dots, and underscores'),
];

export const verifyOtpValidator = [
  body('email')
    .isEmail().withMessage('Valid email is required')
    .normalizeEmail(),
  body('otp')
    .isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
    .isNumeric().withMessage('OTP must be numeric'),
];

export const resendOtpValidator = [
  body('email')
    .isEmail().withMessage('Valid email is required')
    .normalizeEmail(),
];

export const loginValidator = [
  body('email')
    .isEmail().withMessage('Valid email is required')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required'),
];

export const refreshValidator = [
  body('refreshToken')
    .notEmpty().withMessage('Refresh token is required'),
];

export const forgotPasswordValidator = [
  body('email')
    .isEmail().withMessage('Valid email is required')
    .normalizeEmail(),
];

export const resetPasswordValidator = [
  body('email')
    .isEmail().withMessage('Valid email is required')
    .normalizeEmail(),
  body('otp')
    .isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
    .isNumeric().withMessage('OTP must be numeric'),
  body('newPassword')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number'),
];
