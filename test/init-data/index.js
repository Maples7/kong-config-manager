const fs = require('fs');

const ret = {};

fs
  .readdirSync(__dirname)
  .filter(file => file.indexOf('.') !== 0 && file !== 'index.js')
  .forEach(file => {
    const item = file.split('.')[0];
    ret[item] = require(`./${item}`);
    ret[item] = ret[item].map(o => {
      o.type = item;
      return o;
    });
  });

module.exports = ret;
