const debug = require('debug')('kcm:parse_params');
const exit = require('./exit');
const getConfigPath = require('./get_config_path');

module.exports = function parseParams(program) {
  debug('Start to parse command params...');

  const ret = {
    host: program.host,
    file: getConfigPath(program.file),
    instance: program.instance,
    all: program.all
  };

  debug('Finished!');

  return ret;
};
