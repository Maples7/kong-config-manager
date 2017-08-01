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
  function dumpObjects(url, currentDir, objects, isUpstream) {
    return rp(url).then(body => {
      const res = JSON.parse(body);
      if (_.isArray(res.data)) {
        objects = _.concat(objects, res.data);
      }
      if (res.next) {
        return dumpObjects(res.next, currentDir, objects, isUpstream);
      }
      return Promise.map(objects, obj => {
        const id = obj[ENUMS.IDENTIFIRES[name]];
        if (id) {
          try {
            fse.writeJsonSync(`./${currentDir}/${id}.json`, obj, {
              spaces: 2
            });
          } catch (e) {
            exit(`fail to save json for ${id}.json in ${currentDir}: ${e}`);
          }
          debug(`Success to save JSON ./${currentDir}/${id}.json!`);
          if (isUpstream) {
            const targetDir = `${currentDir}_${id}_targets`;
            makeDir(targetDir);
            debug(`Ready to dump targets of upstream ${id}`);
            return dumpObjects(`${url}${id}/targets/`, targetDir, [], false);
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
  return Promise.map(ENUMS.OBJECTS, v => {
    const currentDir = `${name}/${v}`;
    makeDir(currentDir);
    debug(`Ready to dump ${v} object of ${name}...`);
    return dumpObjects(`${host}/${v}/`, currentDir, [], v === 'upstreams');
  });
};
