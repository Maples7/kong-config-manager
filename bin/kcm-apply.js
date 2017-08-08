#!/usr/bin/env node

'use strict';

process.env.UV_THREADPOOL_SIZE = 128;

const fs = require('fs');
const Promise = require('bluebird');
const chalk = require('chalk');
const filenameConverter = require('filename-converter');
const _ = require('lodash');
const apply = require('../lib/apply');
const dump = require('../lib/dump');
const exit = require('../utils/exit');
const getAbsolutePath = require('../utils/get_absolute_path');
const getConfigs = require('../utils/get_configs');
const makeProgram = require('../utils/make_program');

const program = makeProgram();

let retPromise = null;

function initApply(instance, host) {
  const instancePath = getAbsolutePath(filenameConverter.serialize(instance));
  host = _.trimEnd(host, '/');
  if (fs.existsSync(instancePath)) {
    console.log(chalk.green(`Ready to apply configs for ${instance}...`));
    return apply(instancePath, host).then(() => {
      console.log(chalk.green(`Success to apply configs for ${instance}!`));
      return dump(host, instance);
    });
  } else {
    exit(`dir ./${instance} does NOT exist for instance ${instance}`);
  }
}

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
      exit(
        `instance ${program.instance} not found in CLI config file ${program.file}`
      );
    }
    retPromise = initApply(program.instance, configs[program.instance]);
  }
}

retPromise
  .catch(err => exit(`Error: ${err}`))
  .finally(() => console.log(chalk.green('All Finished!')));
