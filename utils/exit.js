const chalk = require('chalk');

module.exports = function exit(errMessage) {
  console.error(chalk(errMessage));
  process.exit(1);
};
