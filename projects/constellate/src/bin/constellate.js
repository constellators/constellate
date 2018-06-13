#!/usr/bin/env node

// @flow
/* eslint-disable no-console */

const yargs = require('yargs')
const { TerminalUtils } = require('constellate-dev-utils')
const buildCommand = require('../commands/build')
const cleanCommand = require('../commands/clean')
const developCommand = require('../commands/develop')
const deployCommand = require('../commands/deploy')
const preventScriptExit = require('../utils/prevent-script-exit')

const onComplete = (err, output) => {
  if (err) {
    TerminalUtils.error(err)
    process.exit(1)
  }
  if (output) {
    TerminalUtils.info(output)
  }
  process.exit(0)
}

yargs
  .command(buildCommand)
  .command(cleanCommand)
  .command(developCommand)
  .command(deployCommand)
  .demandCommand()
  .help('h')
  .alias('h', 'help')
  .parse(process.argv.slice(2), (err, argv, output) => {
    TerminalUtils.verbose(argv)
    if (argv.promisedResult) {
      TerminalUtils.verbose('Waiting for async command to complete...')
      argv.promisedResult.then(
        result => onComplete(null, result),
        error => onComplete(error),
      )
    } else {
      onComplete(err, output)
    }
  })

preventScriptExit()
