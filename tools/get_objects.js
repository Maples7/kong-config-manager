'use strict';

const rp = require('request-promise');
const semver = require('semver');
const ENUMS = require('../enums');

module.exports = function getObjects(url) {
  return rp(url).then(body => {
    const res = JSON.parse(body);
    var version;
    if (res.version.endsWith("enterprise-edition")) {
        version = res.version.replace("-enterprise-edition", ".0");
    } else {
        version = res.version;
    }
    return semver.gte(version, '0.11.0')
      ? semver.gte(version, '0.13.0')
	? semver.gte(version, '0.33.0')
          ? semver.gte(version, '0.14.0')
	    ? semver.gte(version, '0.34.0')
              ? ENUMS.OBJECTS['0.14.x']
              : ENUMS.OBJECTS['0.14.x']
	    : ENUMS.OBJECTS['0.13.x']
          : ENUMS.OBJECTS['0.13.x']
        : ENUMS.OBJECTS['0.11.x']
      : ENUMS.OBJECTS['0.10.x'];
  });
};
