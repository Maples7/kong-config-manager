#!/usr/bin/env node

const fs = require('fs');
const Promise = require('bluebird');
const chalk = require('chalk');
const exit = require('../utils/exit');
const dump = require('../lib/dump');
const getConfigs = require('../utils/get_configs');
const makeProgram = require('../utils/make_program');

const program = makeProgram();

let retPromise = null;

if (program.host) {
  retPromise = dump(program.host, program.instance);
} else if (program.file) {
  const configs = getConfigs(program.file);

  if (program.all) {
    retPromise = Promise.map(Object.keys(configs), key =>
      dump(configs[key], key).tap(() =>
        console.log(chalk.green(`kong insatnce ${key} finished!`))
      )
    );
  } else {
    if (!configs[program.instance]) {
      exit(
        `instance ${program.instance} not found in CLI config file ${program.file}`
      );
    }
    retPromise = dump(configs[program.instance], program.instance);
  }
}

retPromise
  .catch(err => exit(`Error: ${err}`))
  .finally(() => console.log(chalk.green('All Finished!')));
