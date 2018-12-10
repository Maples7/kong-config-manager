#!/usr/bin/env node

'use strict';

const Promise = require('bluebird');
const dump = require('../lib/dump');
const getConfigs = require('../utils/get_configs');
const logger = require('../utils/logger');
const makeProgram = require('../utils/make_program');

Promise.config({
  longStackTraces: true
});

const program = makeProgram(false);

let retPromise = null;
if (program.host) {
  retPromise = dump(program.host, program.instance);
} else if (program.file) {
  const configs = getConfigs(program.file);

  if (program.all) {
    retPromise = Promise.map(Object.keys(configs), key =>
      dump(configs[key], key).tap(() =>
        logger.info(`kong insatnce ${key} finished!`)
      )
    );
  } else {
    if (!configs[program.instance]) {
      logger.error(
        `instance ${program.instance} not found in CLI config file ${
          program.file
        }`
      );
    }
    retPromise = dump(configs[program.instance], program.instance);
  }
}

retPromise
  .catch(err => logger.error(`Error: ${err.stack}`))
  .finally(() => logger.info('All Finished!'));
