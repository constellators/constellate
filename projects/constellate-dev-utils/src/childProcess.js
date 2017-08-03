/**
 * Tons of inspiration taken from the amazing Lerna project.
 * https://github.com/lerna/lerna
 * ❤️
 */

const execa = require('execa')
const TerminalUtils = require('./terminal')

// :: (string, ?Array<string>, ?Object) -> Promise<string, Error>
function exec(command, args = [], opts = {}) {
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

// :: (string, ?Array<string>, ?Object) -> string
// throws Error
function execSync(command, args = [], opts = {}) {
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

// :: (string, ?Array<string>, ?Object) -> Promise
function spawn(command, args = [], opts = {}) {
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
