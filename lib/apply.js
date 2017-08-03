const fs = require('fs');
const path = require('path');
const Promise = require('bluebird');
const debug = require('debug')('kcm:apply');
const fse = require('fs-extra');
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

    const rpUrl = url + '/' + _.replace(obj, /_/g, '/');
    debug(`${obj}: the base request url to GET info is ${rpUrl}`);
    return rp(rpUrl)
      .then(body => {
        const res = JSON.parse(body);
        return res.data || [];
      })
      .tap(remoteObjs => {
        // initial variables
        const remoteIds = _.map(remoteObjs, idField).filter(v => !!v);
        const items = fs.readdirSync(path.resolve(dir, obj));
        const itemIds = items.map(v => v.split('.')[0]);

        // make 3 sets
        const itemsToDelete = _.without(remoteIds, ...itemIds);
        const newItemIds = _.without(itemIds, ...remoteIds);
        const patchItemIds = _.intersection(itemIds, remoteIds);

        // for target
        let upstreamId = null;
        if (isTarget) upstreamId = obj.split('_')[1];

        return Promise.all([
          // Delete
          Promise.map(itemsToDelete, itemToDeleteId =>
            Promise.resolve()
              .then(
                () =>
                  obj === 'plugins'
                    ? rp({
                        method: 'GET',
                        uri: `${url}/plugins/${itemToDeleteId}`,
                        timeout: ENUMS.REQUEST_TIMEOUT
                      }).then(body => {
                        const res = JSON.parse(body);
                        return (itemToDeleteUrl = res.api_id
                          ? `${url}/apis/${res.api_id}/plugins/${itemToDeleteId}`
                          : `${url}/plugins/${itemToDeleteId}`);
                      })
                    : isTarget
                      ? `${url}/upstreams/${upstreamId}/targets/${itemToDeleteId}`
                      : `${url}/${obj}/${itemToDeleteId}`
              )
              .then(itemToDeleteUrl =>
                rp({
                  method: 'DELETE',
                  uri: itemToDeleteUrl,
                  timeout: ENUMS.REQUEST_TIMEOUT,
                  resolveWithFullResponse: true
                }).then(response => {
                  if (response.statusCode !== 204) {
                    throw new Error(
                      `Fail to delete plguin ${itemToDeleteId}: ${response}`
                    );
                  }
                })
              )
          ),
          // POST
          Promise.map(newItemIds, newItemId => {
            const newItemPath = path.resolve(dir, obj, `${newItemId}.json`);
            const newItemObj = require(newItemPath);
            const newItemUrl =
              obj === 'plugins'
                ? newItemObj.api_id
                  ? `${url}/apis/${newItemObj.api_id}/plugins/`
                  : `${url}/plugins`
                : isTarget
                  ? `${url}/upstreams/${upstreamId}/targets`
                  : `${url}/${obj}/`;
            return rp({
              method: 'POST',
              uri: newItemUrl,
              body: newItemObj,
              json: true,
              timeout: ENUMS.REQUEST_TIMEOUT,
              resolveWithFullResponse: true
            }).then(response => {
              if (response.statusCode !== 201) {
                throw new Error(
                  `Fail to add new target ${newItemId}: ${response}`
                );
              } else {
                fse.removeSync(newItemPath);
              }
            });
          }),
          // Patch
          Promise.resolve().then(
            () =>
              isTarget
                ? true
                : Promise.map(patchItemIds, patchItemId => {
                    const localPatchItemPath = path.resolve(
                      dir,
                      obj,
                      `${patchItemId}.json`
                    );
                    const localPatchItemObj = require(localPatchItemPath);
                    const remotePatchItemObj = _.find(
                      remoteObjs,
                      o => o[idField] === patchItemId
                    );
                    if (!_.isEqual(localPatchItemObj, remotePatchItemObj)) {
                      const patchItemUrl =
                        obj === 'plugins'
                          ? localPatchItemObj.api_id
                            ? `${url}/apis/${localPatchItemObj.api_id}/plugins/${patchItemId}`
                            : `${url}/plugins/${patchItemId}`
                          : `${url}/${obj}/${patchItemId}`;
                      return rp({
                        method: 'PATCH',
                        uri: patchItemUrl,
                        body: localPatchItemObj,
                        json: true,
                        timeout: ENUMS.REQUEST_TIMEOUT,
                        resolveWithFullResponse: true
                      }).then(response => {
                        if (response.statusCode !== 200) {
                          throw new Error(
                            `Fail to patch plugin ${patchItemId}: ${response}`
                          );
                        }
                      });
                    }
                  })
          )
        ]);
      });
  });
};
