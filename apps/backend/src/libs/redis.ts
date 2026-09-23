import { Redis } from 'ioredis'

const redis = new Redis({
  host: process.env.REDIS_HOST ?? 'localhost',
  port: Number(process.env.REDIS_PORT as unknown as number ?? 6379),

  maxRetriesPerRequest: 2,
  retryStrategy: (times) => {
    return Math.min(times * 200, 3000)
  }
})

redis.on('connect', () => {
  console.log('[Redis] connected');
})

redis.on('ready', () => {
  console.log('[Redis] ready');
})

redis.on('error', (error) => {
  console.error('[Redis] error:', error)
})

export default redis
