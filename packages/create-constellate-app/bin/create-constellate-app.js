#!/usr/bin/env node

const chalk = require('chalk')

const currentNodeVersion = process.versions.node
if (currentNodeVersion.split('.')[0] < 7) {
  console.error(
    chalk.red(
      `You are running Node ${currentNodeVersion}.\n` +
        'Constellate requires Node 7 or higher. \n' +
        'Please update your version of Node.'
    )
  )
  process.exit(1)
}
