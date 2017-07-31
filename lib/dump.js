const debug = require('debug')('kcm:dump');
const fse = require('fs-extra');
const _ = require('lodash');
const request = require('request');
const exit = require('../utils/exit');
const makeDir = require('../utils/make_dir');

function dumpObjects(url, currentDir, objects, isUpstream) {
  request.get(url, (err, response, body) => {
    const res = JSON.parse(body);
    if (_.isArray(body.data)) {
      objects = _.concat(objects, body.data);
    }
    if (body.next) {
      getApis(body.next, currentDir, objects, isUpstream);
    }
    _.forEach(objects, obj => {
      const id = obj.id || obj.name;
      if (id) {
        try {
          fse.writeJsonSync(`./${currentDir}/${id}.json`, obj);
          if (isUpstream) {
            const targetDir = `${currentDir}_${id}_${targets}`;
            makeDir(targetDir);
            dumpObjects(`${url}${id}/targets/`, targetDir, [], false);
          }
        } catch (e) {
          exit(`fail to save object ${id} in ${currentDir}: ${e}`);
        }
      }
    });
  });
}

module.exports = function dump(host, name) {
  if (!_.isString(host)) {
    exit('host mast be a string, for example: https://localhost:8444');
  }

  debug(`Ready to dump ${name} kong instance configs...`);

  makeDir(name);

  // handle dump
  [
    'apis',
    'consumers',
    'plugins',
    'certificates',
    'snis',
    'upstreams'
  ].forEach(v => {
    const currentDir = `${name}/${v}`;
    makeDir(currentDir);
    dumpObjects(`${host}/${v}/`, currentDir, [], v === 'upstreams');
  });

  debug('Finished! (expcept some async requests)');
};
