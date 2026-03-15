import { Types } from 'mongoose';
import User from '../models/User';
import Scan from '../models/Scan';
import ApiError from '../utils/apiError';

interface ScoreDistribution {
  '0-3': number;
  '4-5': number;
  '6-7': number;
  '8-9': number;
  '10': number;
}

interface MonthlyCount {
  month: string;
  count: number;
}

interface UserStatsResult {
  totalScans: number;
  averageScore: number;
  highestScore: number;
  streak: { current: number; longest: number };
  favoriteStyle: string | null;
  scoreDistribution: ScoreDistribution;
  monthlyScanCount: MonthlyCount[];
  styleCategoryBreakdown: Record<string, number>;
}

class StatsService {
  async getUserStats(userId: string): Promise<UserStatsResult> {
    const user = await User.findById(userId).lean();
    if (!user) throw new ApiError(404, 'User not found');

    const [scoreDistribution, monthlyScanCount, styleCategoryBreakdown] = await Promise.all([
      this.getScoreDistribution(userId),
      this.getMonthlyScanCount(userId),
      this.getStyleBreakdown(userId),
    ]);

    return {
      totalScans: user.stats.totalScans,
      averageScore: user.stats.averageScore,
      highestScore: user.stats.highestScore,
      streak: { current: user.streak.current, longest: user.streak.longest },
      favoriteStyle: user.stats.favoriteStyle,
      scoreDistribution,
      monthlyScanCount,
      styleCategoryBreakdown,
    };
  }

  async getScoreDistribution(userId: string): Promise<ScoreDistribution> {
    type BucketResult = { _id: number | string; count: number };

    const result = await Scan.aggregate<BucketResult>([
      { $match: { userId: new Types.ObjectId(userId) } },
      {
        $bucket: {
          groupBy: '$score',
          boundaries: [0, 4, 6, 8, 10],
          default: '10',
          output: { count: { $sum: 1 } },
        },
      },
    ]);

    const labels: Record<number, keyof ScoreDistribution> = {
      0: '0-3',
      4: '4-5',
      6: '6-7',
      8: '8-9',
    };

    const distribution: ScoreDistribution = { '0-3': 0, '4-5': 0, '6-7': 0, '8-9': 0, '10': 0 };
    for (const bucket of result) {
      const key = bucket._id === '10' ? '10' : labels[bucket._id as number];
      if (key) distribution[key] = bucket.count;
    }
    return distribution;
  }

  async getMonthlyScanCount(userId: string): Promise<MonthlyCount[]> {
    type MonthResult = { _id: string; count: number };

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const result = await Scan.aggregate<MonthResult>([
      {
        $match: {
          userId: new Types.ObjectId(userId),
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return result.map((r) => ({ month: r._id, count: r.count }));
  }

  async getStyleBreakdown(userId: string): Promise<Record<string, number>> {
    type StyleResult = { _id: string; count: number };

    const result = await Scan.aggregate<StyleResult>([
      { $match: { userId: new Types.ObjectId(userId) } },
      {
        $group: {
          _id: '$analysis.styleCategory',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const breakdown: Record<string, number> = {};
    for (const r of result) {
      if (r._id) breakdown[r._id] = r.count;
    }
    return breakdown;
  }
}

export default new StatsService();
