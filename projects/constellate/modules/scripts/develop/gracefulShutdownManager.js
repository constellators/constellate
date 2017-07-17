const R = require('ramda')
const AppUtils = require('constellate-dev-utils/modules/app')
const TerminalUtils = require('constellate-dev-utils/modules/terminal')

module.exports = function gracefulShutdownManager(projectDevelopConductors, projectWatchers) {
  let shuttingDown = false
  let postDevelopRun = false

  const appConfig = AppUtils.getConfig()
  const postDevelopHook = R.path(['commands', 'develop', 'pre'], appConfig)

  const ensurePostDevelopHookRun = async () => {
    if (postDevelopHook && !postDevelopRun) {
      TerminalUtils.info('Running post develop hook')
      await postDevelopHook()
    }
    postDevelopRun = true
  }

  async function performGracefulShutdown(exitCode) {
    // Avoid multiple calls (e.g. if ctrl+c pressed multiple times)
    if (shuttingDown) return
    shuttingDown = true
    try {
      TerminalUtils.info('Shutting down development environment...')

      // This will ensure that the process exits after a 10 second grace period.
      // Hopefully all the dispose functions below would have completed
      setTimeout(async () => {
        TerminalUtils.verbose('Forcing shutdown after grace period')
        setTimeout(() => {
          TerminalUtils.warning(
            'Your post develop hook seems to be taking a long time to complete.  10 seconds have passed so we are now forcing an exit on the develop process.',
          )
          process.exit(1)
        }, 10 * 1000)
        // Even if we are forcing an exit we should wait for pross develop
        // hook to execute
        await ensurePostDevelopHookRun()
        process.exit(1)
      }, 10 * 1000)

      // Firstly kill all our projectWatchers.
      Object.keys(projectWatchers).forEach(projectName => projectWatchers[projectName].stop())

      // Then call off the `.stop()` against all our project conductors.
      await Promise.all(
        R.values(projectDevelopConductors).map(projectDevelopConductor =>
          projectDevelopConductor.stop(),
        ),
      )

      // Then call the post develop hook
      await ensurePostDevelopHookRun()
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
