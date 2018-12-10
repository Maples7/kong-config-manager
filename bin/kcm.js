#!/usr/bin/env node

'use strict';

const program = require('commander');
const pkg = require('../package.json');

program
  .version(pkg.version)
  .description(pkg.description)
  .command('init', 'init a git repo (optional) and create a demo config file')
  .alias('i')
  .command(
    'apply',
    'update Kong configs to live Kong instances, including CUD(Create, Update, Delete) operations'
  )
  .alias('a')
  .command(
    'dump',
    'dump live Kong configs to your git repo, referring to R(Retrieve) operation'
  )
  .alias('d')
  .parse(process.argv);
