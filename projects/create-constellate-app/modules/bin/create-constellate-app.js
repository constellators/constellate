#!/usr/bin/env node

/* eslint-disable no-console */

// Makes the script crash on unhandled rejections instead of silently
// ignoring them. In the future, promise rejections that are not handled will
// terminate the Node.js process with a non-zero exit code.
process.on('unhandledRejection', (err) => {
  throw err
})

const currentNodeVersion = process.versions.node
if (currentNodeVersion.split('.')[0] < 8) {
  // eslint-disable-next-line no-console
  console.error(
    `You are running Node ${currentNodeVersion}.\n` +
      'Constellate requires Node 8 or higher. \n' +
      'Please update your version of Node.',
  )
  process.exit(1)
}

const program = require('commander')
const chalk = require('chalk')
const dedent = require('dedent')
const packageJson = require('../../package.json')
const createApp = require('../scripts/createApp')

console.log('')
console.log(chalk.bold(`create-constellate-app v${packageJson.version || '0.0.0-develop'}`))
console.log('')

const printHelp = () => {
  console.log('')
  console.log(
    dedent(`
    To bootstrap a Constellate application simply type the following command, providing the name of your project:

        ${chalk.blue('create-constellate-app')} ${chalk.green('my-project-name')}

    This will boostrap a blank Constellate application. Should you wish to boostrap an example implementation then pass an "-e" option.

        ${chalk.blue('create-constellate-app')} ${chalk.red('-e')} ${chalk.green('my-project-name')}

    Run ${chalk.blue('create-constellate-app --help')} to see all options.
`),
  )
  console.log('')
}

let appName

program
  .version(packageJson.version || '0.0.0-develop')
  .arguments('<project-directory>')
  .usage(`${chalk.green('<project-directory>')} [options]`)
  .action((name) => {
    appName = name
  })
  .option('-e, --example', 'Bootstraps an example implementation')
  .on('--help', printHelp)
  .parse(process.argv)

if (appName === undefined) {
  printHelp()
  process.exit(0)
}

createApp(appName, { example: program.example })
