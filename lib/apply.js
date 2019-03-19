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
const getObjects = require('../tools/get_objects');
const handleWrongStatusCode = require('../tools/non2xx_handler');
const logger = require('../utils/logger');

const TARGET_REGEX = /^upstreams_.*_targets$/;
const SON_OBJECTS = ['routes'];

module.exports = function apply(dir, host) {
  function core(obj) {
    debug(`Ready to apply object ${obj}...`);

    const isTarget = TARGET_REGEX.test(obj);
    const idField = isTarget
      ? ENUMS.IDENTIFIRES.targets
      : ENUMS.IDENTIFIRES[obj] || 'id';

    const rpUrl =
      host + '/' + _.replace(filenameConverter.deserialize(obj), /_/g, '/');
    debug(`${obj}: the base insecure request url to GET info is ${rpUrl}`);
      return rp({
        method: 'GET',
        uri: rpUrl,
        insecure: true, rejectUnauthorized: false,
        timeout: ENUMS.REQUEST_TIMEOUT
      })
      .then(body => {
        const res = JSON.parse(body);
        return res.data || [];
      })
      .catch(err => handleWrongStatusCode(err, rpUrl))
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
              .then(() =>
                obj === 'plugins'
                  ? rp({
                      method: 'GET',
                      uri: `${host}/plugins/${itemToDeleteId}`,
                      insecure: true, rejectUnauthorized: false,
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
                  insecure: true, rejectUnauthorized: false,
                  timeout: ENUMS.REQUEST_TIMEOUT
                })
                  .then(() => {
                    debug(`[${obj}] Success to DELETE item ${itemToDeleteId}!`);
                  })
                  .catch(err =>
                    handleWrongStatusCode(err, itemToDeleteUrl, 'DELETE')
                  )
              )
          ),
          // Post
          Promise.map(newItemIds, newItemId => {
            const newItemPath = path.resolve(dir, obj, `${newItemId}.json`);
            const newItemObj = require(newItemPath);
            const newItemUrl =
              obj === 'plugins'
                ? newItemObj.api_id
                  ? `${host}/apis/${newItemObj.api_id}/plugins/`
                  : `${host}/plugins`
                : isTarget
                ? `${host}/upstreams/${upstreamId}/targets`
                : `${host}/${obj}/`;
            if (isTarget) {
              delete newItemObj.upstream_id;
            }
            return rp({
              method: 'POST',
              uri: newItemUrl,
              body: newItemObj,
              json: true,
              insecure: true, rejectUnauthorized: false,
              timeout: ENUMS.REQUEST_TIMEOUT
            })
              .then(() => {
                debug(`[${obj}] Success to POST item ${newItemId}!`);
              })
              .catch(err => handleWrongStatusCode(err, newItemUrl, 'POST'));
          }),
          // Patch
          Promise.resolve().then(() =>
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
                          ? `${host}/apis/${
                              localPatchItemObj.api_id
                            }/plugins/${patchItemId}`
                          : `${host}/plugins/${patchItemId}`
                        : `${host}/${obj}/${patchItemId}`;
                    return rp({
                      method: 'PATCH',
                      uri: patchItemUrl,
                      body: localPatchItemObj,
                      json: true,
                      insecure: true, rejectUnauthorized: false,
                      timeout: ENUMS.REQUEST_TIMEOUT
                    })
                      .then(() => {
                        debug(`[${obj}] Success to PATCH item ${patchItemId}!`);
                      })
                      .catch(err =>
                        handleWrongStatusCode(err, patchItemUrl, 'PATCH')
                      );
                  }
                })
          )
        ]);
      });
  }

  return getObjects(host).then(OBJECTS => {
    const objs = fs.readdirSync(dir);
    debug(`configs of these objects are found: ${objs}`);

    const firstClassObjs = objs.filter(
      obj => _.includes(OBJECTS, obj) && !_.includes(SON_OBJECTS, obj)
    );
    const secondClassObjs = objs.filter(
      obj =>
        (_.includes(OBJECTS, obj) && _.includes(SON_OBJECTS, obj)) ||
        TARGET_REGEX.test(obj)
    );

    return Promise.map(firstClassObjs, core).then(() =>
      Promise.map(secondClassObjs, core)
    );
  });
};
