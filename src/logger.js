function log(level, message, meta = {}) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    service: process.env.SERVICE_NAME || 'ipmyp-geoip-api',
    message,
    ...meta,
  };

  const line = JSON.stringify(entry);
  if (level === 'error') return console.error(line);
  if (level === 'warn') return console.warn(line);
  return console.log(line);
}

module.exports = {
  info: (message, meta) => log('info', message, meta),
  warn: (message, meta) => log('warn', message, meta),
  error: (message, meta) => log('error', message, meta),
};
