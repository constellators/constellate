#!/usr/bin/env node
// @flow
/* eslint-disable no-case-declarations */
/* eslint-disable global-require */

const program = require('commander')
const { TerminalUtils } = require('constellate-dev-utils')
const { configureGracefulExit, loadEnvVars } = require('constellate-utils')
const packageJson = require('../../package.json')

const noop = () => undefined

const ArgParsers = {
  list: val => val.split(','),
}

type CreateActionArgs = {
  defaultEnv?: string,
  resolveScript: (Object, Array<string>) => () => Promise<void>,
  gracefulExit?: () => void,
  errorMsg?: string,
  preScript?: () => Promise<mixed>,
}

const createAction = ({
  defaultEnv = 'production',
  resolveScript,
  gracefulExit = noop,
  errorMsg,
  preScript,
}: CreateActionArgs) => async (...originalArgs) => {
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
      // eslint-disable-next-line prefer-destructuring
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

TerminalUtils.header(`constellate v${packageJson.version || '0.0.0-develop'}`)

program.version(packageJson.version || '0.0.0-develop')

program
  .command('build', 'Executes the configured build plugin for each package')
  .action(
    createAction({
      resolveScript: () => require('../scripts/build'),
    }),
  )

program
  .command('clean')
  .description(
    'Deletes the build output for packages, with additional option to delete node_modules dirs',
  )
  .option(
    '-p, --packages <packages>',
    'Specify the packages to run the clean for (defaults to all)',
    ArgParsers.list,
  )
  .option('-n, --node-modules', 'Removes node_modules for each package')
  .option('-b, --build', 'Removes build output for each package')
  .action(
    createAction({
      resolveScript: options => () => require('../scripts/clean')(options),
    }),
  )

program
  .command('deploy')
  .description('Executes the configured deploy plugin for all packages')
  .action(
    createAction({
      resolveScript: () => require('../scripts/deploy'),
      errorMsg:
        'Your packages may not have been fully deployed. Please check your expected deployment targets.',
    }),
  )

program
  .command('develop')
  .description('Runs a development environment for the packages')
  .action(
    createAction({
      defaultEnv: 'development',
      preScript: () => {
        TerminalUtils.title('Starting development hyperengine...')
        return new Promise(resolve => setTimeout(resolve, 3000))
      },
      resolveScript: () => require('../scripts/develop'),
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

// If the user passes no args, or an unknown arg then we will show the help
const showHelp = () => {
  program.outputHelp()
  process.exit(0)
}

if (process.argv.slice(2).length === 0) {
  showHelp()
} else {
  const [cmd, ...args] = process.argv.slice(2)

  const validCommands = ['build', 'clean', 'deploy', 'jest', 'exec']

  if (!validCommands.find(x => x === cmd)) {
    TerminalUtils.error(`Invalid command: ${cmd}`)

    showHelp()
  } else if (
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
