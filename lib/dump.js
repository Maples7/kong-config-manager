const Promise = require('bluebird');
const chalk = require('chalk');
const debug = require('debug')('kcm:dump');
const fse = require('fs-extra');
const _ = require('lodash');
const rp = require('request-promise');
const ENUMS = require('../enums/');
const exit = require('../utils/exit');
const makeDir = require('../utils/make_dir');

module.exports = function dump(host, name) {
  function dumpItems(url, currentDir, items, obj) {
    debug(`Url waits to be dumped is ${url}`);
    return rp({
      method: 'GET',
      uri: url,
      timeout: ENUMS.REQUEST_TIMEOUT
    }).then(body => {
      // debug(`for ${obj}, after request, we got: ${body}`);
      const res = JSON.parse(body);
      if (_.isArray(res.data)) {
        items = _.concat(items, res.data);
      }
      if (res.next) {
        return dumpItems(res.next, currentDir, items, obj);
      }
      return Promise.map(items, item => {
        const id = item[ENUMS.IDENTIFIRES[obj]];
        if (id) {
          try {
            fse.writeJsonSync(`./${currentDir}/${id}.json`, item, {
              spaces: 2
            });
          } catch (e) {
            exit(`fail to save json for ${id}.json in ${currentDir}: ${e}`);
          }
          debug(`Success to save JSON ./${currentDir}/${id}.json`);
          if (obj === 'upstreams') {
            const targetDir = `${currentDir}_${id}_targets`;
            makeDir(targetDir);
            debug(`Ready to dump targets of upstream ${id}`);
            return dumpItems(`${url}${id}/targets/`, targetDir, [], false);
          }
        }
      });
    });
  }

  if (!_.isString(host)) {
    exit('host mast be a string, for example: https://localhost:8444');
  }

  console.log(chalk.green(`Ready to dump configs of kong instance ${name}...`));
  host = _.trimEnd(host, '/');
  makeDir(name);

  // handle dump
  return Promise.map(ENUMS.OBJECTS, obj => {
    const currentDir = `${name}/${obj}`;
    makeDir(currentDir);
    debug(`Ready to dump ${obj} object of ${name}...`);
    return dumpItems(`${host}/${_.replace(obj, /_/g, '/')}/`, currentDir, [], obj);
  });
};
