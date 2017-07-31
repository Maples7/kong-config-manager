#!/usr/bin/env node

const program = require('commander');
const pkg = require('../package.json');

program
  .version(pkg.version)
  .description(pkg.description)
  .command('apply', 'apply kong configs to a live kong instance').alias('a')
  .command('dump', 'dump live kong configs to your git repo').alias('d')
  .parse(process.argv);
