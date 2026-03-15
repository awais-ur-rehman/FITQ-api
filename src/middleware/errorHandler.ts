import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import ApiError from '../utils/apiError';

interface MongoServerError extends Error {
  code: number;
  keyValue: Record<string, unknown>;
}

const isMongoServerError = (err: Error): err is MongoServerError =>
  'code' in err && (err as MongoServerError).code === 11000;

const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  let error: ApiError;

  if (err instanceof ApiError) {
    error = err;
  } else if (err instanceof mongoose.Error.CastError) {
    error = new ApiError(400, 'Resource not found');
  } else if (isMongoServerError(err)) {
    const field = Object.keys(err.keyValue)[0] ?? 'field';
    error = new ApiError(409, `${field} already exists`);
  } else if (err instanceof mongoose.Error.ValidationError) {
    const messages = Object.values(err.errors).map((e) => e.message);
    error = new ApiError(400, messages.join('. '));
  } else if (err.name === 'JsonWebTokenError') {
    error = new ApiError(401, 'Invalid token');
  } else if (err.name === 'TokenExpiredError') {
    error = new ApiError(401, 'Token expired');
  } else {
    error = new ApiError(500, err.message || 'Internal Server Error');
  }

  if (error.statusCode === 500) {
    console.error('UNHANDLED ERROR:', err);
  }

  res.status(error.statusCode).json({
    success: false,
    message: error.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export default errorHandler;
