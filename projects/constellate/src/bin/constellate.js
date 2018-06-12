#!/usr/bin/env node

// @flow
/* eslint-disable no-console */

const yargs = require('yargs')
const buildCommand = require('../commands/build')
const cleanCommand = require('../commands/clean')
const developCommand = require('../commands/develop')
const deployCommand = require('../commands/deploy')
const preventScriptExit = require('../utils/prevent-script-exit')

const onComplete = (err, output) => {
  if (err) {
    console.error(err)
    process.exit(1)
  }
  console.log(output)
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
  .parse(process.argv, (err, argv, output) => {
    console.log(argv)
    console.log(typeof argv.promisedResult)
    if (argv.promisedResult) {
      argv.promisedResult.then(
        result => onComplete(null, result),
        error => onComplete(error),
      )
    } else {
      onComplete(err, output)
    }
  })

preventScriptExit()
