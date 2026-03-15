import mongoose from 'mongoose';

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 5_000;

const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGODB_URI;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await mongoose.connect(uri);
      console.log('✓ MongoDB connected');
      return;
    } catch (error) {
      if (attempt === MAX_RETRIES) {
        console.error('✗ MongoDB connection failed after max retries');
        throw error;
      }
      console.warn(
        `MongoDB attempt ${attempt}/${MAX_RETRIES} failed. Retrying in ${RETRY_DELAY_MS / 1000}s...`,
      );
      await new Promise<void>((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }
};

export default connectDB;
