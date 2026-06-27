const Redis = require('ioredis');
const { redisUrl } = require('./config');
const rateLimitConfig = require('./rateLimitConfig');
const { getClientIP } = require('./utils');
const logger = require('./logger');

const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: 1,
  enableReadyCheck: true,
});

const inMemoryStore = new Map();

redis.on('error', (error) => {
  logger.warn('redis_error', { error: error.message });
});

function getRateConfigForIP(ip) {
  if (ip && rateLimitConfig.perIP[ip]) return rateLimitConfig.perIP[ip];
  return rateLimitConfig.default;
}

async function redisRateLimit(ip) {
  const { max, windowSec } = getRateConfigForIP(ip);
  const key = `rl:${ip}:${windowSec}`;

  const tx = redis.multi();
  tx.incr(key);
  tx.ttl(key);
  const results = await tx.exec();
  const count = results?.[0]?.[1] || 0;
  const ttl = results?.[1]?.[1] || -1;

  if (count === 1 || ttl === -1) {
    await redis.expire(key, windowSec);
  }

  const remaining = Math.max(0, max - count);
  const ttlSeconds = ttl > 0 ? ttl : windowSec;

  return { count, remaining, ttlSeconds, max, windowSec, backend: 'redis' };
}

function memoryRateLimit(ip) {
  const { max, windowSec } = getRateConfigForIP(ip);
  const now = Date.now();
  const windowMs = windowSec * 1000;

  let entry = inMemoryStore.get(ip);
  if (!entry || now > entry.resetAt || entry.windowSec !== windowSec) {
    entry = { count: 0, resetAt: now + windowMs, windowSec };
  }

  entry.count += 1;
  inMemoryStore.set(ip, entry);

  const remaining = Math.max(0, max - entry.count);
  const ttlSeconds = Math.max(0, Math.floor((entry.resetAt - now) / 1000));

  return { count: entry.count, remaining, ttlSeconds, max, windowSec, backend: 'memory' };
}

async function getRateLimitHealth() {
  try {
    const pong = await redis.ping();
    return { redis: pong === 'PONG' ? 'connected' : 'unknown' };
  } catch (error) {
    return { redis: 'unavailable', error: error.message };
  }
}

async function rateLimitMiddleware(req, res, next) {
  try {
    const ip = getClientIP(req) || 'unknown';

    let info;
    try {
      info = await redisRateLimit(ip);
    } catch (error) {
      logger.warn('rate_limit_redis_unavailable_using_memory', { error: error.message });
      info = memoryRateLimit(ip);
    }

    res.setHeader('X-Rl', info.remaining);
    res.setHeader('X-Ttl', info.ttlSeconds);
    res.setHeader('X-Limit-Max', info.max);
    res.setHeader('X-Limit-Window', info.windowSec);
    res.setHeader('X-RateLimit-Backend', info.backend);

    if (info.count > info.max) {
      logger.warn('rate_limit_block', {
        ip,
        count: info.count,
        max: info.max,
        windowSec: info.windowSec,
        path: req.path,
      });

      return res.status(429).json({
        status: 'fail',
        message: 'rate limit exceeded',
        query: ip,
      });
    }

    return next();
  } catch (error) {
    logger.error('rate_limit_unexpected_error', { error: error.message });
    return next();
  }
}

module.exports = rateLimitMiddleware;
module.exports.getRateLimitHealth = getRateLimitHealth;
