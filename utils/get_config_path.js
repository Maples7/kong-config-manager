const fs = require('fs');
const exit = require('./exit');
const getAbsolutePath = require('./get_absolute_path');

module.exports = function getConfigPath(filePath) {
  const ret = getAbsolutePath(filePath);

  if (fs.existsSync(ret)) {
    return ret;
  } else {
    exit(`config file ${filePath} is NOT found`);
  }
};
