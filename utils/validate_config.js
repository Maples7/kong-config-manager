'use strict';

const _ = require('lodash');
const exit = require('./exit');

module.exports = function validateConfig(conf, name) {
  if (_.isString(conf)) {
    conf = { host: conf };
  }
  if (!_.isPlainObject(conf)) {
    exit(`value of ${name} field in config file must be a plain object or a string`);
  }
  if (!conf.host) {
    exit(`required 'host' field of '${name}' is NOT found in config file`);
  }
  if (!_.isString(conf.host)) {
    exit(
      `'host' field of '${name}' must be a string, e.g. https://localhost:8444`
    );
  }
  return conf;
};
