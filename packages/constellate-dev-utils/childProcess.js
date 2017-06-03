/**
 * Tons of inspiration taken from the amazing Lerna project.
 * https://github.com/lerna/lerna
 * ❤️
 */

const execa = require('execa')

function _spawn(command, args, opts) {
  return execa(command, args, opts).then(result => result.stdout)
}

// :: (string, ?Array<string>, ?Object) -> Promise<string, Error>
function exec(command, args, opts) {
  return _spawn(
    command,
    args,
    Object.assign(
      {},
      {
        stdio: 'pipe', // node default
      },
      opts
    )
  )
}

// :: (string, ?Array<string>, ?Object) -> string
// throws Error
function execSync(command, args, opts) {
  return execa.sync(command, args, opts).stdout
}

// :: (string, ?Array<string>, ?Object) -> Promise<string, Error>
function spawn(command, args, opts) {
  return _spawn(
    command,
    args,
    Object.assign(
      {},
      {
        stdio: 'inherit',
      },
      opts
    )
  )
}

module.exports = {
  exec,
  execSync,
  spawn,
}
