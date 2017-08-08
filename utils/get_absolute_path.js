'use strict';

const path = require('path');

module.exports = filePath =>
  path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
