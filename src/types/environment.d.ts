declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PORT?: string;
      NODE_ENV: 'development' | 'production' | 'test';
      MONGODB_URI: string;
      JWT_ACCESS_SECRET: string;
      JWT_REFRESH_SECRET: string;
      JWT_ACCESS_EXPIRY: string;
      JWT_REFRESH_EXPIRY: string;
      REDIS_URL: string;
      GEMINI_API_KEY: string;
      CLOUDINARY_CLOUD_NAME: string;
      CLOUDINARY_API_KEY: string;
      CLOUDINARY_API_SECRET: string;
      RESEND_API_KEY: string;
      RESEND_FROM_EMAIL: string;
      CORS_ORIGINS?: string;
      DAILY_SCAN_LIMIT_FREE: string;
      DAILY_SCAN_LIMIT_PRO: string;
      OTP_EXPIRY_SECONDS: string;
      OTP_MAX_ATTEMPTS: string;
    }
  }
}

export {};
