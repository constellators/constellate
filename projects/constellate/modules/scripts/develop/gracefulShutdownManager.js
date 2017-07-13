const R = require('ramda')
const TerminalUtils = require('constellate-dev-utils/modules/terminal')

module.exports = function gracefulShutdownManager(projectDevelopConductors, projectWatchers) {
  let shuttingDown = false

  async function performGracefulShutdown(exitCode) {
    // Avoid multiple calls (e.g. if ctrl+c pressed multiple times)
    if (shuttingDown) return
    shuttingDown = true
    try {
      TerminalUtils.info('Shutting down development environment...')

      // This will ensure that the process exits after a 10 second grace period.
      // Hopefully all the dispose functions below would have completed
      setTimeout(() => {
        TerminalUtils.verbose('Forcing shutdown after grace period')
        process.exit(0)
      }, 10 * 1000)

      // Firstly kill all our projectWatchers.
      Object.keys(projectWatchers).forEach(projectName => projectWatchers[projectName].stop())

      // Then call off the `.stop()` against all our project conductors.
      await Promise.all(
        R.values(projectDevelopConductors).map(projectDevelopConductor =>
          projectDevelopConductor.stop(),
        ),
      )
    } catch (err) {
      TerminalUtils.error('An error occurred whilst shutting down the development environment', err)
      process.exit(1)
    }
    process.exit(exitCode)
  }

  // Ensure that we perform a graceful shutdown when any of the following
  // signals are sent to our process.
  ['SIGINT', 'SIGTERM'].forEach((signal) => {
    process.on(signal, () => {
      TerminalUtils.verbose(`Received ${signal} termination signal`)
      performGracefulShutdown(0)
    })
  })

  process.on('unhandledRejection', (err) => {
    TerminalUtils.error('Unhandled error.', err)
    performGracefulShutdown(1)
  })

  process.on('exit', () => {
    TerminalUtils.info('Till next time. *kiss*')
  })
}
