import { query, param } from 'express-validator';

export const listScansValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
    .toInt(),
  query('favorite')
    .optional()
    .isBoolean().withMessage('Favorite must be a boolean')
    .toBoolean(),
];

export const scanIdValidator = [
  param('id').isMongoId().withMessage('Invalid scan ID'),
];
