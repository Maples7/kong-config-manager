#!/usr/bin/env node

'use strict';

const fs = require('fs');
const program = require('commander');
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
  .option('--no-git', 'use this tool without the help of git')
  .parse(process.argv);

logger.info(`Ready to make dir ${program.dir}...`);
if (fs.existsSync(program.dir)) {
  logger.error(`${program.dir} exists, use another dir name`);
} else {
  makeDir(program.dir);
  shell.cd(program.dir);
  logger.info(`dir ${program.dir} has been created`);
}

if (program.git && shell.exec('git init').code !== 0) {
  logger.error(`fail to git init`);
}

try {
  writeJsonSync('kcm-config.json', {
    main: {
      host: 'http://localhost:8001'
    }
  });
} catch (e) {
  logger.error(`fail to create demo config file: ${e}`);
}

logger.info(`Success to make initial repo ${program.dir}!`);
