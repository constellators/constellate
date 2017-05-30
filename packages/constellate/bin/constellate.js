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

function list(val) {
  return val.split('..')
}

console.log(`\nConstellate v${packageJson.version}\n`)

program.version(packageJson.version)

program
  .command('bootstrap')
  .description('bootstraps the projects')
  .option('-p, --projects <projects>', 'specify the projects to bootstrap', list)
  .action(({ projects }) => {
    terminal.info('Running bootstrap')
    // If no NODE_ENV is set we will default to 'production'.
    if (!process.env.NODE_ENV) {
      process.env.NODE_ENV = 'production'
    }
    const bootstrap = require('../scripts/bootstrap')
    return resolveProjects(projects)
      .then(bootstrap)
      .then(() => terminal.success('Bootstrap succeeded'))
      .catch(err => terminal.error('Bootstrap failed', err))
  })

program
  .command('update')
  .description('runs an interactive dependency update process for the projects')
  .option('-p, --projects <projects>', 'specify the projects to update', list)
  .action(({ projects }) => {
    terminal.info('Running update')
    // If no NODE_ENV is set we will default to 'production'.
    if (!process.env.NODE_ENV) {
      process.env.NODE_ENV = 'production'
    }
    const update = require('../scripts/update')
    return resolveProjects(projects)
      .then(update)
      .then(() => terminal.success('Update succeeded'))
      .catch(err => terminal.error('Update failed', err))
  })

program
  .command('build')
  .description('build the projects')
  .option('-p, --projects <projects>', 'specify the projects to build', list)
  .action(({ projects }) => {
    terminal.info('Running build')
    // If no NODE_ENV is set we will default to 'production'.
    if (!process.env.NODE_ENV) {
      process.env.NODE_ENV = 'production'
    }
    const build = require('../scripts/build')
    return resolveProjects(projects)
      .then(build)
      .then(() => terminal.success('Build succeeded'))
      .catch(err => terminal.error('Build failed', err))
  })

program
  .command('clean')
  .description('Deletes the node_modules and build files for all the projects')
  .action(() => {
    terminal.info('Running clean')
    const clean = require('../scripts/clean')
    return resolveProjects()
      .then(clean)
      .then(() => terminal.success('Clean finished'))
      .catch(err => terminal.error('Clean failed', err))
  })

program
  .command('develop')
  .description('run development servers for the projects')
  .option('-p, --projects <projects>', 'specify the projects to develop', list)
  .action(({ projects }) => {
    terminal.info('Starting develop mode')
    // If no NODE_ENV is set we will default to 'development'.
    if (!process.env.NODE_ENV) {
      process.env.NODE_ENV = 'development'
    }
    const develop = require('../scripts/develop')
    resolveProjects(projects).then(develop)
  })

program
  .command('publish')
  .description('publishes the projects')
  // .option('-p, --projects <projects>', 'specify the projects to publish', list)
  .action(() => {
    terminal.info('Starting publish process')
    // If no NODE_ENV is set we will default to 'production'.
    if (!process.env.NODE_ENV) {
      process.env.NODE_ENV = 'production'
    }
    const publish = require('../scripts/publish')
    resolveProjects().then(publish)
  })

program.parse(process.argv)
