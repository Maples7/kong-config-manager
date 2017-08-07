#!/usr/bin/env node

const program = require('commander');
const pkg = require('../package.json');

program
  .version(pkg.version)
  .description(pkg.description)
  .command('apply', 'update Kong configs to live Kong instances, including CUD(Create, Update, Delete) operations').alias('a')
  .command('dump', 'dump live Kong configs to your git repo, referring to R(Retrieve) operation').alias('d')
  .parse(process.argv);
