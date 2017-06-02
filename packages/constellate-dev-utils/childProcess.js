/**
 * Tons of inspiration taken from the amazing Lerna project.
 * https://github.com/lerna/lerna
 * ❤️
 */

const { spawn } = require('execa')

function _spawn(command, args, opts, callback) {
  const child = spawn(command, args, opts)

  if (callback) {
    child.then(result => callback(null, result.stdout), err => callback(err))
  }

  return child
}

module.exports = class ChildProcessUtilities {
  static exec(command, args, opts, callback) {
    const options = Object.assign({}, opts)
    options.stdio = 'pipe' // node default

    return _spawn(command, args, options, callback)
  }

  static execSync(command, args, opts) {
    return spawn.sync(command, args, opts).stdout
  }

  static spawn(command, args, opts, callback) {
    const options = Object.assign({}, opts)
    options.stdio = 'inherit'

    return _spawn(command, args, options, callback)
  }
}
