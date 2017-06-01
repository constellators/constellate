#!/usr/bin/env node
/* eslint-disable no-case-declarations */
/* eslint-disable global-require */

// Makes the script crash on unhandled rejections instead of silently
// ignoring them. In the future, promise rejections that are not handled will
// terminate the Node.js process with a non-zero exit code.
process.on('unhandledRejection', (err) => {
  throw err
})

const program = require('commander')
const terminal = require('constellate-dev-utils/terminal')

const packageJson = require('../package.json')
const resolveProjects = require('../projects/resolveProjects')
const getCarlSaganQuote = require('../utils/getCarlSaganQuote')

function list(val) {
  return val.split('..')
}

terminal.header(`constellate v${packageJson.version}`)

console.log(`\n${getCarlSaganQuote()}`)

program.version(packageJson.version)

program
  .command('install')
  .description('Installs the dependencies for application and each project')
  .action(() => {
    terminal.title('Starting install...')
    // If no NODE_ENV is set we will default to 'production'.
    if (!process.env.NODE_ENV) {
      process.env.NODE_ENV = 'production'
    }
    const bootstrap = require('../scripts/install')
    return resolveProjects()
      .then(bootstrap)
      .then(() => terminal.success('Done'))
      .catch(err => terminal.error('Eeek, an error!', err))
  })

program
  .command('update')
  .description('Runs an interactive dependency update process for the application and each project')
  .action(() => {
    terminal.title('Running update...')
    // If no NODE_ENV is set we will default to 'production'.
    if (!process.env.NODE_ENV) {
      process.env.NODE_ENV = 'production'
    }
    const update = require('../scripts/update')
    return resolveProjects()
      .then(update)
      .then(() => terminal.success('Done'))
      .catch(err => terminal.error('Eeek, an error!', err))
  })

program
  .command('build')
  .description('Builds the projects')
  .option('-p, --projects <projects>', 'specify the projects to build', list)
  .action(({ projects }) => {
    terminal.title('Running build...')
    // If no NODE_ENV is set we will default to 'production'.
    if (!process.env.NODE_ENV) {
      process.env.NODE_ENV = 'production'
    }
    const build = require('../scripts/build')
    return resolveProjects(projects)
      .then(build)
      .then(() => terminal.success('Done'))
      .catch(err => terminal.error('Eeek, an error!', err))
  })

program
  .command('clean')
  .description('Deletes the all build and node_modules directories')
  .action(() => {
    terminal.title('Running clean...')
    const clean = require('../scripts/clean')
    return resolveProjects()
      .then(clean)
      .then(() => terminal.success('Done'))
      .catch(err => terminal.error('Eeek, an error!', err))
  })

program
  .command('develop')
  .description('run development servers for the projects')
  .option('-p, --projects <projects>', 'specify the projects to develop', list)
  .action(({ projects }) => {
    terminal.title('Kickstarting development hyperengine...')
    // If no NODE_ENV is set we will default to 'development'.
    if (!process.env.NODE_ENV) {
      process.env.NODE_ENV = 'development'
    }
    const develop = require('../scripts/develop')
    resolveProjects(projects).then(develop)
  })

program.command('publish').description('Publish your projects to NPM').action(() => {
  terminal.title('Running publish...')
  // If no NODE_ENV is set we will default to 'production'.
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'production'
  }
  const publish = require('../scripts/publish')
  resolveProjects()
    .then(publish)
    .then(() => terminal.success('Done'))
    .catch(err => terminal.error('Eeek, an error!', err))
})

program.parse(process.argv)
