import crypto from 'crypto';
import redis from '../config/redis';

export interface SignupCacheData {
  otp: string;
  hashedPassword: string;
  name: string;
  username: string;
}

const ttl = (): number => Number(process.env.OTP_EXPIRY_SECONDS) || 300;

class OtpService {
  generate(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  async storeSignupData(email: string, data: SignupCacheData): Promise<void> {
    await redis.setex(`otp:${email}`, ttl(), JSON.stringify(data));
  }

  async getSignupData(email: string): Promise<SignupCacheData | null> {
    const raw = await redis.get(`otp:${email}`);
    if (!raw) return null;
    return JSON.parse(raw) as SignupCacheData;
  }

  async updateOtp(email: string, newOtp: string): Promise<SignupCacheData | null> {
    const data = await this.getSignupData(email);
    if (!data) return null;
    data.otp = newOtp;
    await redis.setex(`otp:${email}`, ttl(), JSON.stringify(data));
    return data;
  }

  async deleteSignupData(email: string): Promise<void> {
    await redis.del(`otp:${email}`);
  }

  async storeResetOtp(email: string, otp: string): Promise<void> {
    await redis.setex(`reset:${email}`, ttl(), otp);
  }

  async getResetOtp(email: string): Promise<string | null> {
    return redis.get(`reset:${email}`);
  }

  async deleteResetOtp(email: string): Promise<void> {
    await redis.del(`reset:${email}`);
  }
}

export default new OtpService();
