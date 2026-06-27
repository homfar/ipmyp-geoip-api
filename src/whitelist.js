const { originWhitelist, ipWhitelist } = require('./config');
const { getClientIP } = require('./utils');
const logger = require('./logger');

function extractHostname(headerValue) {
  if (!headerValue) return null;
  try {
    const url = new URL(headerValue);
    return url.hostname.toLowerCase();
  } catch (e) {
    return null;
  }
}

function whitelistMiddleware(req, res, next) {
  if (!originWhitelist.length && !ipWhitelist.length) {
    return next();
  }

  const clientIP = getClientIP(req);
  const originHost = extractHostname(req.headers.origin);
  const refererHost = extractHostname(req.headers.referer);

  const ipAllowed = ipWhitelist.length > 0 && clientIP && ipWhitelist.includes(clientIP);
  const originAllowed =
    originWhitelist.length > 0 &&
    ((originHost && originWhitelist.includes(originHost)) ||
      (refererHost && originWhitelist.includes(refererHost)));

  if (!ipAllowed && !originAllowed) {
    logger.warn('whitelist_block', {
      ip: clientIP,
      origin: originHost,
      referer: refererHost,
      path: req.path,
    });

    return res.status(403).json({
      status: 'fail',
      message: 'forbidden origin',
      query: clientIP,
    });
  }

  return next();
}

module.exports = whitelistMiddleware;
