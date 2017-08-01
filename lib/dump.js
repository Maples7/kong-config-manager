const Promise = require('bluebird');
const chalk = require('chalk');
const debug = require('debug')('kcm:dump');
const fse = require('fs-extra');
const _ = require('lodash');
const rp = require('request-promise');
const exit = require('../utils/exit');
const makeDir = require('../utils/make_dir');

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
      const id = obj.id || obj.name;
      if (id) {
        try {
          fse.writeJsonSync(`./${currentDir}/${id}.json`, obj, {
            spaces: 2
          });
        } catch (e) {
          exit(`fail to save json for ${id}.json in ${currentDir}: ${e}`);
        }
        if (isUpstream) {
          const targetDir = `${currentDir}_${id}_targets`;
          makeDir(targetDir);
          return dumpObjects(`${url}${id}/targets/`, targetDir, [], false);
        }
      }
    });
  });
}

module.exports = function dump(host, name) {
  if (!_.isString(host)) {
    exit('host mast be a string, for example: https://localhost:8444');
  }

  console.log(chalk.green(`Ready to dump ${name} kong instance configs...`));
  makeDir(name);

  // handle dump
  return Promise.map(
    ['apis', 'consumers', 'plugins', 'certificates', 'snis', 'upstreams'],
    v => {
      const currentDir = `${name}/${v}`;
      makeDir(currentDir);
      return dumpObjects(`${host}/${v}/`, currentDir, [], v === 'upstreams');
    }
  );
};
