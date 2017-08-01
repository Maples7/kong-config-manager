#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const Promise = require('bluebird');
const chalk = require('chalk');
const debug = require('debug')('kcm:dump');
const _ = require('lodash');
const exit = require('../utils/exit');
const dump = require('../lib/dump');
const getConfigPath = require('../utils/get_config_path');
const makeProgram = require('../utils/make_program');

const program = makeProgram();

try {
  fs.accessSync(process.cwd(), fs.constants.W_OK);
} catch (e) {
  exit(
    `the program does not have write permission in current working directory: ${e}`
  );
}

let retPromise = null;

if (program.host) {
  retPromise = dump(program.host, 'kcm-cli');
} else if (program.file) {
  const configPath = getConfigPath(program.file);
  const configs = require(path.resolve(process.cwd(), program.file));
  if (!_.isPlainObject(configs)) {
    exit('CLI configs in file should be a plain object');
  }

  if (program.all) {
    retPromise = Promise.map(Object.keys(configs), key =>
      dump(configs[key], key).tap(() =>
        console.log(chalk.green(`kong insatnce ${key} finished!`))
      )
    );
  } else if (program.instance) {
    if (!configs[program.instance]) {
      exit(
        `instance ${program.instance} not found in CLI config file ${program.file}`
      );
    } else {
      retPromise = dump(configs[program.instance], program.instance);
    }
  } else {
    exit('program error');
  }
} else {
  exit('program error');
}

retPromise
  .catch(err => exit(`Error: ${err}`))
  .finally(() => console.log(chalk.green('All Finished!')));
