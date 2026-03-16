import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: false,
  retryStrategy: (times: number) => {
    if (times > 3) return null; // stop retrying after 3 attempts
    return Math.min(times * 500, 2000);
  },
});

redis.on('connect', () => console.log('✓ Redis connected'));
redis.on('error', (err: Error) => {
  if (redis.status !== 'ready') {
    console.error('✗ Redis error:', err.message);
  }
});

export default redis;
