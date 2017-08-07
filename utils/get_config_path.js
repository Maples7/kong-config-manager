const fs = require('fs');
const exit = require('./exit');
const getAbsolutePath = require('./get_absolute_path');

module.exports = function getConfigPath(filePath) {
  const ret = getAbsolutePath(filePath);

  if (fs.existsSync(ret)) {
    // try {
    //   fs.accessSync(ret, fs.constants.R_OK);
    // } catch (e) {
    //   exit(
    //     `the program doesn't have READ permission of config file ${filePath}: ${e}`
    //   );
    // }

    return ret;
  } else {
    exit(`config file ${filePath} is NOT found`);
  }
};
