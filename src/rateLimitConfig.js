const { rateLimitWindowSec, rateLimitMax } = require('./config');

module.exports = {
  default: {
    max: rateLimitMax,
    windowSec: rateLimitWindowSec,
  },

  // Exact-match overrides only. Do not use CIDR/range notation here unless you implement explicit CIDR matching.
  perIP: {
    // '203.0.113.10': { max: 1200, windowSec: 60 },
  },
};
