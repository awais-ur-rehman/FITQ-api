import bcrypt from 'bcryptjs';
import { Types } from 'mongoose';
import User, { IUser, GenderType, StyleType } from '../models/User';
import Scan from '../models/Scan';
import cloudinaryService from './cloudinary.service';
import statsService from './stats.service';
import ApiError from '../utils/apiError';

interface UpdateProfileInput {
  name?: string;
  username?: string;
  gender?: GenderType;
  dateOfBirth?: string; // ISO date string — Mongoose casts to Date
  stylePreference?: StyleType;
  bio?: string;
}

class ProfileService {
  async updateProfile(userId: string, input: UpdateProfileInput): Promise<IUser> {
    if (input.username) {
      const taken = await User.findOne({
        username: input.username,
        _id: { $ne: new Types.ObjectId(userId) },
      }).lean();
      if (taken) throw new ApiError(409, 'Username already taken');
    }

    // Strip undefined values so we don't accidentally overwrite fields with undefined
    const updates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input)) {
      if (value !== undefined) updates[key] = value;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true },
    );
    if (!user) throw new ApiError(404, 'User not found');
    return user;
  }

  async uploadAvatar(userId: string, buffer: Buffer): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, 'User not found');

    const { imageUrl, publicId } = await cloudinaryService.uploadAvatarImage(buffer);

    if (user.avatarUrl) {
      const oldPublicId = this.extractPublicId(user.avatarUrl);
      if (oldPublicId) {
        await cloudinaryService.deleteImage(oldPublicId).catch(() => undefined);
      }
    }

    user.avatarUrl = imageUrl;
    await user.save();
    void publicId;

    return user;
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await User.findById(userId).select('+passwordHash');
    if (!user) throw new ApiError(404, 'User not found');

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) throw new ApiError(401, 'Current password is incorrect');

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await User.findByIdAndUpdate(userId, {
      $set: { passwordHash: hashedPassword, refreshToken: null },
    });
  }

  async getDetailedStats(userId: string) {
    return statsService.getUserStats(userId);
  }

  async deleteAccount(userId: string, password: string): Promise<void> {
    const user = await User.findById(userId).select('+passwordHash');
    if (!user) throw new ApiError(404, 'User not found');

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) throw new ApiError(401, 'Incorrect password');

    // Fetch all scan publicIds (select: false field, must opt in with +)
    type ScanPublicId = { cloudinaryPublicId: string };
    const scans = await Scan.find({ userId: new Types.ObjectId(userId) })
      .select('+cloudinaryPublicId')
      .lean<ScanPublicId[]>();

    // Delete all scan images (individual failures don't block account deletion)
    await Promise.allSettled(
      scans.map((s) => cloudinaryService.deleteImage(s.cloudinaryPublicId)),
    );

    // Delete avatar
    if (user.avatarUrl) {
      const publicId = this.extractPublicId(user.avatarUrl);
      if (publicId) {
        await cloudinaryService.deleteImage(publicId).catch(() => undefined);
      }
    }

    await Scan.deleteMany({ userId: new Types.ObjectId(userId) });
    await user.deleteOne();
  }

  // Extract Cloudinary publicId from a URL using our FITQ/ folder convention
  private extractPublicId(imageUrl: string): string | null {
    const match = imageUrl.match(/\/(FITQ\/[^.?#]+)/);
    return match?.[1] ?? null;
  }
}

export default new ProfileService();
