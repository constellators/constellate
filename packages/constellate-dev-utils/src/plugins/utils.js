// @flow

import type { ChildProcess } from 'child_process'
import type { Package } from '../types'

const TerminalUtils = require('../terminal')

function killChildProcess(
  pkg: Package,
  childProcess: ChildProcess,
): Promise<void> {
  TerminalUtils.verbose(`Killing ${pkg.name}...`)

  return new Promise(resolve => {
    let killed = false

    childProcess.on('close', () => {
      killed = true
    })

    childProcess.catch(err => {
      TerminalUtils.verbose(`${pkg.name} was not killed with errors`)
      TerminalUtils.verbose(err)
      resolve()
    })

    const checkInterval = setInterval(() => {
      if (killed) {
        TerminalUtils.verbose(`Kill for ${pkg.name} resolved`)
        clearInterval(checkInterval)
        resolve()
      }
    }, 50)

    childProcess.kill('SIGTERM')
  }).catch(err => {
    TerminalUtils.verbose(`Fatal error whilst killing ${pkg.name}`)
    throw err
  })
}

module.exports = { killChildProcess }
