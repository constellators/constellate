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
const TerminalUtils = require('constellate-dev-utils/terminal')
const ProjectUtils = require('../utils/projects')
const packageJson = require('../package.json')

function list(val) {
  return val.split('..')
}

TerminalUtils.header(`constellate v${packageJson.version}`)

if (process.env.NODE_ENV === 'development') {
  console.log(`\n${require('../utils/getCarlSaganQuote')()}`)
}

program.version(packageJson.version)

program
  .command('bootstrap')
  .description('Installs the dependencies for the application and each project')
  .action(() => {
    TerminalUtils.title('Starting install...')
    // If no NODE_ENV is set we will default to 'production'.
    if (!process.env.NODE_ENV) {
      process.env.NODE_ENV = 'production'
    }
    const bootstrap = require('../scripts/bootstrap')
    return ProjectUtils.resolveProjects()
      .then(bootstrap)
      .then(() => TerminalUtils.success('Done'))
      .catch(err => TerminalUtils.error('Eeek, an error!', err))
  })

program
  .command('update')
  .description('Runs an interactive dependency update process for the application and each project')
  .action(() => {
    TerminalUtils.title('Running update...')
    // If no NODE_ENV is set we will default to 'production'.
    if (!process.env.NODE_ENV) {
      process.env.NODE_ENV = 'production'
    }
    const update = require('../scripts/update')
    return ProjectUtils.resolveProjects()
      .then(update)
      .then(() => TerminalUtils.success('Done'))
      .catch(err => TerminalUtils.error('Eeek, an error!', err))
  })

program
  .command('build')
  .description('Builds the projects')
  .option('-p, --projects <projects>', 'specify the projects to build', list)
  .action(({ projects }) => {
    TerminalUtils.title('Running build...')
    // If no NODE_ENV is set we will default to 'production'.
    if (!process.env.NODE_ENV) {
      process.env.NODE_ENV = 'production'
    }
    const build = require('../scripts/build')
    Promise.all([ProjectUtils.resolveProjects(), ProjectUtils.resolveProjects(projects)])
      .then(([all, toBuild]) => build(all, toBuild))
      .then(() => TerminalUtils.success('Done'))
      .catch(err => TerminalUtils.error('Eeek, an error!', err))
  })

program
  .command('clean')
  .description('Deletes the all build and node_modules directories')
  .action(() => {
    TerminalUtils.title('Running clean...')
    const clean = require('../scripts/clean')
    return ProjectUtils.resolveProjects()
      .then(clean)
      .then(() => TerminalUtils.success('Done'))
      .catch(err => TerminalUtils.error('Eeek, an error!', err))
  })

program
  .command('develop')
  .description('run development servers for the projects')
  .option('-p, --projects <projects>', 'specify the projects to develop', list)
  .action(({ projects }) => {
    TerminalUtils.title('Kickstarting development hyperengine...')
    // If no NODE_ENV is set we will default to 'development'.
    if (!process.env.NODE_ENV) {
      process.env.NODE_ENV = 'development'
    }
    const develop = require('../scripts/develop')
    ProjectUtils.resolveProjects(projects).then(develop)
  })

program
  .command('publish')
  .description('Publish your projects')
  .option('-p, --projects <projects>', 'specify the projects to develop', list)
  .action(({ projects }) => {
    TerminalUtils.title('Running publish...')
    // If no NODE_ENV is set we will default to 'production'.
    if (!process.env.NODE_ENV) {
      process.env.NODE_ENV = 'production'
    }
    const publish = require('../scripts/publish')
    Promise.all([ProjectUtils.resolveProjects(), ProjectUtils.resolveProjects(projects)])
      .then(([all, toPublish]) => publish(all, toPublish))
      .then(() => TerminalUtils.success('Done'))
      .catch(err => TerminalUtils.error('Eeek, an error!', err))
  })

program.parse(process.argv)
