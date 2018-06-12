#!/usr/bin/env node
// @flow

const yargs = require('yargs')
const buildCommand = require('../commands/build')
const cleanCommand = require('../commands/clean')
const developCommand = require('../commands/develop')
const deployCommand = require('../commands/deploy')

yargs
  .command(buildCommand)
  .command(cleanCommand)
  .command(developCommand)
  .command(deployCommand)
  .demandCommand()
  .help('h')
  .alias('h', 'help')
  .parse()
