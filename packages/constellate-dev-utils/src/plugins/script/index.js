// @flow

import type { ChildProcess } from 'child_process'
import type {
  Package,
  BuildPlugin,
  DevelopPlugin,
  DeployPlugin,
} from '../../types'

const R = require('ramda')
const readPkg = require('read-pkg')
const TerminalUtils = require('../../terminal')
const ChildProcessUtils = require('../../childProcess')
const DevelopPluginUtils = require('../utils')

type Options = {
  scriptName?: string,
  scriptRunOnce?: boolean,
}

type TaskName = 'build' | 'develop' | 'deploy' | 'clean'

type ChildProcessMap = {
  [key: TaskName]: {
    [key: Package]: ChildProcess,
  },
}

module.exports = function scriptPlugin(
  pkg: Package,
  options: Options,
): BuildPlugin & DevelopPlugin & DeployPlugin {
  if (!options.scriptName || typeof options.scriptName !== 'string') {
    throw new Error(
      `No scriptName was provided for the develop configuration of ${
        pkg.name
      }.`,
    )
  }
  const childProcessMap: ChildProcessMap = {
    build: {},
    clean: {},
    develop: {},
    deploy: {},
  }

  const addChildProcess = (task: TaskName, processInstance: ChildProcess) => {
    childProcessMap[task][pkg] = processInstance
  }

  const getChildProcess = (task: TaskName) => childProcessMap[task][pkg]

  const killChildProcessFor = (task: TaskName) => {
    const childProcess = getChildProcess(task)
    if (!childProcess) {
      TerminalUtils.verbose(
        `No running "${task}" script process for ${pkg.name} to kill`,
      )
      return Promise.resolve()
    }
    return DevelopPluginUtils.killChildProcess(pkg, childProcess).then(() => {
      TerminalUtils.verbose(
        `Killed "${task}" script process for ${pkg.name} successfully`,
      )
      if (childProcessMap[task]) {
        delete childProcessMap[task]
      }
    })
  }

  const pkgJson = readPkg.sync(pkg.paths.packageJson)

  const runScript = (task: TaskName) => async () => {
    const returnAPI = {
      kill: () => killChildProcessFor(task),
    }

    const existingProcess = getChildProcess(task)
    if (options.scriptRunOnce && existingProcess) {
      return returnAPI
    }

    if (existingProcess) {
      await killChildProcessFor(task)
    }

    await new Promise((resolve, reject) => {
      const scriptCmd = R.path(['scripts', options.scriptName], pkgJson)
      if (!scriptCmd || R.isEmpty(scriptCmd)) {
        throw new Error(
          `Could not resolve script named "${options.scriptName}" on ${
            pkg.name
          }`,
        )
      }

      TerminalUtils.info(
        `Executing script "${options.scriptName}" for ${pkg.name}`,
      )

      const childProcess = ChildProcessUtils.spawn(
        'npm',
        ['run', options.scriptName],
        {
          stdio: 'inherit',
          cwd: pkg.paths.packageRoot,
        },
      )
      childProcess.catch(err => {
        TerminalUtils.verbose(
          `Error executing script "${options.scriptName}" for ${pkg.name}`,
        )
        reject(err)
      })

      // Give the catch above a tick of space, so that it can resolve any
      // error that may have occurred
      process.nextTick(() => {
        childProcess.on('close', () => {
          TerminalUtils.verbose(
            `Stopped script "${options.scriptName}" process for ${pkg.name}`,
          )
        })
        addChildProcess(task, childProcess)
        resolve()
      })
    })

    return returnAPI
  }

  return {
    name: 'constellate-core-plugin/script',
    build: runScript('build'),
    clean: runScript('clean'),
    develop: runScript('develop'),
    deploy: runScript('deploy'),
  }
}
