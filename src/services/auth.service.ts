import bcrypt from 'bcryptjs';
import User, { IUser } from '../models/User';
import otpService from './otp.service';
import tokenService from './token.service';
import emailService from './email.service';
import ApiError from '../utils/apiError';

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface AuthResult extends AuthTokens {
  user: IUser;
}

interface SignupResult {
  email: string;
  otpExpiresIn: number;
}

const otpTtl = (): number => Number(process.env.OTP_EXPIRY_SECONDS) || 300;

class AuthService {
  async signup(
    email: string,
    password: string,
    name: string,
    username: string,
  ): Promise<SignupResult> {
    const existing = await User.findOne({ $or: [{ email }, { username }] }).lean();
    if (existing) {
      if (existing.email === email) throw new ApiError(409, 'Email already registered');
      throw new ApiError(409, 'Username already taken');
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const otp = otpService.generate();
    await otpService.storeSignupData(email, { otp, hashedPassword, name, username });
    await emailService.sendOtpEmail(email, name, otp);

    return { email, otpExpiresIn: otpTtl() };
  }

  async verifyOtp(email: string, otp: string): Promise<AuthResult> {
    const cached = await otpService.getSignupData(email);
    if (!cached || cached.otp !== otp) throw new ApiError(400, 'Invalid or expired OTP');

    const user = await User.create({
      email,
      passwordHash: cached.hashedPassword,
      name: cached.name,
      username: cached.username,
      isVerified: true,
    });

    const accessToken = tokenService.generateAccessToken(user.id as string, email);
    const refreshToken = tokenService.generateRefreshToken(user.id as string);
    user.refreshToken = tokenService.hashToken(refreshToken);
    await user.save();
    await otpService.deleteSignupData(email);

    return { accessToken, refreshToken, user };
  }

  async resendOtp(email: string): Promise<{ otpExpiresIn: number }> {
    const otp = otpService.generate();
    const cached = await otpService.updateOtp(email, otp);
    if (!cached) {
      throw new ApiError(400, 'No pending signup found. Please sign up again.');
    }
    await emailService.sendOtpEmail(email, cached.name, otp);
    return { otpExpiresIn: otpTtl() };
  }

  async login(email: string, password: string): Promise<AuthResult> {
    const user = await User.findOne({ email }).select('+passwordHash +refreshToken');
    if (!user) throw new ApiError(401, 'Invalid email or password');
    if (!user.isVerified) throw new ApiError(403, 'Email not verified', { email });

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) throw new ApiError(401, 'Invalid email or password');

    const accessToken = tokenService.generateAccessToken(user.id as string, email);
    const refreshToken = tokenService.generateRefreshToken(user.id as string);
    user.refreshToken = tokenService.hashToken(refreshToken);
    await user.save();

    return { accessToken, refreshToken, user };
  }

  async refresh(rawRefreshToken: string): Promise<AuthTokens> {
    const payload = tokenService.verifyRefreshToken(rawRefreshToken);
    const user = await User.findById(payload.userId).select('+refreshToken');
    if (!user?.refreshToken) throw new ApiError(401, 'Invalid refresh token');

    const hash = tokenService.hashToken(rawRefreshToken);
    if (hash !== user.refreshToken) throw new ApiError(401, 'Invalid refresh token');

    const accessToken = tokenService.generateAccessToken(user.id as string, user.email);
    const newRefreshToken = tokenService.generateRefreshToken(user.id as string);
    user.refreshToken = tokenService.hashToken(newRefreshToken);
    await user.save();

    return { accessToken, refreshToken: newRefreshToken };
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await User.findOne({ email }).lean();
    if (!user) return; // silent — don't leak whether email exists

    const otp = otpService.generate();
    await otpService.storeResetOtp(email, otp);
    await emailService.sendPasswordResetEmail(email, user.name, otp);
  }

  async resetPassword(email: string, otp: string, newPassword: string): Promise<void> {
    const storedOtp = await otpService.getResetOtp(email);
    if (!storedOtp || storedOtp !== otp) throw new ApiError(400, 'Invalid or expired OTP');

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    const result = await User.updateOne(
      { email },
      { $set: { passwordHash: hashedPassword, refreshToken: null } },
    );
    if (result.matchedCount === 0) throw new ApiError(404, 'User not found');
    await otpService.deleteResetOtp(email);
  }

  async getMe(userId: string): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, 'User not found');
    return user;
  }

  async logout(userId: string): Promise<void> {
    await User.findByIdAndUpdate(userId, { $set: { refreshToken: null } });
  }
}

export default new AuthService();
