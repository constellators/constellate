const TerminalUtils = require('../terminal')

function killChildProcess(project, childProcess) {
  TerminalUtils.verbose(`Killing ${project.name}...`)

  return new Promise(resolve => {
    let killed = false

    childProcess.on('close', () => {
      killed = true
    })

    childProcess.catch(err => {
      TerminalUtils.verbose(`${project.name} was not killed with errors`)
      TerminalUtils.verbose(err)
      resolve()
    })

    const checkInterval = setInterval(() => {
      if (killed) {
        TerminalUtils.verbose(`Kill for ${project.name} resolved`)
        clearInterval(checkInterval)
        resolve()
      }
    }, 50)

    childProcess.kill('SIGTERM')
  }).catch(err => {
    TerminalUtils.verbose(`Fatal error whilst killing ${project.name}`)
    throw err
  })
}

module.exports = { killChildProcess }
