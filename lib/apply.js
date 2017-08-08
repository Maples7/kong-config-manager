'use strict';

const fs = require('fs');
const path = require('path');
const Promise = require('bluebird');
const debug = require('debug')('kcm:apply');
const filenameConverter = require('filename-converter');
const fse = require('fs-extra');
const _ = require('lodash');
const rp = require('request-promise');
const ENUMS = require('../enums');

const TARGET_REGEX = /^upstreams_.*_targets$/;

module.exports = function apply(dir, host) {
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

    const rpUrl =
      host + '/' + _.replace(filenameConverter.deserialize(obj), /_/g, '/');
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
        const itemIds = items.map(v =>
          filenameConverter.deserialize(_.initial(v.split('.')).join('.'))
        );

        // make 3 sets
        const itemsToDelete = _.without.apply(
          null,
          _.concat([remoteIds], itemIds)
        );
        const newItemIds = _.without.apply(
          null,
          _.concat([itemIds], remoteIds)
        );
        const patchItemIds = _.intersection(itemIds, remoteIds);

        // for target object only
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
                        uri: `${host}/plugins/${itemToDeleteId}`,
                        timeout: ENUMS.REQUEST_TIMEOUT
                      }).then(body => {
                        const res = JSON.parse(body);
                        return res.api_id
                          ? `${host}/apis/${res.api_id}/plugins/${itemToDeleteId}`
                          : `${host}/plugins/${itemToDeleteId}`;
                      })
                    : isTarget
                      ? `${host}/upstreams/${upstreamId}/targets/${itemToDeleteId}`
                      : `${rpUrl}/${itemToDeleteId}`
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
                      `Fail to delete ${obj} ${itemToDeleteId}: ${JSON.stringify(
                        response
                      )}`
                    );
                  } else {
                    debug(`[${obj}] Success to DELETE item ${itemToDeleteId}!`);
                  }
                })
              )
          ),
          // Post
          Promise.resolve().then(
            () =>
              obj === 'cluster'
                ? true
                : Promise.map(newItemIds, newItemId => {
                    const newItemPath = path.resolve(
                      dir,
                      obj,
                      `${newItemId}.json`
                    );
                    const newItemObj = require(newItemPath);
                    const newItemUrl =
                      obj === 'plugins'
                        ? newItemObj.api_id
                          ? `${host}/apis/${newItemObj.api_id}/plugins/`
                          : `${host}/plugins`
                        : isTarget
                          ? `${host}/upstreams/${upstreamId}/targets`
                          : `${host}/${obj}/`;
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
                          `Fail to add new ${obj} ${newItemId}: ${JSON.stringify(
                            response
                          )}`
                        );
                      } else {
                        fse.removeSync(newItemPath);
                        debug(`[${obj}] Success to POST item ${newItemId}!`);
                      }
                    });
                  })
          ),
          // Patch
          Promise.resolve().then(
            () =>
              isTarget || obj === 'cluster'
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
                            ? `${host}/apis/${localPatchItemObj.api_id}/plugins/${patchItemId}`
                            : `${host}/plugins/${patchItemId}`
                          : `${host}/${obj}/${patchItemId}`;
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
                            `Fail to patch ${obj} ${patchItemId}: ${JSON.stringify(
                              response
                            )}`
                          );
                        } else {
                          debug(
                            `[${obj}] Success to PATCH item ${patchItemId}!`
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
