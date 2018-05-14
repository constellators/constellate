#!/usr/bin/env node
/* @flow */
/* eslint-disable no-case-declarations */
/* eslint-disable global-require */

const program = require('commander')
const { TerminalUtils } = require('constellate-dev-utils')
const { configureGracefulExit, loadEnvVars } = require('constellate-utils')
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

program
  .command('build')
  .description('Executes the configured build plugin for each project')
  .action(
    createAction({
      resolveScript: () => require('../scripts/build'),
    }),
  )

program
  .command('clean')
  .description(
    'Deletes the build output for projects, with additional option to delete node_modules dirs',
  )
  .option(
    '-p, --projects <projects>',
    'Specify the projects to run the clean for (defaults to all)',
    ArgParsers.list,
  )
  .option('-n, --node-modules', 'Removes node_modules for each project')
  .option('-b, --build', 'Removes build output for each project')
  .action(
    createAction({
      resolveScript: options => () => require('../scripts/clean')(options),
    }),
  )

program
  .command('deploy')
  .description('Executes the configured deploy plugin for all projects')
  .action(
    createAction({
      resolveScript: () => require('../scripts/deploy'),
      errorMsg:
        'Your projects may not have been fully deployed. Please check your expected deployment targets.',
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
  .description('Runs yarn install')
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
  .description(
    'Allows you to link projects to another project as dependencies, updating the package.json file respectively.',
  )
  .action(
    createAction({
      resolveScript: () => require('../scripts/linkProjects'),
    }),
  )

program
  .command('publish')
  .description(
    'Creates a new version, tagging the git repo, and publishing the new versions to NPM',
  )
  .option(
    '-p, --no-persist',
    'Does not persist the version number changes. Useful for temp or tagged package publishing.',
  )
  .option(
    '-f, --force',
    "Forces all projects to be published even if they don't have any changes.",
  )
  .option(
    '-t, --npm-tag <npmTag>',
    'Publishes to npm with the specified tag, defaulting to "latest"',
  )
  .action(
    createAction({
      resolveScript: options => () => require('../scripts/publish')(options),
    }),
  )

program
  .command('jest [args...]')
  .description('Executes jest')
  .action(() => {
    throw new Error('This action has a special handler')
  })

program
  .command('exec <cmd> [args...]')
  .description('Executed a provided command')
  .action(() => {
    throw new Error('This action has a special handler')
  })

program
  .command('update')
  .description(
    'Executes the yarn upgrade-interactive command (with --latest and --exact enabled)',
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
  program.outputHelp()
  process.exit(0)
}
program.command('*').action(showHelp)
if (!process.argv.slice(2).length) {
  showHelp()
}

const [cmd, ...args] = process.argv.slice(2)

if (
  // We have a special handler for the below two commands
  (cmd === 'jest' || cmd === 'exec') &&
  // And we don't run these special handlers if a help option was provided.
  args.find(x => x === '--help' || x === '-h') == null
) {
  const execScript = async (scriptThunk, defaultEnv) => {
    if (!process.env.NODE_ENV) {
      process.env.NODE_ENV = defaultEnv
    }
    loadEnvVars()
    await scriptThunk()
    process.exit(0)
  }

  switch (cmd) {
    case 'jest': {
      execScript(
        () =>
          require('../scripts/test')({
            passThroughArgs: args,
          }),
        'test',
      )
      break
    }
    case 'exec': {
      execScript(
        () =>
          require('../scripts/exec')({
            passThroughArgs: args,
          }),
        'development',
      )
      break
    }
    default: {
      throw new Error('Unknown custom action being handled')
    }
  }
} else {
  program.parse(process.argv)
}

// Prevent node process from exiting. (until CTRL + C or process.exit is called)
// We do this to allow our scripts to respont to process exit events and do
// cleaning up etc.
const preventScriptExit = () => {
  ;(function wait() {
    // eslint-disable-next-line no-constant-condition
    if (true) setTimeout(wait, 1000)
  })()
}
preventScriptExit()
