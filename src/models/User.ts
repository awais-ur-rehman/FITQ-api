import mongoose, { Document, Schema } from 'mongoose';

// ─── Sub-document types ───────────────────────────────────────────────────────

export type GenderType = 'male' | 'female' | 'other' | 'prefer_not_to_say';

export type StyleType =
  | 'streetwear'
  | 'formal'
  | 'minimalist'
  | 'casual'
  | 'bohemian'
  | 'athletic'
  | 'vintage';

export interface IUserStreak {
  current: number;
  longest: number;
  lastScanDate: Date | null;
}

export interface IUserStats {
  totalScans: number;
  averageScore: number;
  highestScore: number;
  favoriteStyle: string | null;
}

// ─── Document interface ───────────────────────────────────────────────────────

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  name: string;
  username: string;
  avatarUrl: string | null;
  gender: GenderType | null;
  dateOfBirth: Date | null;
  stylePreference: StyleType | null;
  bio: string | null;
  isVerified: boolean;
  isPro: boolean;
  streak: IUserStreak;
  stats: IUserStats;
  refreshToken: string | null;
  passwordResetToken: string | null;
  passwordResetExpires: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    avatarUrl: { type: String, default: null },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer_not_to_say'],
      default: null,
    },
    dateOfBirth: { type: Date, default: null },
    stylePreference: {
      type: String,
      enum: [
        'streetwear',
        'formal',
        'minimalist',
        'casual',
        'bohemian',
        'athletic',
        'vintage',
      ],
      default: null,
    },
    bio: { type: String, maxlength: 150, default: null },
    isVerified: { type: Boolean, default: false },
    isPro: { type: Boolean, default: false },
    streak: {
      current: { type: Number, default: 0 },
      longest: { type: Number, default: 0 },
      lastScanDate: { type: Date, default: null },
    },
    stats: {
      totalScans: { type: Number, default: 0 },
      averageScore: { type: Number, default: 0 },
      highestScore: { type: Number, default: 0 },
      favoriteStyle: { type: String, default: null },
    },
    refreshToken: { type: String, default: null, select: false },
    passwordResetToken: { type: String, default: null, select: false },
    passwordResetExpires: { type: Date, default: null, select: false },
  },
  {
    timestamps: true,
    toJSON: {
      transform(
        _doc: unknown,
        ret: Record<string, unknown>,
      ): Record<string, unknown> {
        ret['id'] = ret['_id'];
        delete ret['_id'];
        delete ret['__v'];
        delete ret['passwordHash'];
        delete ret['refreshToken'];
        delete ret['passwordResetToken'];
        delete ret['passwordResetExpires'];
        return ret;
      },
    },
  },
);

export default mongoose.model<IUser>('User', userSchema);
