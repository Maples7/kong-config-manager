#!/usr/bin/env node

'use strict';

const fs = require('fs');
const chalk = require('chalk');
const program = require('commander');
const fse = require('fs-extra');
const shell = require('shelljs');
const pkg = require('../package.json');
const exit = require('../utils/exit');
const makeDir = require('../utils/make_dir');
const writeJsonSync = require('../utils/write_json_sync');

if (!shell.which('git')) {
  exit('Sorry, this command requires git');
}

program
  .version(pkg.version)
  .option(
    '-d, --dir [name]',
    'directory name, default to kong-config',
    'kong-config'
  )
  .parse(process.argv);

console.log(chalk.green(`Ready to make dir ${program.dir}...`));
if (fs.existsSync(program.dir)) {
  exit(`${program.dir} exists, use another dir name`);
} else {
  makeDir(program.dir);
  shell.cd(program.dir);
  console.log(chalk.green(`dir ${program.dir} has been created`));
}

if (shell.exec('git init').code !== 0) {
  exit(`fail to git init`);
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
  exit(`fail to create demo config file: ${e}`);
}

console.log(chalk.green(`Success to make initial repo ${program.dir}!`));
