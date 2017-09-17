'use strict';

const _ = require('lodash');
const logger = require('./logger');

module.exports = function validateConfig(conf, name) {
  if (_.isString(conf)) {
    conf = { host: conf };
  }
  if (!_.isPlainObject(conf)) {
    logger.error(
      `value of ${name} field in config file must be a plain object or a string`
    );
  }
  if (!conf.host) {
    logger.error(
      `required 'host' field of '${name}' is NOT found in config file`
    );
  }
  if (!_.isString(conf.host)) {
    logger.error(
      `'host' field of '${name}' must be a string, e.g. https://localhost:8444`
    );
  }
  return conf;
};
