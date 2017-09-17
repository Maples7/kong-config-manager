'use strict';

const chalk = require('chalk');

module.exports = {
  info: msg => {
    console.log(chalk.green('[INFO]'), msg);
  },
  warning: msg => {
    console.log(chalk.yellow('[WARNING]'), msg);
  },
  error: msg => {
    console.log(chalk.red('[ERROR]'), msg);
    process.exit(1);
  }
};
