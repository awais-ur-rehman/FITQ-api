import mongoose, { Document, Schema, Types } from 'mongoose';

// ─── Sub-document types ───────────────────────────────────────────────────────

export type StyleCategoryType =
  | 'streetwear'
  | 'formal'
  | 'minimalist'
  | 'casual'
  | 'bohemian'
  | 'athletic'
  | 'vintage'
  | 'smart_casual'
  | 'business_casual';

export type SeasonMatchType = 'spring' | 'summer' | 'autumn' | 'winter' | 'all_season';

export interface IScanAnalysis {
  colorHarmony: number;
  fitScore: number;
  styleCategory: StyleCategoryType;
  seasonMatch: SeasonMatchType;
  highlights: string[];
  improvements: string[];
  oneLiner: string;
  detailedBreakdown: string;
}

// ─── Document interface ───────────────────────────────────────────────────────

export interface IScan extends Document {
  userId: Types.ObjectId;
  imageUrl: string;
  thumbnailUrl: string;
  cloudinaryPublicId: string; // internal — select: false
  score: number;
  analysis: IScanAnalysis;
  isPublic: boolean;
  isFavorite: boolean;
  createdAt: Date;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const scanSchema = new Schema<IScan>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    imageUrl: { type: String, required: true },
    thumbnailUrl: { type: String, required: true },
    cloudinaryPublicId: { type: String, required: true, select: false },
    score: { type: Number, required: true, min: 0, max: 10 },
    analysis: {
      colorHarmony: { type: Number, required: true, min: 1, max: 10 },
      fitScore: { type: Number, required: true, min: 1, max: 10 },
      styleCategory: {
        type: String,
        required: true,
        enum: [
          'streetwear',
          'formal',
          'minimalist',
          'casual',
          'bohemian',
          'athletic',
          'vintage',
          'smart_casual',
          'business_casual',
        ],
      },
      seasonMatch: {
        type: String,
        required: true,
        enum: ['spring', 'summer', 'autumn', 'winter', 'all_season'],
      },
      highlights: [{ type: String }],
      improvements: [{ type: String }],
      oneLiner: { type: String, required: true, maxlength: 100 },
      detailedBreakdown: { type: String, required: true },
    },
    isPublic: { type: Boolean, default: false },
    isFavorite: { type: Boolean, default: false },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: {
      transform(
        _doc: unknown,
        ret: Record<string, unknown>,
      ): Record<string, unknown> {
        ret['id'] = ret['_id'];
        delete ret['_id'];
        delete ret['__v'];
        delete ret['cloudinaryPublicId'];
        return ret;
      },
    },
  },
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

scanSchema.index({ userId: 1, createdAt: -1 });
scanSchema.index({ userId: 1, isFavorite: 1 });

export default mongoose.model<IScan>('Scan', scanSchema);
