'use strict';

const fse = require('fs-extra');
const path = require('path');
const debug = require('debug')('kcm:make_dir');
const logger = require('./logger');

module.exports = function makeDir(dirName) {
  debug(`Ready to make dir ${dirName}...`);
  const dirPath = path.resolve(process.cwd(), dirName);
  debug(`Dir path is ${dirPath}`);
  try {
    fse.removeSync(dirPath);
    fse.ensureDirSync(dirPath);
  } catch (e) {
    logger.error(`Fail to make dir ${dirName}: ${e}`);
  }
  debug(`mkdir ${dirName} finished!`);
};
