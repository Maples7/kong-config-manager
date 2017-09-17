#!/usr/bin/env node

'use strict';

const fs = require('fs');
const chalk = require('chalk');
const program = require('commander');
const fse = require('fs-extra');
const shell = require('shelljs');
const pkg = require('../package.json');
const logger = require('../utils/logger');
const makeDir = require('../utils/make_dir');
const writeJsonSync = require('../utils/write_json_sync');

if (!shell.which('git')) {
  logger.error('Sorry, this command requires git');
}

program
  .version(pkg.version)
  .option(
    '-d, --dir [name]',
    'directory name, default to kong-config',
    'kong-config'
  )
  .parse(process.argv);

logger.info(`Ready to make dir ${program.dir}...`);
if (fs.existsSync(program.dir)) {
  logger.error(`${program.dir} exists, use another dir name`);
} else {
  makeDir(program.dir);
  shell.cd(program.dir);
  logger.info(`dir ${program.dir} has been created`);
}

if (shell.exec('git init').code !== 0) {
  logger.error(`fail to git init`);
}

try {
  writeJsonSync(
    'kcm-config.json',
    {
      main: {
        host: 'http://localhost:8001'
      }
    },
    {
      spaces: 2
    }
  );
} catch (e) {
  logger.error(`fail to create demo config file: ${e}`);
}

logger.info(`Success to make initial repo ${program.dir}!`);
