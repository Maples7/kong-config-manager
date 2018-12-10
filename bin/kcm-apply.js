#!/usr/bin/env node

'use strict';

process.env.UV_THREADPOOL_SIZE = 128;

const fs = require('fs');
const Promise = require('bluebird');
const chalk = require('chalk');
const filenameConverter = require('filename-converter');
const _ = require('lodash');
const readlineSync = require('readline-sync');
const shell = require('shelljs');
const apply = require('../lib/apply');
const dump = require('../lib/dump');
const getAbsolutePath = require('../utils/get_absolute_path');
const getConfigs = require('../utils/get_configs');
const logger = require('../utils/logger');
const makeProgram = require('../utils/make_program');
const validateConfig = require('../utils/validate_config');

Promise.config({
  longStackTraces: true
});

const program = makeProgram(true);

function initApply(instance, config) {
  config = validateConfig(config, instance);

  const instancePath = getAbsolutePath(filenameConverter.serialize(instance));
  const host = _.trimEnd(config.host, '/');
  if (fs.existsSync(instancePath)) {
    logger.info(`Ready to apply configs for ${instance}...`);
    return apply(instancePath, host).then(() => {
      logger.info(`Success to apply configs for ${instance}!`);
      return dump(config, instance);
    });
  } else {
    logger.error(`dir ./${instance} does NOT exist for instance ${instance}`);
  }
}

if (program.git) {
  if (!shell.which('git')) {
    logger.error('Sorry, this command requires git');
  }

  shell.exec('git diff --color');
  console.log();
  if (!program.yes) {
    if (!readlineSync.keyInYN(chalk.yellow('Confirm change?'))) {
      console.log();
      logger.info('Okay, see you! :D');
      process.exit(0);
    }
  }
}

let retPromise = null;
if (program.host) {
  retPromise = initApply(program.instance, program.host);
} else if (program.file) {
  const configs = getConfigs(program.file);

  if (program.all) {
    retPromise = Promise.map(Object.keys(configs), key =>
      initApply(key, configs[key])
    );
  } else {
    if (!configs[program.instance]) {
      logger.error(
        `instance ${program.instance} not found in CLI config file ${
          program.file
        }`
      );
    }
    retPromise = initApply(program.instance, configs[program.instance]);
  }
}

retPromise
  .catch(err => logger.error(`Error: ${err.stack}`))
  .finally(() => logger.info('All Finished!'));
