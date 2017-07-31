#!/usr/bin/env node

const debug = require('debug')('kcm:apply');
const makeProgram = require('../utils/make_program');

const program = makeProgram();
const params = parseParams(program);
