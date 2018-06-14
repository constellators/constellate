const TerminalUtils = require('../terminal')

function killChildProcess(package, childProcess) {
  TerminalUtils.verbose(`Killing ${package.name}...`)

  return new Promise(resolve => {
    let killed = false

    childProcess.on('close', () => {
      killed = true
    })

    childProcess.catch(err => {
      TerminalUtils.verbose(`${package.name} was not killed with errors`)
      TerminalUtils.verbose(err)
      resolve()
    })

    const checkInterval = setInterval(() => {
      if (killed) {
        TerminalUtils.verbose(`Kill for ${package.name} resolved`)
        clearInterval(checkInterval)
        resolve()
      }
    }, 50)

    childProcess.kill('SIGTERM')
  }).catch(err => {
    TerminalUtils.verbose(`Fatal error whilst killing ${package.name}`)
    throw err
  })
}

module.exports = { killChildProcess }
