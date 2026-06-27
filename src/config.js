require('dotenv').config();

function parseList(value) {
  return (value || '')
    .split(',')
    .map((d) => d.trim())
    .filter(Boolean);
}

function parseBool(value, fallback = false) {
  if (value === undefined || value === null || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
}

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

module.exports = {
  serviceName: process.env.SERVICE_NAME || 'ipmyp-geoip-api',
  env: process.env.NODE_ENV || 'development',
  port: parsePositiveInt(process.env.PORT, 3010),

  rateLimitWindowSec: parsePositiveInt(process.env.RATE_LIMIT_WINDOW_SEC, 60),
  rateLimitMax: parsePositiveInt(process.env.RATE_LIMIT_MAX_REQUESTS, 45),
  maxBatchSize: parsePositiveInt(process.env.MAX_BATCH_SIZE, 50),

  redisUrl: process.env.REDIS_URL || 'redis://redis:6379',

  trustProxy: parseBool(process.env.TRUST_PROXY, false),
  jsonpEnabled: parseBool(process.env.JSONP_ENABLED, false),

  originWhitelist: parseList(process.env.ORIGIN_WHITELIST).map((d) => d.toLowerCase()),
  ipWhitelist: parseList(process.env.IP_WHITELIST),
  corsAllowedOrigins: parseList(process.env.CORS_ALLOWED_ORIGINS),
};
