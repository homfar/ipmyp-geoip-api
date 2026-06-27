const express = require('express');
const bodyParser = require('body-parser');
const rateLimitMiddleware = require('./rateLimit');
const whitelistMiddleware = require('./whitelist');
const { initGeoIP, isGeoIPReady, getGeoData } = require('./geoip');
const {
  getClientIP,
  resolveQueryToIP,
  cityRecordToIpApi,
  filterFields,
  isValidJsonpCallback,
  wrapJsonp,
} = require('./utils');
const {
  port,
  serviceName,
  env,
  trustProxy,
  jsonpEnabled,
  maxBatchSize,
  corsAllowedOrigins,
} = require('./config');
const logger = require('./logger');

const { getRateLimitHealth } = rateLimitMiddleware;

function securityHeaders(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Frame-Options', 'DENY');
  return next();
}

function corsMiddleware(req, res, next) {
  if (!corsAllowedOrigins.length) return next();

  const origin = req.headers.origin;
  if (origin && corsAllowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Max-Age', '86400');
  }

  if (req.method === 'OPTIONS') return res.status(204).end();
  return next();
}

function sendPayload(req, res, payload, statusCode = 200) {
  const callback = req.query.callback;

  if (callback) {
    if (!jsonpEnabled) {
      return res.status(400).json({
        status: 'fail',
        message: 'JSONP is disabled',
      });
    }

    if (!isValidJsonpCallback(callback)) {
      return res.status(400).json({
        status: 'fail',
        message: 'invalid JSONP callback',
      });
    }

    res.status(statusCode);
    res.set('Content-Type', 'application/javascript; charset=utf-8');
    return res.send(wrapJsonp(callback, payload));
  }

  return res.status(statusCode).json(payload);
}

async function buildLookupPayload(queryString, fields) {
  const ip = await resolveQueryToIP(queryString);

  if (!ip) {
    return filterFields(
      {
        status: 'fail',
        message: 'invalid query',
        query: queryString,
      },
      fields,
    );
  }

  const { city, asn } = getGeoData(ip);
  const payload = cityRecordToIpApi(ip, queryString, city, asn);
  return filterFields(payload, fields);
}

async function main() {
  await initGeoIP();

  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', trustProxy);

  app.use(bodyParser.json({ limit: '1mb' }));
  app.use(securityHeaders);
  app.use(corsMiddleware);

  app.get(['/health', '/v1/health'], (req, res) => {
    res.json({
      status: 'ok',
      service: serviceName,
      env,
      geoip: isGeoIPReady() ? 'loaded' : 'not_loaded',
      uptime: Math.round(process.uptime()),
    });
  });

  app.get(['/ready', '/v1/ready'], async (req, res) => {
    const rateLimitHealth = await getRateLimitHealth();
    const ready = isGeoIPReady() && rateLimitHealth.redis === 'connected';

    res.status(ready ? 200 : 503).json({
      status: ready ? 'ready' : 'not_ready',
      service: serviceName,
      geoip: isGeoIPReady() ? 'loaded' : 'not_loaded',
      ...rateLimitHealth,
    });
  });

  app.use(whitelistMiddleware);
  app.use(rateLimitMiddleware);

  app.get(['/json/:query?', '/json/'], async (req, res) => {
    try {
      const queryParam = req.params.query || '';
      const queryString = queryParam || getClientIP(req);
      const payload = await buildLookupPayload(queryString, req.query.fields);
      return sendPayload(req, res, payload, payload.status === 'success' ? 200 : 400);
    } catch (error) {
      logger.error('json_lookup_error', { error: error.message, path: req.path });
      return sendPayload(
        req,
        res,
        {
          status: 'fail',
          message: 'internal server error',
          query: req.params.query || getClientIP(req),
        },
        500,
      );
    }
  });

  app.post('/batch', async (req, res) => {
    try {
      if (!Array.isArray(req.body)) {
        return res.status(400).json({
          status: 'fail',
          message: 'invalid body, expected JSON array',
        });
      }

      if (req.body.length > maxBatchSize) {
        return res.status(413).json({
          status: 'fail',
          message: `batch size limit exceeded; maximum allowed is ${maxBatchSize}`,
        });
      }

      const results = [];
      for (const item of req.body) {
        const queryString = typeof item === 'string' ? item : item?.query || getClientIP(req);
        results.push(await buildLookupPayload(queryString, req.query.fields));
      }

      return res.json(results);
    } catch (error) {
      logger.error('batch_lookup_error', { error: error.message });
      return res.status(500).json({
        status: 'fail',
        message: 'internal server error',
      });
    }
  });

  app.use((req, res) => {
    res.status(404).json({
      status: 'fail',
      message: 'not found',
    });
  });

  app.listen(port, () => {
    logger.info('server_started', { port, trustProxy, jsonpEnabled, maxBatchSize });
  });
}

main().catch((error) => {
  logger.error('fatal_startup_error', { error: error.message });
  process.exit(1);
});
