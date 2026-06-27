const dns = require('dns').promises;
const net = require('net');
const { trustProxy } = require('./config');

function normalizeIP(ip) {
  if (!ip || typeof ip !== 'string') return '';
  let value = ip.trim();
  if (value.startsWith('::ffff:')) value = value.substring(7);
  return value;
}

function getHeaderIP(headers, name) {
  const value = normalizeIP(headers[name]);
  return value && net.isIP(value) ? value : '';
}

function getForwardedForIP(headers) {
  const xffHeader = headers['x-forwarded-for'] || headers['x-forwardedfor'];
  if (!xffHeader) return '';

  const parts = String(xffHeader)
    .split(',')
    .map((s) => normalizeIP(s))
    .filter(Boolean);

  for (const part of parts) {
    if (net.isIP(part)) return part;
  }

  return '';
}

function getSocketIP(req) {
  const ip = normalizeIP(req.ip || req.socket?.remoteAddress || req.connection?.remoteAddress || '');
  return ip;
}

function getClientIP(req) {
  const headers = req.headers || {};

  if (trustProxy) {
    return (
      getHeaderIP(headers, 'ar-real-ip') ||
      getHeaderIP(headers, 'cf-connecting-ip') ||
      getHeaderIP(headers, 'x-real-ip') ||
      getForwardedForIP(headers) ||
      getSocketIP(req)
    );
  }

  return getSocketIP(req);
}

async function resolveQueryToIP(query) {
  if (!query || typeof query !== 'string') return null;

  const normalized = query.trim();
  if (!normalized || normalized.length > 253) return null;

  if (net.isIP(normalized)) return normalized;

  try {
    const res = await dns.lookup(normalized, { family: 0 });
    return res.address;
  } catch (e) {
    return null;
  }
}

function cityRecordToIpApi(ip, queryString, city, asn) {
  if (!city) {
    return {
      status: 'fail',
      message: 'invalid query',
      query: queryString || ip,
    };
  }

  const country = city.country || {};
  const subdiv = (city.subdivisions && city.subdivisions[0]) || {};
  const location = city.location || {};

  let as = '';
  let asname = '';
  let isp = null;
  let org = null;

  if (asn && asn.autonomous_system_number && asn.autonomous_system_organization) {
    as = `AS${asn.autonomous_system_number} ${asn.autonomous_system_organization}`;
    asname = asn.autonomous_system_organization;
    isp = asn.autonomous_system_organization;
    org = asn.autonomous_system_organization;
  }

  return {
    status: 'success',
    continent: city.continent?.names?.en || null,
    continentCode: city.continent?.code || null,
    country: country.names?.en || null,
    countryCode: country.iso_code || null,
    region: subdiv.iso_code || null,
    regionName: subdiv.names?.en || null,
    city: city.city?.names?.en || null,
    district: null,
    zip: city.postal?.code || null,
    lat: location.latitude || null,
    lon: location.longitude || null,
    timezone: location.time_zone || null,
    offset: null,
    currency: null,
    isp,
    org,
    as,
    asname,
    reverse: null,
    mobile: false,
    proxy: false,
    hosting: false,
    query: queryString || ip,
  };
}

function filterFields(obj, fieldsParam) {
  if (!fieldsParam || typeof fieldsParam !== 'string') return obj;

  const fields = fieldsParam
    .split(',')
    .map((f) => f.trim())
    .filter(Boolean);

  if (!fields.length) return obj;

  const out = {};
  for (const field of fields) {
    if (Object.prototype.hasOwnProperty.call(obj, field)) {
      out[field] = obj[field];
    }
  }
  return out;
}

function isValidJsonpCallback(callback) {
  if (!callback || typeof callback !== 'string') return false;
  return /^[A-Za-z_$][0-9A-Za-z_$]*(\.[A-Za-z_$][0-9A-Za-z_$]*)*$/.test(callback);
}

function wrapJsonp(callback, payload) {
  if (!isValidJsonpCallback(callback)) {
    throw new Error('invalid JSONP callback');
  }
  return `${callback}(${JSON.stringify(payload)});`;
}

module.exports = {
  getClientIP,
  resolveQueryToIP,
  cityRecordToIpApi,
  filterFields,
  isValidJsonpCallback,
  wrapJsonp,
};
