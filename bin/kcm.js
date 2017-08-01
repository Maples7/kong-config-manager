#!/usr/bin/env node

const program = require('commander');
const pkg = require('../package.json');

program
  .version(pkg.version)
  .description(pkg.description)
  .command('apply', 'update kong configs to live kong instances, including CUD operations').alias('a')
  .command('dump', 'dump live kong configs to your git repo, referring to R operation').alias('d')
  .parse(process.argv);
