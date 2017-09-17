'use strict';

const fs = require('fs');
const stringify = require('json-stable-stringify');

module.exports = function writeJsonSync(file, data, options) {
  const serializedJson = stringify(data, { space: options.spaces || 2 });
  fs.writeFileSync(file, serializedJson);
};
