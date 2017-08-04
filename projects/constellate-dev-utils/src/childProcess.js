// @flow

import type { ChildProcess } from 'child_process'

const execa = require('execa')
const TerminalUtils = require('./terminal')

function exec(command: string, args?: Array<string> = [], opts?: Object = {}): Promise<string> {
  TerminalUtils.verbose(
    `exec child process: ${command} ${args.join(' ')}${opts.cwd ? ` (${opts.cwd})` : ''}`,
  )

  return execa(
    command,
    args,
    Object.assign(
      {},
      {
        env: process.env,
        stdio: 'pipe',
      },
      opts,
    ),
  ).then(result => result.stdout)
}

function execSync(command: string, args?: Array<string> = [], opts?: Object = {}): string {
  TerminalUtils.verbose(
    `execSync child process: ${command} ${args.join(' ')}${opts.cwd ? ` (${opts.cwd})` : ''}`,
  )

  return execa.sync(
    command,
    args,
    Object.assign(
      {},
      {
        env: process.env,
      },
      opts,
    ),
  ).stdout
}

function spawn(
  command: string,
  args?: Array<string> = [],
  opts?: Object = {},
): Promise<ChildProcess> {
  TerminalUtils.verbose(
    `spawn child process: ${command} ${args.join(' ')}${opts.cwd ? ` (${opts.cwd})` : ''}`,
  )

  return execa(
    command,
    args,
    Object.assign(
      {},
      {
        env: process.env,
        stdio: 'inherit',
      },
      opts,
    ),
  )
}

module.exports = {
  exec,
  execSync,
  spawn,
}
