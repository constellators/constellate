#!/usr/bin/env node
/* eslint-disable no-case-declarations */
/* eslint-disable global-require */

const handleUnhandledRejections = () => {
  // Makes the script crash on unhandled rejections instead of silently
  // ignoring them. In the future, promise rejections that are not handled will
  // terminate the Node.js process with a non-zero exit code.
  process.on('unhandledRejection', (err) => {
    throw err
  })
}

const preventScriptExit = () => {
  // prevent node process from exiting. (until CTRL + C is pressed at least)
  (function wait() {
    // eslint-disable-next-line no-constant-condition
    if (true) setTimeout(wait, 1000)
  }())
}

const program = require('commander')
const TerminalUtils = require('constellate-dev-utils/modules/terminal')
const ProjectUtils = require('constellate-dev-utils/modules/projects')
const packageJson = require('../../package.json')
const loadEnvVars = require('../utils/loadEnvVars')

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
  .action(async () => {
    try {
      handleUnhandledRejections()
      TerminalUtils.title('Running bootstrap...')
      // We must not use "production" as a NODE_ENV because then only our
      // production dependencies will get installed, i.e. no devDependencies
      process.env.NODE_ENV = 'development'
      const bootstrap = require('../scripts/bootstrap')
      const projects = await ProjectUtils.resolveProjects()
      await bootstrap(projects)
      TerminalUtils.success('Done')
      process.exit(0)
    } catch (err) {
      TerminalUtils.error('Eeek, an error!', err)
      process.exit(1)
    }
  })

program
  .command('update')
  .description('Runs an interactive dependency update process for the application and each project')
  .action(async () => {
    try {
      handleUnhandledRejections()
      TerminalUtils.title('Running update...')
      // We must not use "production" as a NODE_ENV because then only our
      // production dependencies will get installed, i.e. no devDependencies
      process.env.NODE_ENV = 'development'
      const update = require('../scripts/update')
      const projects = await ProjectUtils.resolveProjects()
      await update(projects)
      TerminalUtils.success('Done')
      process.exit(0)
    } catch (err) {
      TerminalUtils.error('Eeek, an error!', err)
      process.exit(1)
    }
  })

program.command('link').description('Links the projects').action(async () => {
  try {
    handleUnhandledRejections()
    TerminalUtils.title('Linking projects...')
    const link = require('../scripts/link')
    const projects = await ProjectUtils.resolveProjects()
    await link(projects)
    TerminalUtils.success('Done')
    process.exit(0)
  } catch (err) {
    TerminalUtils.error('Eeek, an error!', err)
    process.exit(1)
  }
})

program.command('unlink').description('Unlinks the projects').action(async () => {
  try {
    handleUnhandledRejections()
    TerminalUtils.title('Unlinking projects...')
    const unlink = require('../scripts/unlink')
    const projects = await ProjectUtils.resolveProjects()
    await unlink(projects)
    TerminalUtils.success('Done')
    process.exit(0)
  } catch (err) {
    TerminalUtils.error('Eeek, an error!', err)
    process.exit(1)
  }
})

program
  .command('build')
  .description('Builds the projects')
  .option('-p, --projects <projects>', 'Specify the projects to build', OptionValueHandlers.list)
  .action(async ({ projects }) => {
    try {
      handleUnhandledRejections()
      TerminalUtils.title('Running build...')
      if (!process.env.NODE_ENV) {
        process.env.NODE_ENV = 'production'
      }
      const build = require('../scripts/build')
      const projectsToBuild = await ProjectUtils.resolveProjects(projects)
      await build(projectsToBuild)
      TerminalUtils.success('Done')
      process.exit(0)
    } catch (err) {
      TerminalUtils.error('Eeek, an error!', err)
      process.exit(1)
    }
  })

program
  .command('clean')
  .description('Deletes the build and node_modules files for projects')
  .option('-p, --projects <projects>', 'Specify the projects to clean', OptionValueHandlers.list)
  .action(async ({ projects }) => {
    try {
      handleUnhandledRejections()
      TerminalUtils.title('Running clean...')
      const clean = require('../scripts/clean')
      const projectsToClean = await ProjectUtils.resolveProjects(projects)
      await clean(projectsToClean)
      TerminalUtils.success('Done')
      process.exit(0)
    } catch (err) {
      TerminalUtils.error('Eeek, an error!', err)
      process.exit(1)
    }
  })

program
  .command('develop')
  .description('Run development servers for the projects')
  .option('-p, --projects <projects>', 'Specify the projects to develop', OptionValueHandlers.list)
  .action(async ({ projects }) => {
    try {
      TerminalUtils.title('Kickstarting development hyperengine...')
      // eslint-disable-next-line no-console
      console.log(`\n${require('../utils/getCarlSaganQuote')()}`)

      await new Promise(resolve => setTimeout(resolve, 2000))

      if (!process.env.NODE_ENV) {
        process.env.NODE_ENV = 'development'
      }
      loadEnvVars()
      const develop = require('../scripts/develop')
      const projectsToDevelop = await ProjectUtils.resolveProjects(projects)
      await develop(projectsToDevelop)
    } catch (err) {
      TerminalUtils.error('Eeek, an error!', err)
      process.exit(1)
    }
  })

program
  .command('release')
  .description('Creates a release for all the projects that have changed')
  .action(async () => {
    try {
      TerminalUtils.title('Running release...')
      if (!process.env.NODE_ENV) {
        process.env.NODE_ENV = 'production'
      }
      const release = require('../scripts/release')
      await release()
      process.exit(0)
    } catch (err) {
      TerminalUtils.error('Eeek, an error!', err)
      process.exit(1)
    }
  })

program
  .command('publish')
  .description('Publish your projects to a NPM registry')
  .action(async () => {
    try {
      TerminalUtils.title('Running publish...')
      if (!process.env.NODE_ENV) {
        process.env.NODE_ENV = 'production'
      }
      const publish = require('../scripts/publish')
      const projects = await ProjectUtils.resolveProjects()
      await publish(projects)
      TerminalUtils.success('Done')
      process.exit(0)
    } catch (err) {
      TerminalUtils.error('Eeek, an error!', err)
      process.exit(1)
    }
  })

// TODO: Catch all help print
program.command('*').action(() => {
  console.log('TODO: Show help')
  process.exit(0)
})

program.parse(process.argv)

// We do this to allow our scripts to respont to process exit events and do
// cleaning up etc.
preventScriptExit()
