const TerminalUtils = require('constellate-dev-utils/modules/terminal')

module.exports = function configureGracefulExit(onExit) {
  if (typeof onExit !== 'function') {
    TerminalUtils.error('You must provide a "function" to configureGracefulExit')
  }

  let exiting = false

  const handleExit = (exitCode) => {
    if (exiting) {
      return
    }
    exiting = true
    Promise.resolve(onExit).then(() => process.exit(exitCode)).catch((err) => {
      TerminalUtils.error('An error occurred whilst attempting to gracefully exit.', err)
      process.exit(1)
    })
  }

  // Respond to any termination requests
  ;['SIGTERM', 'SIGINT'].forEach((signal) => {
    process.on(signal, () => handleExit(0))
  })

  // Catch any unhandled promise rejections
  process.on('unhandledRejection', (err) => {
    TerminalUtils.error('An unhandled rejection occurred', err)
    handleExit(1)
  })
}
