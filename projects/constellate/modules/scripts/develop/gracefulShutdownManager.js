const R = require('ramda')
const TerminalUtils = require('constellate-dev-utils/modules/terminal')

module.exports = function gracefulShutdownManager(projectDevelopConductors, projectWatchers) {
  let shuttingDown = false

  function performGracefulShutdown() {
    // Avoid multiple calls (e.g. if ctrl+c pressed multiple times)
    if (shuttingDown) return
    shuttingDown = true

    TerminalUtils.info('Shutting down development environment...')

    // Firstly kill all our projectWatchers.
    Object.keys(projectWatchers).forEach(projectName => projectWatchers[projectName].stop())

    // Then call off the `.kill()` against all our project conductors.
    Promise.all(
      R.values(projectDevelopConductors).map(projectDevelopConductor =>
        projectDevelopConductor.stop(),
      ),
    )
      .catch((err) => {
        TerminalUtils.error(
          'An error occurred whilst shutting down the development environment',
          err,
        )
        process.exit(1)
      })
      .then(() => process.exit(0))

    setTimeout(() => {
      TerminalUtils.verbose('Forcing shutdown after grace period')
      process.exit(0)
    }, 5 * 1000)
  }

  // Ensure that we perform a graceful shutdown when any of the following
  // signals are sent to our process.
  ['SIGINT', 'SIGTERM'].forEach((signal) => {
    process.on(signal, () => {
      TerminalUtils.verbose(`Received ${signal} termination signal`)
      performGracefulShutdown()
    })
  })

  process.on('exit', () => {
    TerminalUtils.info('Till next time. *kiss*')
  })
}
