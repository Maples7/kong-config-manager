'use strict';

const fs = require('fs');
const logger = require('./logger');
const getAbsolutePath = require('./get_absolute_path');

module.exports = function getConfigPath(filePath) {
  const ret = getAbsolutePath(filePath);

  if (fs.existsSync(ret)) {
    return ret;
  } else {
    logger.error(`config file ${filePath} is NOT found`);
  }
};
