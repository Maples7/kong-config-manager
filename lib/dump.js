'use strict';

const Promise = require('bluebird');
const chalk = require('chalk');
const debug = require('debug')('kcm:dump');
const filenameConverter = require('filename-converter');
const _ = require('lodash');
const rp = require('request-promise');
const ENUMS = require('../enums/');
const exit = require('../utils/exit');
const makeDir = require('../utils/make_dir');
const validateConfig = require('../utils/validate_config');
const writeJsonSync = require('../utils/write_json_sync');

module.exports = function dump(config, name) {
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
            writeJsonSync(
              `./${currentDir}/${filenameConverter.serialize(id)}.json`,
              item,
              {
                spaces: 2
              }
            );
          } catch (e) {
            exit(`fail to save json for ${id}.json in ${currentDir}: ${e}`);
          }
          debug(`Success to save JSON ./${currentDir}/${id}.json`);
          if (obj === 'upstreams') {
            const targetDir = `${currentDir}_${filenameConverter.serialize(
              id
            )}_targets`;
            makeDir(targetDir);
            debug(`Ready to dump targets of upstream ${id}`);
            return dumpItems(`${url}${id}/targets/`, targetDir, [], 'targets');
          }
        }
      });
    });
  }

  config = validateConfig(config, name);
  const host = _.trimEnd(config.host, '/');
  let objects = ENUMS.OBJECTS;
  if (config.objects) {
    if (!_.isArray(config.objects)) {
      exit(`'objects' field of '${name}' must be an array of string`);
    } else {
      objects = config.objects;
      const wrongObjs = _.difference(objects, ENUMS.OBJECTS);
      if (wrongObjs.length > 0) {
        exit(`invalid or unsupported objects found: ${wrongObjs}`);
      }
    }
  }

  console.log(chalk.green(`Ready to dump configs of kong instance ${name}...`));
  makeDir(filenameConverter.serialize(name));

  // handle dump
  return Promise.map(objects, obj => {
    const currentDir = `${filenameConverter.serialize(name)}/${obj}`;
    makeDir(currentDir);
    debug(`Ready to dump ${obj} object of ${name}...`);
    return dumpItems(
      `${host}/${_.replace(obj, /_/g, '/')}/`,
      currentDir,
      [],
      obj
    );
  });
};
