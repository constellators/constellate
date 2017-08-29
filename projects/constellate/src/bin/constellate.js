#!/usr/bin/env node
/* eslint-disable no-case-declarations */
/* eslint-disable global-require */

const program = require('commander')
const { TerminalUtils } = require('constellate-dev-utils')
const { configureGracefulExit, loadEnvVars } = require('constellate-utils')

const rollbackRepo = require('../utils/rollbackRepo')
const packageJson = require('../../package.json')

const noop = () => undefined

TerminalUtils.header(`constellate v${packageJson.version || '0.0.0-develop'}`)

program.version(packageJson.version || '0.0.0-develop')

const ArgParsers = {
  list: val => val.split(','),
}

const createAction = ({
  defaultEnv = 'production',
  resolveScript,
  gracefulExit = noop,
  errorMsg,
  preScript,
}) => async (...originalArgs) => {
  try {
    configureGracefulExit({
      onExit: gracefulExit,
      name: 'constellate',
    })
    if (!process.env.NODE_ENV) {
      process.env.NODE_ENV = defaultEnv
    }
    loadEnvVars()
    if (preScript) {
      await preScript()
    }

    let options
    let args = []
    if (args.length === 1) {
      options = originalArgs[0]
    } else {
      args = originalArgs.slice(0, originalArgs.length - 1)
      options = originalArgs[originalArgs.length - 1]
    }

    const script = resolveScript(options, args)
    await script()
    process.exit(0)
  } catch (err) {
    TerminalUtils.error('Argh! An unexpected error has occurred', err)
    if (errorMsg) {
      TerminalUtils.error(errorMsg)
    }
    gracefulExit()
    process.exit(1)
  }
}

program.command('build').description('Builds the projects').action(
  createAction({
    resolveScript: () => require('../scripts/build'),
  }),
)

program
  .command('clean')
  .description('Deletes the build output and node_modules files for projects')
  .option(
    '-p, --projects <projects>',
    'Specify the projects to run the install for (defaults to all)',
    ArgParsers.list,
  )
  .option('-n, --node-modules', 'Removes node_modules for each project')
  .option('-l, --package-lock', 'Removes package-lock.json for each project')
  .option('-b, --build', 'Removes build output for each project')
  .action(
    createAction({
      resolveScript: options => () => require('../scripts/clean')(options),
    }),
  )

program.command('deploy').description('Deploys the projects').action(
  createAction({
    resolveScript: () => require('../scripts/deploy'),
    errorMsg: 'Your projects may not have been fully deployed. Please check your expected deployment targets.',
  }),
)

program
  .command('develop')
  .description('Runs a development environment for the projects')
  .action(
    createAction({
      defaultEnv: 'development',
      preScript: () => {
        TerminalUtils.title('Kickstarting development hyperengine...')
        console.log(`\n${require('../utils/getCarlSaganQuote')()}\n`)
        return new Promise(resolve => setTimeout(resolve, 3000))
      },
      resolveScript: () => require('../scripts/develop'),
    }),
  )

program
  .command('install')
  .description('Installs the dependencies for every project')
  .option(
    '-p, --projects <projects>',
    'Specify the projects to run the install for',
    ArgParsers.list,
  )
  .option('-c, --clean', 'Removes existing node_modules for each project')
  .option(
    '-h, --hard-clean',
    'Removes existing node_modules and package-lock.json for each project',
  )
  .action(
    createAction({
      // We should not use "production" as a NODE_ENV because then only our
      // production dependencies will get installed, i.e. no devDependencies
      defaultEnv: 'development',
      resolveScript: options => () => require('../scripts/install')(options),
    }),
  )

program
  .command('link-projects')
  .description('Links project(s) to a project')
  .action(
    createAction({
      resolveScript: () => require('../scripts/linkProjects'),
    }),
  )

program
  .command('release')
  .description(
    'Creates a new release, versioning the app, the changed projects, and published the changed projects to NPM',
  )
  .action(
    createAction({
      resolveScript: () => require('../scripts/release'),
      gracefulExit: rollbackRepo,
    }),
  )

program
  .command('test')
  .description('Runs the tests')
  .option('-w, --watch', 'Runs in watch mode')
  .action(
    createAction({
      defaultEnv: 'test',
      resolveScript: (options, args) => () =>
        require('../scripts/test')({
          passThroughArgs: args,
          watch: options.watch,
        }),
    }),
  )

program
  .command('update')
  .description(
    'Runs an interactive dependency update process for every project',
  )
  .action(
    createAction({
      // We should not use "production" as a NODE_ENV because then only our
      // production dependencies will get installed, i.e. no devDependencies
      defaultEnv: 'development',
      resolveScript: () => require('../scripts/update'),
    }),
  )

// If the user passes no args, or an unknown arg then we will show the help
const showHelp = () => {
  program.outputHelp(x => console.log(x))
  process.exit(0)
}
program.command('*').action(showHelp)
if (!process.argv.slice(2).length) {
  showHelp()
}

program.parse(process.argv)

// Prevent node process from exiting. (until CTRL + C or process.exit is called)
// We do this to allow our scripts to respont to process exit events and do
// cleaning up etc.
const preventScriptExit = () => {
  (function wait() {
    // eslint-disable-next-line no-constant-condition
    if (true) setTimeout(wait, 1000)
  }())
}
preventScriptExit()
