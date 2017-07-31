const fs = require('fs');
const path = require('path');
const exit = require('./exit');

module.exports = function getConfigPath(filePath) {
  const ret = path.isAbsolute(filePath)
    ? filePath
    : path.resolve(process.cwd(), filePath);

  if (fs.existsSync(ret)) {
    try {
      fs.accessSync(ret, fs.constants.R_OK);
    } catch (e) {
      exit(
        `the program doesn't have READ permission of config file ${filePath}: ${e}`
      );
    }

    return ret;
  } else {
    exit(`config file ${filePath} is NOT found`);
  }
};
