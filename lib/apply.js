const fs = require('fs');
const path = require('path');
const Promise = require('bluebird');
const debug = require('debug')('kcm:apply');
const _ = require('lodash');
const rp = require('request-promise');
const ENUMS = require('../enums');

const TARGET_REGEX = /^upstreams_.*_targets$/;

module.exports = function apply(dir, url) {
  const objs = fs
    .readdirSync(dir)
    .filter(obj => _.includes(ENUMS.OBJECTS, obj) || TARGET_REGEX.test(obj));
  debug(`configs of these objects are found: ${objs}`);

  return Promise.map(objs, obj => {
    debug(`Ready to apply object ${obj}...`);

    const isTarget = TARGET_REGEX.test(obj);
    const idField = isTarget
      ? ENUMS.IDENTIFIRES.targets
      : ENUMS.IDENTIFIRES[obj];

    const rpUrl = url + '/' + _.replace(obj, '_', '/');
    return rp(rpUrl)
      .then(body => {
        const res = JSON.parse(body);
        return res.data || [];
      })
      .then(remoteObjs => {
        const remoteIds = _.map(remoteObjs, idField).filter(v => !!v);
        const items = fs.readdirSync(path.resolve(dir, obj));
        const itemIds = items.map(v => v.split('.')[0]);
        const itemsToDelete = _.without(remoteIds, ...itemIds);

        return Promise.map(itemsToDelete, item => {
          if (obj === 'plugins') {
            // TODO: delete plugins
          } else if (isTarget) {
            // TODO: delete targets
          } else {
            // TODO: normal delete
          }
        }).then(() => {
          // TODO: C U operate, using PUT-method API
          return Promise.map(items, item => {
            const itemPath = path.resolve(dir, obj, item);
            const itemObj = require(itemPath);
            const itemId = itemObj[idField];

            // C
            if (!itemId || !_.includes(remoteIds, itemId)) {
            } else {
            }
          });
        });
      });
  });
};
