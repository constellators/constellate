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
const R = require('ramda')
const TerminalUtils = require('constellate-dev-utils/modules/terminal')
const ProjectUtils = require('constellate-dev-utils/modules/projects')
const packageJson = require('../../package.json')

TerminalUtils.header(`constellate v${packageJson.version || '0.0.0-develop'}`)

const OptionValueHandlers = {
  list(val) {
    return val.split(',')
  },
}

program.version(packageJson.version || '0.0.0-develop')

program
  .command('bootstrap')
  .description('Installs the dependencies for the application and each project')
  .action(() => {
    TerminalUtils.title('Running bootstrap...')
    // We must not use "production" as a NODE_ENV because then only our
    // production dependencies will get installed, i.e. no devDependencies
    process.env.NODE_ENV = 'development'
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
    // We must not use "production" as a NODE_ENV because then only our
    // production dependencies will get installed, i.e. no devDependencies
    process.env.NODE_ENV = 'development'
    const update = require('../scripts/update')
    return ProjectUtils.resolveProjects()
      .then(update)
      .then(() => TerminalUtils.success('Done'))
      .catch(err => TerminalUtils.error('Eeek, an error!', err))
  })

program
  .command('build')
  .description('Builds the projects')
  .option('-p, --projects <projects>', 'Specify the projects to build', OptionValueHandlers.list)
  .action(({ projects }) => {
    TerminalUtils.title('Running build...')
    if (!process.env.NODE_ENV) {
      process.env.NODE_ENV = 'production'
    }
    const build = require('../scripts/build')
    ProjectUtils.resolveProjects(projects)
      .then(build)
      .then(() => TerminalUtils.success('Done'))
      .catch(err => TerminalUtils.error('Eeek, an error!', err))
  })

program
  .command('clean')
  .description('Deletes the build, node_modules, and package-lock.json files for projects')
  .option('-p, --projects <projects>', 'Specify the projects to clean', OptionValueHandlers.list)
  .action(({ projects }) => {
    TerminalUtils.title('Running clean...')
    const clean = require('../scripts/clean')
    return ProjectUtils.resolveProjects(projects)
      .then(clean)
      .then(() => TerminalUtils.success('Done'))
      .catch(err => TerminalUtils.error('Eeek, an error!', err))
  })

program
  .command('develop')
  .description('Run development servers for the projects')
  .option('-p, --projects <projects>', 'Specify the projects to develop', OptionValueHandlers.list)
  .action(({ projects }) => {
    TerminalUtils.title('Kickstarting development hyperengine...')
    // eslint-disable-next-line no-console
    console.log(`\n${require('../utils/getCarlSaganQuote')()}`)
    setTimeout(() => {
      if (!process.env.NODE_ENV) {
        process.env.NODE_ENV = 'development'
      }
      const develop = require('../scripts/develop')
      ProjectUtils.resolveProjects(projects).then(develop)
    }, 2000)
  })

program
  .command('publish')
  .description('Publish your projects')
  .option('-p, --projects <projects>', 'Specify the projects to publish', OptionValueHandlers.list)
  .option(
    '-f, --force',
    'Forces publishing of projects even if there are no changes to them',
    R.always(true),
  )
  .action(({ projects, force }) => {
    TerminalUtils.title('Running publish...')
    if (!process.env.NODE_ENV) {
      process.env.NODE_ENV = 'production'
    }
    const publish = require('../scripts/publish')
    ProjectUtils.resolveProjects(projects)
      .then(toPublish => publish(toPublish, { force }))
      .then(() => TerminalUtils.success('Done'))
      .catch(err => TerminalUtils.error('Eeek, an error!', err))
  })

program.parse(process.argv)
