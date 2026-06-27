const maxmind = require('maxmind');
const geolite2 = require('geolite2');
const logger = require('./logger');

let cityLookup;
let asnLookup;

async function initGeoIP() {
  cityLookup = await maxmind.open(geolite2.paths['GeoLite2-City']);
  asnLookup = await maxmind.open(geolite2.paths['GeoLite2-ASN']);
  logger.info('geoip_databases_loaded');
}

function isGeoIPReady() {
  return Boolean(cityLookup && asnLookup);
}

function getGeoData(ip) {
  if (!isGeoIPReady()) {
    throw new Error('GeoIP not initialized');
  }

  const city = cityLookup.get(ip);
  const asn = asnLookup.get(ip);

  return { city, asn };
}

module.exports = {
  initGeoIP,
  isGeoIPReady,
  getGeoData,
};
