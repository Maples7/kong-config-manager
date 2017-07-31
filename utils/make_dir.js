const fse = require('fs-extra');
const path = require('path');
const debug = require('debug')('kcm:make_dir');
const exit = require('./exit');

module.exports = function makeDir(dirName) {
  debug(`Ready to make dir ${dirName}...`);
  const dirPath = path.resolve(process.cwd(), dirName);
  debug(`Dir path is ${dirPath}`);
  try {
    fse.ensureDirSync(dirPath);
  } catch (e) {
    exit(`Fail to make dir ${dirName}: ${e}`);
  }
  debug('Finished!');
};
