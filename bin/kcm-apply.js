#!/usr/bin/env node

const debug = require('debug')('kcm:apply');
const makeProgram = require('../utils/make_program');
const parseParams = require('../utils/parse_params');

const program = makeProgram();
const params = parseParams(program);


