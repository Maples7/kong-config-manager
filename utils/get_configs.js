const _ = require('lodash');
const exit = require('./exit');
const getConfigPath = require('./get_config_path');

module.exports = function getConfigs(file) {
  const configPath = getConfigPath(file);
  const configs = require(configPath);
  if (!_.isPlainObject(configs)) {
    exit('CLI configs in file should be a plain object');
  }
  return configs;
}
