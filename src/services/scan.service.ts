import { Types, HydratedDocument } from 'mongoose';
import User, { IUser } from '../models/User';
import Scan, { IScan } from '../models/Scan';
import cloudinaryService from './cloudinary.service';
import geminiService from './gemini.service';
import ApiError from '../utils/apiError';

interface CreateScanResult {
  scan: IScan;
  updatedStats: {
    totalScans: number;
    averageScore: number;
    highestScore: number;
    streak: { current: number; longest: number };
  };
}

interface PaginatedScans {
  scans: IScan[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface ListOptions {
  page: number;
  limit: number;
  favoriteOnly: boolean;
}

class ScanService {
  async createScan(userId: string, file: Express.Multer.File): Promise<CreateScanResult> {
    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, 'User not found');

    // 1. Check daily limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const scansToday = await Scan.countDocuments({
      userId: new Types.ObjectId(userId),
      createdAt: { $gte: today },
    });
    const limit = user.isPro ? null : Number(process.env.DAILY_SCAN_LIMIT_FREE) || 3;
    if (limit !== null && scansToday >= limit) {
      const resetsAt = new Date(today);
      resetsAt.setDate(resetsAt.getDate() + 1);
      throw new ApiError(429, 'Daily scan limit reached. Upgrade to Pro for unlimited scans.', {
        scansToday,
        limit,
        resetsAt: resetsAt.toISOString(),
      });
    }

    // 2. Upload to Cloudinary and analyze with Gemini (parallel — both use the buffer)
    let uploadedPublicId: string | null = null;
    try {
      const [uploadResult, analysis] = await Promise.all([
        cloudinaryService.uploadScanImage(file.buffer, userId),
        geminiService.analyzeOutfit(file.buffer, file.mimetype),
      ]);
      uploadedPublicId = uploadResult.publicId;

      // 3. Save scan
      const scan = await Scan.create({
        userId: new Types.ObjectId(userId),
        imageUrl: uploadResult.imageUrl,
        thumbnailUrl: uploadResult.thumbnailUrl,
        cloudinaryPublicId: uploadResult.publicId,
        score: analysis.score,
        analysis: {
          colorHarmony: analysis.colorHarmony,
          fitScore: analysis.fitScore,
          styleCategory: analysis.styleCategory,
          seasonMatch: analysis.seasonMatch,
          highlights: analysis.highlights,
          improvements: analysis.improvements,
          oneLiner: analysis.oneLiner,
          detailedBreakdown: analysis.detailedBreakdown,
        },
      });

      // 4. Update user stats + streak
      await this.updateUserStats(user, analysis.score, userId);

      return {
        scan,
        updatedStats: {
          totalScans: user.stats.totalScans,
          averageScore: user.stats.averageScore,
          highestScore: user.stats.highestScore,
          streak: { current: user.streak.current, longest: user.streak.longest },
        },
      };
    } catch (err) {
      // Cleanup orphaned Cloudinary image on failure
      if (uploadedPublicId) {
        await cloudinaryService.deleteImage(uploadedPublicId).catch(() => undefined);
      }
      throw err;
    }
  }

  async getUserScans(userId: string, opts: ListOptions): Promise<PaginatedScans> {
    const page = Math.max(1, opts.page);
    const limit = Math.min(50, Math.max(1, opts.limit));
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = { userId: new Types.ObjectId(userId) };
    if (opts.favoriteOnly) query['isFavorite'] = true;

    const [scans, total] = await Promise.all([
      Scan.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Scan.countDocuments(query),
    ]);

    return {
      scans,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getScanById(id: string, userId: string): Promise<IScan> {
    const scan = await Scan.findById(id);
    if (!scan) throw new ApiError(404, 'Scan not found');
    if (scan.userId.toString() !== userId) throw new ApiError(403, 'Forbidden');
    return scan;
  }

  async toggleFavorite(id: string, userId: string): Promise<{ isFavorite: boolean }> {
    const scan = await Scan.findById(id);
    if (!scan) throw new ApiError(404, 'Scan not found');
    if (scan.userId.toString() !== userId) throw new ApiError(403, 'Forbidden');
    scan.isFavorite = !scan.isFavorite;
    await scan.save();
    return { isFavorite: scan.isFavorite };
  }

  async deleteScan(id: string, userId: string): Promise<void> {
    const scan = await Scan.findById(id).select('+cloudinaryPublicId');
    if (!scan) throw new ApiError(404, 'Scan not found');
    if (scan.userId.toString() !== userId) throw new ApiError(403, 'Forbidden');

    await cloudinaryService.deleteImage(scan.cloudinaryPublicId);
    await scan.deleteOne();
    await this.recalculateStats(userId);
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  private async updateUserStats(
    user: HydratedDocument<IUser>,
    newScore: number,
    userId: string,
  ): Promise<void> {
    const oldCount = user.stats.totalScans;
    user.stats.totalScans = oldCount + 1;
    user.stats.averageScore =
      Math.round(
        ((user.stats.averageScore * oldCount + newScore) / user.stats.totalScans) * 10,
      ) / 10;
    user.stats.highestScore = Math.max(user.stats.highestScore, newScore);
    this.updateStreak(user);

    // Compute favorite style from all scans (includes the one just created)
    type TopStyle = { _id: string };
    const topStyle = await Scan.aggregate<TopStyle>([
      { $match: { userId: new Types.ObjectId(userId) } },
      { $group: { _id: '$analysis.styleCategory', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 },
    ]);
    if (topStyle.length > 0) {
      user.stats.favoriteStyle = topStyle[0]._id;
    }

    await user.save();
  }

  private updateStreak(user: HydratedDocument<IUser>): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastScan = user.streak.lastScanDate ? new Date(user.streak.lastScanDate) : null;
    if (lastScan) lastScan.setHours(0, 0, 0, 0);

    if (!lastScan) {
      // First ever scan
      user.streak.current = 1;
    } else if (lastScan.getTime() === today.getTime()) {
      // Already scanned today — no streak change
      return;
    } else {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (lastScan.getTime() === yesterday.getTime()) {
        // Consecutive day — increment
        user.streak.current += 1;
      } else {
        // Streak broken — reset
        user.streak.current = 1;
      }
    }

    user.streak.lastScanDate = today;
    user.streak.longest = Math.max(user.streak.longest, user.streak.current);
  }

  private async recalculateStats(userId: string): Promise<void> {
    type ScanProjection = { score: number; analysis: { styleCategory: string } };

    const scans = await Scan.find({ userId: new Types.ObjectId(userId) })
      .select('score analysis.styleCategory')
      .lean<ScanProjection[]>();

    const totalScans = scans.length;

    if (totalScans === 0) {
      await User.findByIdAndUpdate(userId, {
        $set: {
          'stats.totalScans': 0,
          'stats.averageScore': 0,
          'stats.highestScore': 0,
          'stats.favoriteStyle': null,
        },
      });
      return;
    }

    const scores = scans.map((s) => s.score);
    const averageScore =
      Math.round((scores.reduce((a, b) => a + b, 0) / totalScans) * 10) / 10;
    const highestScore = Math.max(...scores);

    // Count style categories
    const styleCounts: Record<string, number> = {};
    for (const s of scans) {
      const style = s.analysis.styleCategory;
      styleCounts[style] = (styleCounts[style] ?? 0) + 1;
    }
    const favoriteStyle =
      Object.entries(styleCounts).sort(([, a], [, b]) => b - a)[0]?.[0] ?? null;

    await User.findByIdAndUpdate(userId, {
      $set: {
        'stats.totalScans': totalScans,
        'stats.averageScore': averageScore,
        'stats.highestScore': highestScore,
        'stats.favoriteStyle': favoriteStyle,
      },
    });
  }
}

export default new ScanService();
