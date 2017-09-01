'use strict';

const chalk = require('chalk');

module.exports = function exit(errMessage) {
  console.error(chalk.red(`[ERROR] ${errMessage}`));
  process.exit(1);
};
