class ApiError extends Error {
  readonly statusCode: number;
  readonly isOperational: boolean;
  readonly data?: unknown;

  constructor(statusCode: number, message: string, data?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.data = data;
    Error.captureStackTrace(this, this.constructor);
  }
}

export default ApiError;
