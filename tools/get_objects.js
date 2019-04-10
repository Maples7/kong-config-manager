'use strict';

const rp = require('request-promise');
const semver = require('semver');
const ENUMS = require('../enums');
const debug = require('debug')('kcm:get-objects');

module.exports = function getObjects(url, ssl) {
  return rp({
      method: 'GET',
      uri: url,
      insecure: !ssl, rejectUnauthorized: ssl,
      timeout: ENUMS.REQUEST_TIMEOUT
    }).then(body => {
    const res = JSON.parse(body);
    let version = res.version;
    debug(`We obtained this version:${version}`);
    // Handle version of enterprise-edition
    if (version.endsWith('enterprise-edition')) {
      switch (version) {
        case '0.33-enterprise-edition':
          version = '0.13.0';
          break;
        case '0.34-enterprise-edition':
          version = '0.14.0';
          break;
        default:
          version = '0.14.0';
          break;
      }
    }

    return semver.gte(version, '0.11.0')
      ? semver.gte(version, '0.13.0')
        ? semver.gte(version, '0.14.0')
          ? ENUMS.OBJECTS['0.14.x']
          : ENUMS.OBJECTS['0.13.x']
        : ENUMS.OBJECTS['0.11.x']
      : ENUMS.OBJECTS['0.10.x'];
  });
};
