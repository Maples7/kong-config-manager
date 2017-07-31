#!/usr/bin/env node

const fs = require('fs');
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

if (program.host) {
  dump(program.host, 'kcm-cli');
} else if (program.file) {
  const configPath = getConfigPath(program.file);
  const configs = require(program.file);
  if (!_.isPlainObject(configs)) {
    exit('CLI configs in file should be a plain object');
  }

  if (program.all) {
    _.forOwn(configs, (value, key) => {
      dump(value, key);
    });
  } else if (program.instance) {
    if (!configs[program.instance]) {
      exit(
        `instance ${program.instance} not found in CLI config file ${program.file}`
      );
    } else {
      dump(configs[program.instance], program.instance);
    }
  } else {
    exit('program error');
  }
} else {
  exit('program error');
}
