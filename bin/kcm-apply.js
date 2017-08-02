#!/usr/bin/env node

const fs = require('fs');
const Promise = require('bluebird');
const chalk = require('chalk');
const apply = require('../lib/apply');
const dump = require('../lib/dump');
const exit = require('../utils/exit');
const getAbsolutePath = require('../utils/get_absolute_path');
const getConfigs = require('../utils/get_configs');
const makeProgram = require('../utils/make_program');

const program = makeProgram();

let retPromise = null;

function initApply(instance, url) {
  const instancePath = getAbsolutePath(instance);
  if (!_.isString(url)) {
    exit('host mast be a string, for example: https://localhost:8444');
  }
  url = _.trimEnd(url, '/');
  if (fs.existsSync(instancePath)) {
    return apply(instancePath, url).then(() => dump(url, instance));
  } else {
    exit(`dir ./${instance} does NOT exist for instance ${instance}`);
  }
}

if (program.host && program.instance) {
  retPromise = initApply(program.instance, program.host);
} else if (program.file) {
  const configs = getConfigs(program.file);

  if (program.all) {
    retPromise = Promise.map(Object.keys(configs), key =>
      initApply(key, configs[key])
    );
  } else if (program.instance) {
    if (!configs[program.instance]) {
      exit(
        `instance ${program.instance} not found in CLI config file ${program.file}`
      );
    }
    retPromise = initApply(program.instance, configs[program.instance]);
  } else {
    exit('params error');
  }
} else {
  exit('params error');
}

retPromise
  .catch(err => exit(`Error: ${err}`))
  .finally(() => console.log(chalk.green('All Finished!')));
