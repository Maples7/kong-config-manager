'use strict';

const _ = require('lodash');
const logger = require('./logger');
const getConfigPath = require('./get_config_path');

module.exports = function getConfigs(file) {
  const configPath = getConfigPath(file);
  const configs = require(configPath);
  if (!_.isPlainObject(configs)) {
    logger.error('CLI configs in file should be a plain object');
  }
  return configs;
}
