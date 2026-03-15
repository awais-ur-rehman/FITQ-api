import { body } from 'express-validator';
import type { GenderType, StyleType } from '../models/User';

const GENDER_VALUES: GenderType[] = ['male', 'female', 'other', 'prefer_not_to_say'];
const STYLE_VALUES: StyleType[] = [
  'streetwear', 'formal', 'minimalist', 'casual', 'bohemian', 'athletic', 'vintage',
];

export const updateProfileValidator = [
  body('name')
    .optional()
    .trim()
    .notEmpty().withMessage('Name cannot be empty')
    .isLength({ max: 50 }).withMessage('Name must be at most 50 characters'),
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters')
    .matches(/^[a-z0-9._]+$/).withMessage('Username can only contain lowercase letters, numbers, dots, and underscores'),
  body('gender')
    .optional()
    .isIn(GENDER_VALUES).withMessage('Invalid gender value'),
  body('dateOfBirth')
    .optional()
    .isISO8601().withMessage('Invalid date format (use ISO 8601, e.g. 1995-08-21)'),
  body('stylePreference')
    .optional()
    .isIn(STYLE_VALUES).withMessage('Invalid style preference'),
  body('bio')
    .optional()
    .isLength({ max: 150 }).withMessage('Bio must be at most 150 characters'),
];

export const changePasswordValidator = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number'),
];

export const deleteAccountValidator = [
  body('password').notEmpty().withMessage('Password is required to confirm account deletion'),
];
