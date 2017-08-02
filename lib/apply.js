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
      .tap(remoteObjs => {
        const remoteIds = _.map(remoteObjs, idField).filter(v => !!v);
        const items = fs.readdirSync(path.resolve(dir, obj));
        const itemIds = items.map(v => v.split('.')[0]);

        const itemsToDelete = _.without(remoteIds, ...itemIds);
        const newItemIds = _.without(itemIds, ...remoteIds);
        const patchItemIds = _.intersection(itemIds, remoteIds);

        if (obj === 'plugins') {
          // firstly get all apiIds
          return rp({
            method: 'GET',
            uri: `${url}/apis/`,
            timeout: ENUMS.REQUEST_TIMEOUT
          })
            .then(body => {
              const res = JSON.parse(body);
              return _.isArray(res.data) ? _.map(res.data, idField) : [];
            })
            .tap(apiIds =>
              // then delete plugins
              Promise.map(itemsToDelete, itemId =>
                rp({
                  method: 'GET',
                  uri: `${url}/plugins/${itemId}`,
                  timeout: ENUMS.REQUEST_TIMEOUT
                }).then(body => {
                  const res = JSON.parse(body);
                  return res.api_id
                    ? rp({
                        method: 'DELETE',
                        uri: `${url}/apis/${res.api_id}/plugins/${itemId}`,
                        timeout: ENUMS.REQUEST_TIMEOUT,
                        resolveWithFullResponse: true
                      }).then(response => {
                        if (response.statusCode !== 204) {
                          throw new Error(
                            `Fail to delete plguin ${itemId}: ${response}`
                          );
                        }
                      })
                    : Promise.map(apiIds, apiId =>
                        rp({
                          method: 'DELETE',
                          uri: `${url}/apis/${apiId}/plugins/${itemId}`,
                          timeout: ENUMS.REQUEST_TIMEOUT,
                          resolveWithFullResponse: true
                        }).then(response => {
                          if (response.statusCode !== 204) {
                            throw new Error(
                              `Fail to delete plguin ${itemId}: ${response}`
                            );
                          }
                        })
                      );
                })
              )
            )
            .tap(apiIds =>
              // then add new plugins
              Promise.map(newItemIds, newItemId => {
                const newItemPath = path.resolve(dir, obj, `${newItemId}.json`);
                const newItemObj = require(newItemPath);
                const postUri = newItemObj.api_id
                  ? `${url}/apis/${newItemObj.api_id}/plugins/`
                  : `${url}/plugins`;
                return rp({
                  method: 'POST',
                  uri: postUri,
                  body: {
                    name: newItemObj.name,
                    consumer_id: newItemObj.consumer_id,
                    config: newItemObj.config
                  },
                  json: true,
                  timeout: ENUMS.REQUEST_TIMEOUT,
                  resolveWithFullResponse: true
                }).then(response => {
                  if (response.statusCode !== 201) {
                    throw new Error(
                      `Fail to create new plugin ${newItemObj.name}: ${response}`
                    );
                  }
                });
              })
            )
            .tap(apiIds =>
              // then patch modified plugins
              Promise.map(patchItemIds, patchItemId => {
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
                  return localPatchItemObj.api_id
                    ? rp({
                        method: 'PATCH',
                        uri: `${url}/apis/${localPatchItemObj.api_id}/plugins/${patchItemId}`,
                        body: {
                          name: localPatchItemObj.name,
                          consumer_id: localPatchItemObj.consumer_id,
                          config: localPatchItemObj.config
                        },
                        json: true,
                        timeout: ENUMS.REQUEST_TIMEOUT,
                        resolveWithFullResponse: true
                      }).then(response => {
                        if (response.statusCode !== 200) {
                          throw new Error(
                            `Fail to patch plugin ${patchItemId}: ${response}`
                          );
                        }
                      })
                    : Promise.map(apiIds, apiId =>
                        rp({
                          method: 'PATCH',
                          uri: `${url}/apis/${apiId}/plugins/${patchItemId}`,
                          body: {
                            name: localPatchItemObj.name,
                            consumer_id: localPatchItemObj.consumer_id,
                            config: localPatchItemObj.config
                          },
                          json: true,
                          timeout: ENUMS.REQUEST_TIMEOUT,
                          resolveWithFullResponse: true
                        }).then(response => {
                          if (response.statusCode !== 200) {
                            throw new Error(
                              `Fail to patch plugin ${patchItemId}: ${response}`
                            );
                          }
                        })
                      );
                }
              })
            );
        } else if (isTarget) {
          const upstreamId = obj.split('_')[1];
          // delete targets
          return Promise.map(itemsToDelete, itemId =>
            rp({
              method: 'DELETE',
              uri: `${url}/upstreams/${upstreamId}/targets/${itemId}`,
              timeout: ENUMS.REQUEST_TIMEOUT,
              resolveWithFullResponse: true
            }).then(response => {
              if (response.statusCode !== 204) {
                throw new Error(`Fail to delete target ${itemId}: ${response}`);
              }
            })
          ).tap(() =>
            // then add new targets
            Promise.map(newItemIds, newItemId => {
              const newItemPath = path.resolve(dir, obj, `${newItemId}.json`);
              const newItemObj = require(newItemPath);
              return rp({
                method: 'POST',
                uri: `${url}/upstreams/${upstreamId}/targets`,
                body: {
                  target: newItemObj.target,
                  weight: newItemObj.weight
                },
                json: true,
                timeout: ENUMS.REQUEST_TIMEOUT,
                resolveWithFullResponse: true
              }).then(response => {
                if (response.statusCode !== 201) {
                  throw new Error(
                    `Fail to add new target ${newItemId}: ${response}`
                  );
                }
              });
            })
          );
        } else {
          // delete normal items
          return Promise.map(itemsToDelete, itemId =>
            rp({
              method: 'DELETE',
              uri: `${url}/${obj}/${itemId}`,
              timeout: ENUMS.REQUEST_TIMEOUT,
              resolveWithFullResponse: true
            }).then(response => {
              if (response.statusCode !== 204) {
                throw new Error(`Fail to delete ${obj} ${itemId}: ${response}`);
              }
            })
          )
            .tap(() =>
              // then add normal items
              Promise.map(newItemIds, newItemId => {
                const newItemPath = path.resolve(dir, obj, `${newItemId}.json`);
                const newItemObj = require(newItemPath);
                return rp({
                  method: 'POST',
                  uri: `${url}/${obj}/`,
                  body: newItemObj,
                  json: true,
                  timeout: ENUMS.REQUEST_TIMEOUT,
                  resolveWithFullResponse: true
                }).then(response => {
                  if (response.statusCode !== 201) {
                    throw new Error(
                      `Fail to add new target ${newItemId}: ${response}`
                    );
                  }
                });
              })
            )
            .tap(() =>
              // then patch modified normal items
              Promise.map(patchItemIds, patchItemId => {
                const localPatchItemPath = path.resolve(
                  dir,
                  obj,
                  `${patchItemId}.json`
                );
                const localPatchItemObj = _.find(
                  remoteObjs,
                  o => o[idField] === patchItemId
                );
                if (!_.isEqual(localPatchItemObj, remotePatchItemObj)) {
                  return rp({
                    method: 'PATCH',
                    uri: `${url}/${obj}/${patchItemId}`,
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
            );
        }
      });
  });
};
