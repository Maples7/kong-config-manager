'use strict';

const program = require('commander');
const debug = require('debug')('kcm:make_program');
const pkg = require('../package.json');

module.exports = function makeProgram(hasY) {
  debug('Start to make a commander instance...');
  let tmp = program
    .version(pkg.version)
    .option('-H, --host [value]', 'host of admin APIs of kong instance')
    .option(
      '-f, --file [path]',
      'path of config file for this CLI tool, default to `./kcm-config.json`',
      './kcm-config.json'
    )
    .option(
      '-i, --instance [name]',
      'when you have many kong instances to manage, specify a name, default to `main`. NOTE: this requires `--file` option rather than `--host`',
      'main'
    )
    .option(
      '-a, --all',
      'whether to operate on all kong instances listed in CLI config file. NOTE: this requires `--file` option rather than `--host`'
    );
  if (hasY) {
    tmp = tmp.option(
      '-y, --yes',
      'whether go on directly while asking for yes or no'
    );
  }
  debug('Finished!');
  return tmp.parse(process.argv);
};
