import { geminiModel } from '../config/gemini';
import ApiError from '../utils/apiError';
import type { StyleCategoryType, SeasonMatchType } from '../models/Scan';

export interface GeminiAnalysis {
  score: number;
  colorHarmony: number;
  fitScore: number;
  styleCategory: StyleCategoryType;
  seasonMatch: SeasonMatchType;
  highlights: string[];
  improvements: string[];
  oneLiner: string;
  detailedBreakdown: string;
}

const SYSTEM_PROMPT = `You are FITQ AI, an expert fashion analyst with the sharp eye of a celebrity stylist and the honesty of a best friend. You rate outfits on a 0-10 scale.

RULES:
- Be brutally honest but never mean. Constructive, not destructive.
- Be specific. Never say "nice outfit." Say what exactly works or doesn't.
- Your one-liner should be witty, memorable, and shareable. Think tweet energy.
- If the image is not a person wearing clothes (e.g., a random object, screenshot, meme), return a score of 0 and a funny one-liner about it not being an outfit.
- Consider: color coordination, fit/silhouette, occasion appropriateness, accessory game, footwear choice, seasonal relevance, and overall cohesion.
- A 10 is rare. A 5 is average. Below 3 means something went very wrong.

RESPOND IN THIS EXACT JSON FORMAT AND NOTHING ELSE:
{
  "score": <number 0-10 with one decimal>,
  "colorHarmony": <number 1-10>,
  "fitScore": <number 1-10>,
  "styleCategory": "<one of: streetwear, formal, minimalist, casual, bohemian, athletic, vintage, smart_casual, business_casual>",
  "seasonMatch": "<one of: spring, summer, autumn, winter, all_season>",
  "highlights": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "improvements": ["<suggestion 1>", "<suggestion 2>"],
  "oneLiner": "<witty roast or compliment under 100 chars>",
  "detailedBreakdown": "<2-3 sentence detailed analysis>"
}`;

const VALID_STYLE_CATEGORIES: StyleCategoryType[] = [
  'streetwear', 'formal', 'minimalist', 'casual', 'bohemian',
  'athletic', 'vintage', 'smart_casual', 'business_casual',
];

const VALID_SEASONS: SeasonMatchType[] = [
  'spring', 'summer', 'autumn', 'winter', 'all_season',
];

class GeminiService {
  async analyzeOutfit(imageBuffer: Buffer, mimeType: string): Promise<GeminiAnalysis> {
    try {
      const result = await geminiModel.generateContent([
        SYSTEM_PROMPT,
        {
          inlineData: {
            data: imageBuffer.toString('base64'),
            mimeType,
          },
        },
      ]);

      const text = result.response.text();
      return this.parseAndValidate(text);
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw new ApiError(503, 'AI analysis service temporarily unavailable. Please try again.');
    }
  }

  private parseAndValidate(text: string): GeminiAnalysis {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new ApiError(503, 'AI returned an invalid response. Please try again.');
    }

    let raw: unknown;
    try {
      raw = JSON.parse(jsonMatch[0]);
    } catch {
      throw new ApiError(503, 'AI returned an invalid response. Please try again.');
    }

    if (typeof raw !== 'object' || raw === null) {
      throw new ApiError(503, 'AI returned an invalid response. Please try again.');
    }

    const d = raw as Record<string, unknown>;

    const score = Math.round(Math.min(10, Math.max(0, Number(d['score']))) * 10) / 10;
    const colorHarmony = Math.round(Math.min(10, Math.max(1, Number(d['colorHarmony']))));
    const fitScore = Math.round(Math.min(10, Math.max(1, Number(d['fitScore']))));

    const styleCategory = VALID_STYLE_CATEGORIES.includes(d['styleCategory'] as StyleCategoryType)
      ? (d['styleCategory'] as StyleCategoryType)
      : 'casual';

    const seasonMatch = VALID_SEASONS.includes(d['seasonMatch'] as SeasonMatchType)
      ? (d['seasonMatch'] as SeasonMatchType)
      : 'all_season';

    const highlights = Array.isArray(d['highlights'])
      ? (d['highlights'] as unknown[]).slice(0, 3).map(String)
      : [];

    const improvements = Array.isArray(d['improvements'])
      ? (d['improvements'] as unknown[]).slice(0, 2).map(String)
      : [];

    const oneLiner = String(d['oneLiner'] ?? '').slice(0, 100);
    const detailedBreakdown = String(d['detailedBreakdown'] ?? '');

    return {
      score,
      colorHarmony,
      fitScore,
      styleCategory,
      seasonMatch,
      highlights,
      improvements,
      oneLiner,
      detailedBreakdown,
    };
  }
}

export default new GeminiService();
