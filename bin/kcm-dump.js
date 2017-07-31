#!/usr/bin/env node

const fs = require('fs');
const debug = require('debug')('kcm:dump');
const _ = require('lodash');
const exit = require('../utils/exit');
const makeProgram = require('../utils/make_program');
const parseParams = require('../utils/parse_params');

const program = makeProgram();
const params = parseParams(program);

try {
  fs.accessSync(process.cwd(), fs.constants.W_OK);
} catch (e) {
  exit(
    `the program does not have write permission in current working directory: ${e}`
  );
}

if (params.host) {
  dump(params.host, 'kcm-cli');
} else if (params.file) {
  const configs = require(params.file);
  if (!_.isPlainObject(configs)) {
    exit('CLI configs in file should be a plain object');
  }

  if (params.all) {
    _.forOwn(configs, (value, key) => {
      dump(value, key);
    });
  } else if (params.instance) {
    if (!configs[params.instance]) {
      exit(
        `instance ${params.instance} not found in CLI config file ${params.file}`
      );
    } else {
      dump(configs[params.instance], params.instance);
    }
  } else {
    exit('params error');
  }
} else {
  exit('params error');
}
