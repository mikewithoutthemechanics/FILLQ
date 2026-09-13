import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { logger } from './logger.js';

let redisConnection: Redis | null = null;
let filliqQueue: Queue | null = null;

const redisUrl = process.env.REDIS_URL;

if (redisUrl) {
  try {
    redisConnection = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false
    });

    redisConnection.on('error', (err) => {
      logger.warn('Redis connection error in BullMQ:', err.message);
    });

    redisConnection.on('connect', () => {
      logger.info('Connected to Redis for BullMQ queues');
    });

    filliqQueue = new Queue('filliq-jobs', { connection: redisConnection });
  } catch (error) {
    logger.warn('Failed to initialize Redis/BullMQ. Falling back to in-process timers:', error);
  }
} else {
  logger.info('REDIS_URL not set. Running jobs with in-process timers.');
}

export interface EnqueueJobOptions {
  name: string;
  data: any;
  delayMs?: number;
}

/**
 * Enqueue a job into BullMQ queue if Redis is available, or execute inline fallback.
 */
export async function enqueueJob(options: EnqueueJobOptions, fallbackFn: () => Promise<void>) {
  if (filliqQueue && redisConnection) {
    try {
      await filliqQueue.add(options.name, options.data, {
        delay: options.delayMs || 0,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        }
      });
      logger.info(`Enqueued BullMQ job: ${options.name} with delay ${options.delayMs || 0}ms`);
      return;
    } catch (err) {
      logger.warn(`Failed to enqueue BullMQ job ${options.name}. Executing inline fallback:`, err);
    }
  }

  // In-process fallback timer
  if (options.delayMs && options.delayMs > 0) {
    setTimeout(() => {
      fallbackFn().catch((err) => logger.error(`Inline job fallback error for ${options.name}:`, err));
    }, options.delayMs);
  } else {
    setImmediate(() => {
      fallbackFn().catch((err) => logger.error(`Inline job fallback error for ${options.name}:`, err));
    });
  }
}

export { filliqQueue, redisConnection };
