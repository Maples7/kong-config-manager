'use strict';

const chalk = require('chalk');

module.exports = function exit(errMessage) {
  console.error(chalk.red(errMessage));
  process.exit(1);
};
